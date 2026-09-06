import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import Swal from 'sweetalert2';

import { Ingredient } from '../../../../core/models/ingredient.model';

import { IngredientService } from '../../../../core/services/admin/inventory/ingredient.service';

import { StockInService } from '../../../../core/services/admin/inventory/stock-in.service';

@Component({
  selector: 'app-stock-in',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './stock-in.component.html',
  styleUrl: './stock-in.component.scss',
})
export class StockInComponent implements OnInit {
  private ingredientService = inject(IngredientService);

  private stockInService = inject(StockInService);

  // =========================================================
  // INGREDIENTS
  // =========================================================

  ingredients = signal<Ingredient[]>([]);

  // =========================================================
  // UI STATE
  // =========================================================

  isLoading = signal(false);

  isSaving = signal(false);

  // =========================================================
  // FORM
  // =========================================================

  selectedIngredientId = signal<number | null>(null);

  quantity: number | null = null;

  /**
   * MANUAL recipe yield.
   *
   * Example:
   * 20 pcs
   */
  recipeYield: number | null = null;

  purchaseCost: number | null = null;

  supplier = '';

  notes = '';

  // =========================================================
  // SELECTED INGREDIENT
  // =========================================================

  selectedIngredient = computed(() => {
    const id = this.selectedIngredientId();

    if (id === null) {
      return null;
    }

    return this.ingredients().find((item) => item.id === Number(id)) ?? null;
  });

  // =========================================================
  // TOTAL COST
  // =========================================================

  get totalCost(): number {
    if (this.quantity === null || this.purchaseCost === null) {
      return 0;
    }

    return Number(this.quantity) * Number(this.purchaseCost);
  }

  // =========================================================
  // INIT
  // =========================================================

  async ngOnInit(): Promise<void> {
    await this.loadIngredients();
  }

  // =========================================================
  // LOAD INGREDIENTS
  // =========================================================

  async loadIngredients(): Promise<void> {
    this.isLoading.set(true);

    try {
      const data = await this.ingredientService.getIngredients();

      this.ingredients.set(data);
    } catch (error) {
      console.error('Failed to load ingredients:', error);

      await Swal.fire({
        icon: 'error',

        title: 'Unable to Load Ingredients',

        text: 'We could not load the ingredients from inventory. Please try again.',

        confirmButtonText: 'Close',

        confirmButtonColor: '#191919',
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  // =========================================================
  // RECEIVE STOCK
  // =========================================================

  async receiveStock(): Promise<void> {
    const ingredient = this.selectedIngredient();

    // =======================================================
    // INGREDIENT VALIDATION
    // =======================================================

    if (!ingredient) {
      await Swal.fire({
        icon: 'warning',

        title: 'Ingredient Required',

        text: 'Please select an ingredient before receiving stock.',

        confirmButtonColor: '#191919',
      });

      return;
    }

    // =======================================================
    // QUANTITY VALIDATION
    // =======================================================

    if (
      this.quantity === null ||
      !Number.isFinite(Number(this.quantity)) ||
      Number(this.quantity) <= 0
    ) {
      await Swal.fire({
        icon: 'warning',

        title: 'Invalid Quantity',

        text: `Please enter a quantity greater than zero in ${ingredient.unit}.`,

        confirmButtonColor: '#191919',
      });

      return;
    }

    // =======================================================
    // RECIPE YIELD VALIDATION
    // =======================================================

    if (
      this.recipeYield === null ||
      !Number.isFinite(Number(this.recipeYield)) ||
      Number(this.recipeYield) < 0
    ) {
      await Swal.fire({
        icon: 'warning',

        title: 'Recipe Yield Required',

        text: `Please enter the number of ${ingredient.recipeUnit} manually.`,

        confirmButtonColor: '#191919',
      });

      return;
    }

    // =======================================================
    // COST VALIDATION
    // =======================================================

    if (
      this.purchaseCost === null ||
      !Number.isFinite(Number(this.purchaseCost)) ||
      Number(this.purchaseCost) < 0
    ) {
      await Swal.fire({
        icon: 'warning',

        title: 'Invalid Cost',

        text: 'Please enter a valid purchase cost per unit.',

        confirmButtonColor: '#191919',
      });

      return;
    }

    // =======================================================
    // VALUES
    // =======================================================

    const receivedQuantity = Number(this.quantity);

    const manualRecipeYield = Number(this.recipeYield);

    const costPerUnit = Number(this.purchaseCost);

    const currentStock = Number(ingredient.stock) || 0;

    const newStock = currentStock + receivedQuantity;

    const totalCost = receivedQuantity * costPerUnit;

    // =======================================================
    // CONFIRMATION
    // =======================================================

    const result = await Swal.fire({
      icon: 'question',

      title: 'Receive this stock?',

      html: `
        <div style="text-align:center">

          <strong>
            ${this.escapeHtml(ingredient.name)}
          </strong>

          <br><br>

          <div>
            Current Stock:
            <strong>
              ${currentStock.toLocaleString()}
              ${this.escapeHtml(ingredient.unit)}
            </strong>
          </div>

          <div>
            Incoming Stock:
            <strong>
              +${receivedQuantity.toLocaleString()}
              ${this.escapeHtml(ingredient.unit)}
            </strong>
          </div>

          <br>

          <div>
            New Stock:
            <strong>
              ${newStock.toLocaleString()}
              ${this.escapeHtml(ingredient.unit)}
            </strong>
          </div>

          <br>

          <div>
            Recipe Yield:
            <strong>
              ${manualRecipeYield.toLocaleString()}
              ${this.escapeHtml(ingredient.recipeUnit)}
            </strong>
          </div>

          <br>

          <div>
            Cost per ${this.escapeHtml(ingredient.unit)}:
            <strong>
              ₱${costPerUnit.toFixed(2)}
            </strong>
          </div>

          <div>
            Total Purchase Cost:
            <strong>
              ₱${totalCost.toFixed(2)}
            </strong>
          </div>

          ${
            this.supplier.trim()
              ? `
                <br>

                <div>
                  Supplier:
                  <strong>
                    ${this.escapeHtml(this.supplier.trim())}
                  </strong>
                </div>
              `
              : ''
          }

        </div>
      `,

      showCancelButton: true,

      confirmButtonText: 'Yes, receive stock',

      cancelButtonText: 'Cancel',

      reverseButtons: true,

      confirmButtonColor: '#191919',

      cancelButtonColor: '#6b7280',

      focusCancel: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    // =======================================================
    // SAVE
    // =======================================================

    this.isSaving.set(true);

    try {
      const stockResult = await this.stockInService.receiveStock({
        ingredientId: ingredient.id,

        quantity: receivedQuantity,

        unit: ingredient.unit,

        // MANUAL ONLY
        recipeYield: manualRecipeYield,

        supplier: this.supplier.trim() || null,

        costPerUnit,

        notes: this.notes.trim() || null,
      });

      // =====================================================
      // UPDATE LOCAL INGREDIENT LIST
      // =====================================================

      this.ingredients.update((items) =>
        items.map((item) =>
          item.id === stockResult.ingredient.id ? stockResult.ingredient : item,
        ),
      );

      // =====================================================
      // SUCCESS
      // =====================================================

      await Swal.fire({
        icon: 'success',

        title: 'Stock Received',

        html: `
          <div style="text-align:center">

            <strong>
              ${this.escapeHtml(ingredient.name)}
            </strong>

            <br><br>

            <div>
              Added:
              <strong>
                +${receivedQuantity.toLocaleString()}
                ${this.escapeHtml(ingredient.unit)}
              </strong>
            </div>

            <div>
              New Stock:
              <strong>
                ${newStock.toLocaleString()}
                ${this.escapeHtml(ingredient.unit)}
              </strong>
            </div>

            <br>

            <div>
              Recipe Yield:
              <strong>
                ${manualRecipeYield.toLocaleString()}
                ${this.escapeHtml(ingredient.recipeUnit)}
              </strong>
            </div>

          </div>
        `,

        confirmButtonText: 'Done',

        confirmButtonColor: '#191919',
      });

      // =====================================================
      // RESET
      // =====================================================

      this.resetForm();
    } catch (error) {
      console.error('Failed to receive stock:', error);

      await Swal.fire({
        icon: 'error',

        title: 'Stock In Failed',

        text: 'Unable to receive stock. Please try again.',

        confirmButtonText: 'Close',

        confirmButtonColor: '#191919',
      });
    } finally {
      this.isSaving.set(false);
    }
  }

  // =========================================================
  // RESET FORM
  // =========================================================

  resetForm(): void {
    this.selectedIngredientId.set(null);

    this.quantity = null;

    this.recipeYield = null;

    this.purchaseCost = null;

    this.supplier = '';

    this.notes = '';
  }

  // =========================================================
  // HTML ESCAPE
  // =========================================================

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
