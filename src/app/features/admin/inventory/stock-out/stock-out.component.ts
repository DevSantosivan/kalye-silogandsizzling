import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import Swal from 'sweetalert2';

import { Ingredient } from '../../../../core/models/ingredient.model';

import { IngredientService } from '../../../../core/services/admin/inventory/ingredient.service';

import {
  StockOutService,
  StockOutPayload,
} from '../../../../core/services/admin/inventory/stock-out.service';

@Component({
  selector: 'app-stock-out',

  standalone: true,

  imports: [CommonModule, FormsModule, RouterLink],

  templateUrl: './stock-out.component.html',

  styleUrl: './stock-out.component.scss',
})
export class StockOutComponent implements OnInit {
  // =========================================================
  // SERVICES
  // =========================================================

  private ingredientService = inject(IngredientService);

  private stockOutService = inject(StockOutService);

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
  // STOCK OUT REASONS
  // =========================================================

  reasons = ['Spoilage', 'Damaged', 'Expired', 'Inventory Adjustment', 'Other'];

  // =========================================================
  // FORM
  // =========================================================

  selectedIngredientId = signal<number | null>(null);

  quantity: number | null = null;

  /**
   * MANUAL RECIPE YIELD WASTED
   *
   * Example:
   *
   * Stock Out = 2 kg
   * Recipe Yield Wasted = 5 pcs
   *
   * No automatic conversion.
   */
  recipeYieldWasted: number | null = null;

  reason = '';

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
  // REMAINING STOCK
  // =========================================================

  get remainingStock(): number {
    const ingredient = this.selectedIngredient();

    if (!ingredient) {
      return 0;
    }

    const currentStock = Number(ingredient.stock) || 0;

    const removeQuantity = Number(this.quantity) || 0;

    return Math.max(0, currentStock - removeQuantity);
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

        text: 'Something went wrong while loading the inventory.',

        confirmButtonText: 'Close',

        confirmButtonColor: '#191919',
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  // =========================================================
  // STOCK OUT
  // =========================================================

  async stockOut(): Promise<void> {
    const ingredient = this.selectedIngredient();

    // =======================================================
    // INGREDIENT VALIDATION
    // =======================================================

    if (!ingredient) {
      await Swal.fire({
        icon: 'warning',

        title: 'Ingredient Required',

        text: 'Please select an ingredient first.',

        confirmButtonColor: '#191919',
      });

      return;
    }

    // =======================================================
    // STOCK OUT QUANTITY
    // =======================================================

    const quantity = Number(this.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      await Swal.fire({
        icon: 'warning',

        title: 'Invalid Stock Out Quantity',

        text: `Enter a quantity greater than zero in ${ingredient.unit}.`,

        confirmButtonColor: '#191919',
      });

      return;
    }

    // =======================================================
    // AVAILABLE STOCK
    // =======================================================

    const currentStock = Number(ingredient.stock) || 0;

    if (quantity > currentStock) {
      await Swal.fire({
        icon: 'warning',

        title: 'Insufficient Stock',

        html: `
          <div style="text-align:center">

            <p>
              Stock Out:
              <strong>
                ${quantity.toLocaleString()}
                ${this.escapeHtml(ingredient.unit)}
              </strong>
            </p>

            <p>
              Available:
              <strong>
                ${currentStock.toLocaleString()}
                ${this.escapeHtml(ingredient.unit)}
              </strong>
            </p>

            <p
              style="
                margin-top:12px;
                color:#b63f3f;
              "
            >
              Stock Out quantity cannot exceed
              available inventory.
            </p>

          </div>
        `,

        confirmButtonColor: '#191919',
      });

      return;
    }

    // =======================================================
    // RECIPE YIELD WASTED
    // =======================================================

    const recipeYieldWasted = Number(this.recipeYieldWasted);

    if (
      !Number.isFinite(recipeYieldWasted) ||
      recipeYieldWasted < 0 ||
      !Number.isInteger(recipeYieldWasted)
    ) {
      await Swal.fire({
        icon: 'warning',

        title: 'Invalid Recipe Yield Wasted',

        text: `Enter how many ${ingredient.recipeUnit || 'pcs'} were wasted.`,

        confirmButtonColor: '#191919',
      });

      return;
    }

    // =======================================================
    // REASON
    // =======================================================

    if (!this.reason.trim()) {
      await Swal.fire({
        icon: 'warning',

        title: 'Reason Required',

        text: 'Please select a reason for this stock deduction.',

        confirmButtonColor: '#191919',
      });

      return;
    }

    // =======================================================
    // REMAINING STOCK
    // =======================================================

    const remaining = currentStock - quantity;

    // =======================================================
    // CONFIRMATION
    // =======================================================

    const confirmation = await Swal.fire({
      icon: 'question',

      title: 'Confirm Stock Out',

      html: `

          <div style="text-align:center">

            <strong
              style="font-size:17px;"
            >
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
              Stock Out:
              <strong style="color:#b63f3f;">
                -${quantity.toLocaleString()}
                ${this.escapeHtml(ingredient.unit)}
              </strong>
            </div>


            <div>
              Remaining:
              <strong>
                ${remaining.toLocaleString()}
                ${this.escapeHtml(ingredient.unit)}
              </strong>
            </div>


            <br>


            <div>
              Recipe Yield:
              <strong>
                ${(ingredient.recipeYield || 0).toLocaleString()}
                ${this.escapeHtml(ingredient.recipeUnit || 'pcs')}
              </strong>
            </div>


            <div>
              Recipe Yield Wasted:
              <strong style="color:#b63f3f;">
                ${recipeYieldWasted.toLocaleString()}
                ${this.escapeHtml(ingredient.recipeUnit || 'pcs')}
              </strong>
            </div>


            <br>


            <div>
              Reason:
              <strong>
                ${this.escapeHtml(this.reason.trim())}
              </strong>
            </div>


            ${
              this.notes.trim()
                ? `
                  <div style="margin-top:8px;">
                    Notes:
                    <strong>
                      ${this.escapeHtml(this.notes.trim())}
                    </strong>
                  </div>
                `
                : ''
            }

          </div>

        `,

      showCancelButton: true,

      confirmButtonText: 'Yes, remove stock',

      cancelButtonText: 'Cancel',

      reverseButtons: true,

      confirmButtonColor: '#b63f3f',

      cancelButtonColor: '#6b7280',

      focusCancel: true,
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    // =======================================================
    // SAVE
    // =======================================================

    this.isSaving.set(true);

    try {
      const payload: StockOutPayload = {
        ingredientId: ingredient.id,

        quantity,

        unit: ingredient.unit,

        recipeYieldWasted,

        recipeUnit: ingredient.recipeUnit || 'pcs',

        reason: this.reason.trim(),

        notes: this.notes.trim() || null,
      };

      const result = await this.stockOutService.stockOut(payload);

      // =====================================================
      // UPDATE LOCAL INGREDIENT
      // =====================================================

      this.ingredients.update((items) =>
        items.map((item) =>
          item.id === result.ingredient.id ? result.ingredient : item,
        ),
      );

      // =====================================================
      // SUCCESS
      // =====================================================

      await Swal.fire({
        icon: 'success',

        title: 'Stock Out Recorded',

        html: `

          <div style="text-align:center">

            <strong>
              ${this.escapeHtml(result.ingredient.name)}
            </strong>

            <br><br>


            <div>
              Stock Removed:
              <strong style="color:#b63f3f;">
                ${quantity.toLocaleString()}
                ${this.escapeHtml(result.ingredient.unit)}
              </strong>
            </div>


            <div>
              Recipe Yield Wasted:
              <strong style="color:#b63f3f;">
                ${recipeYieldWasted.toLocaleString()}
                ${this.escapeHtml(result.recipeUnit)}
              </strong>
            </div>


            <div>
              Remaining Stock:
              <strong>
                ${Number(result.ingredient.stock).toLocaleString()}
                ${this.escapeHtml(result.ingredient.unit)}
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
    } catch (error: any) {
      console.error('Manual stock out failed:', error);

      await Swal.fire({
        icon: 'error',

        title: 'Stock Out Failed',

        text: error?.message || 'Unable to process stock out.',

        confirmButtonText: 'Close',

        confirmButtonColor: '#191919',
      });
    } finally {
      this.isSaving.set(false);
    }
  }

  // =========================================================
  // RESET
  // =========================================================

  resetForm(): void {
    this.selectedIngredientId.set(null);

    this.quantity = null;

    this.recipeYieldWasted = null;

    this.reason = '';

    this.notes = '';
  }

  // =========================================================
  // ESCAPE HTML
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
