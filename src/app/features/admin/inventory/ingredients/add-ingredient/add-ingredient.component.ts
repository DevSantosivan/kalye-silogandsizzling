import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

import { IngredientService } from '../../../../../core/services/admin/inventory/ingredient.service';

@Component({
  selector: 'app-add-ingredient',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './add-ingredient.component.html',
  styleUrl: './add-ingredient.component.scss',
})
export class AddIngredientComponent {
  private router = inject(Router);
  private ingredientService = inject(IngredientService);

  // =========================================================
  // FORM
  // =========================================================

  ingredientName = '';
  category = '';

  // =========================================================
  // INVENTORY
  // =========================================================

  unit = '';

  stock: number | null = null;

  reorderLevel: number | null = null;

  /**
   * Total amount paid for the current stock.
   *
   * Example:
   *
   * 10 kg Pork Tapa
   * Total purchase cost = ₱1,500
   */
  totalPurchaseCost: number | null = null;

  // =========================================================
  // RECIPE
  // =========================================================

  /**
   * Unit used by staff when creating a menu recipe.
   *
   * Example:
   *
   * Pork Tapa -> pcs
   * Rice      -> g
   * Sauce     -> ml
   */
  recipeUnit = '';

  /**
   * How many recipe units can be produced
   * from the current inventory stock.
   *
   * Example:
   *
   * Stock = 10 kg
   * Recipe unit = pcs
   * Recipe yield = 30 pcs
   *
   * Therefore:
   *
   * 1 pcs = 10 / 30
   *        = 0.333333 kg
   */
  recipeYield: number | null = null;

  // =========================================================
  // UI
  // =========================================================

  isSaving = signal(false);

  // =========================================================
  // OPTIONS
  // =========================================================

  categories = [
    'Meat',
    'Rice',
    'Eggs',
    'Vegetables',
    'Sauces',
    'Condiments',
    'Cooking Oil',
    'Beverages',
    'Others',
  ];

  inventoryUnits = ['kg', 'g', 'L', 'mL', 'pcs'];

  recipeUnits = ['kg', 'g', 'mg', 'L', 'mL', 'pcs'];

  // =========================================================
  // UNIT CHANGE
  // =========================================================

  onInventoryUnitChange(): void {
    // Do not automatically change the recipe unit.
    //
    // Example:
    //
    // Inventory = kg
    // Recipe    = pcs
    //
    // This is perfectly valid.
  }

  // =========================================================
  // RECIPE UNIT CHANGE
  // =========================================================

  onRecipeUnitChange(): void {
    // The user decides the recipe unit.
    //
    // Example:
    //
    // kg -> pcs
    // kg -> g
    // L  -> mL
  }

  // =========================================================
  // INVENTORY COST PER UNIT
  // =========================================================

  /**
   * Calculates the purchase cost of one inventory unit.
   *
   * Example:
   *
   * 10 kg = ₱1,500
   *
   * ₱1,500 / 10 kg
   * = ₱150 / kg
   */
  getInventoryCostPerUnit(): number {
    if (
      this.stock === null ||
      this.stock <= 0 ||
      this.totalPurchaseCost === null ||
      this.totalPurchaseCost < 0
    ) {
      return 0;
    }

    return Number(this.totalPurchaseCost) / Number(this.stock);
  }

  // =========================================================
  // INVENTORY USED PER RECIPE UNIT
  // =========================================================

  /**
   * Calculates how much inventory is consumed by
   * ONE recipe unit.
   *
   * Example:
   *
   * Stock = 10 kg
   * Yield = 30 pcs
   *
   * 10 / 30
   * = 0.333333 kg per pcs
   */
  getInventoryPerRecipeUnit(): number {
    if (
      this.stock === null ||
      this.stock <= 0 ||
      this.recipeYield === null ||
      this.recipeYield <= 0
    ) {
      return 0;
    }

    return Number(this.stock) / Number(this.recipeYield);
  }

  // =========================================================
  // RECIPE UNIT COST
  // =========================================================

  /**
   * Calculates the cost of ONE recipe unit.
   *
   * Example:
   *
   * Total purchase cost = ₱1,500
   * Recipe yield = 30 pcs
   *
   * ₱1,500 / 30
   * = ₱50 / pcs
   */
  getRecipeUnitCost(): number {
    if (
      this.totalPurchaseCost === null ||
      this.totalPurchaseCost < 0 ||
      this.recipeYield === null ||
      this.recipeYield <= 0
    ) {
      return 0;
    }

    return Number(this.totalPurchaseCost) / Number(this.recipeYield);
  }

  // =========================================================
  // SAVE
  // =========================================================

  async saveIngredient(): Promise<void> {
    // =======================================================
    // NAME
    // =======================================================

    if (!this.ingredientName.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Ingredient Name Required',
        text: 'Please enter the ingredient name.',
        confirmButtonColor: '#191919',
      });

      return;
    }

    // =======================================================
    // CATEGORY
    // =======================================================

    if (!this.category) {
      await Swal.fire({
        icon: 'warning',
        title: 'Category Required',
        text: 'Please select a category.',
        confirmButtonColor: '#191919',
      });

      return;
    }

    // =======================================================
    // INVENTORY UNIT
    // =======================================================

    if (!this.unit) {
      await Swal.fire({
        icon: 'warning',
        title: 'Inventory Unit Required',
        text: 'Select the unit used when buying and storing this ingredient.',
        confirmButtonColor: '#191919',
      });

      return;
    }

    // =======================================================
    // STOCK
    // =======================================================

    if (
      this.stock === null ||
      !Number.isFinite(Number(this.stock)) ||
      this.stock <= 0
    ) {
      await Swal.fire({
        icon: 'warning',
        title: 'Invalid Stock',
        text: 'Please enter a stock quantity greater than zero.',
        confirmButtonColor: '#191919',
      });

      return;
    }

    // =======================================================
    // REORDER LEVEL
    // =======================================================

    if (
      this.reorderLevel === null ||
      !Number.isFinite(Number(this.reorderLevel)) ||
      this.reorderLevel < 0
    ) {
      await Swal.fire({
        icon: 'warning',
        title: 'Invalid Reorder Level',
        text: 'Please enter a valid reorder level.',
        confirmButtonColor: '#191919',
      });

      return;
    }

    // =======================================================
    // PURCHASE COST
    // =======================================================

    if (
      this.totalPurchaseCost === null ||
      !Number.isFinite(Number(this.totalPurchaseCost)) ||
      this.totalPurchaseCost < 0
    ) {
      await Swal.fire({
        icon: 'warning',
        title: 'Invalid Purchase Cost',
        text: 'Please enter the total amount paid for this stock.',
        confirmButtonColor: '#191919',
      });

      return;
    }

    // =======================================================
    // RECIPE UNIT
    // =======================================================

    if (!this.recipeUnit) {
      await Swal.fire({
        icon: 'warning',
        title: 'Recipe Unit Required',
        text: 'Select the unit that staff will use when creating menu recipes.',
        confirmButtonColor: '#191919',
      });

      return;
    }

    // =======================================================
    // RECIPE YIELD
    // =======================================================

    if (
      this.recipeYield === null ||
      !Number.isFinite(Number(this.recipeYield)) ||
      this.recipeYield <= 0
    ) {
      await Swal.fire({
        icon: 'warning',
        title: 'Recipe Yield Required',
        text: `Enter how many ${this.recipeUnit} can be produced from the current ${this.unit} stock.`,
        confirmButtonColor: '#191919',
      });

      return;
    }

    // =======================================================
    // CALCULATIONS
    // =======================================================

    const inventoryCostPerUnit = this.getInventoryCostPerUnit();

    const inventoryPerRecipeUnit = this.getInventoryPerRecipeUnit();

    const recipeUnitCost = this.getRecipeUnitCost();

    // =======================================================
    // CONFIRM
    // =======================================================

    const result = await Swal.fire({
      icon: 'question',
      title: 'Add this ingredient?',
      html: `
        <div style="text-align:center">

          <strong>
            ${this.ingredientName.trim()}
          </strong>

          <br><br>

          <div>
            Current Stock:
            <strong>
              ${Number(this.stock).toLocaleString()} ${this.unit}
            </strong>
          </div>

          <div>
            Total Purchase Cost:
            <strong>
              ₱${Number(this.totalPurchaseCost).toFixed(2)}
            </strong>
          </div>

          <div>
            Cost per ${this.unit}:
            <strong>
              ₱${inventoryCostPerUnit.toFixed(2)}
            </strong>
          </div>

          <br>

          <div>
            Recipe Unit:
            <strong>
              ${this.recipeUnit}
            </strong>
          </div>

          <div>
            Recipe Yield:
            <strong>
              ${Number(this.recipeYield).toLocaleString()}
              ${this.recipeUnit}
            </strong>
          </div>

          <div>
            1 ${this.recipeUnit} uses:
            <strong>
              ${inventoryPerRecipeUnit.toFixed(6)}
              ${this.unit}
            </strong>
          </div>

          <div>
            Cost per ${this.recipeUnit}:
            <strong>
              ₱${recipeUnitCost.toFixed(2)}
            </strong>
          </div>

        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Yes, add ingredient',
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
      await this.ingredientService.createIngredient({
        name: this.ingredientName.trim(),
        category: this.category,

        stock: Number(this.stock),
        unit: this.unit,

        reorderLevel: Number(this.reorderLevel),

        costPerUnit: inventoryCostPerUnit,

        recipeUnit: this.recipeUnit,
        recipeYield: Number(this.recipeYield),
      });

      await Swal.fire({
        icon: 'success',
        title: 'Ingredient Added',
        text: `${this.ingredientName.trim()} has been added to inventory.`,
        confirmButtonText: 'Done',
        confirmButtonColor: '#191919',
      });

      await this.router.navigate(['/admin/inventory/ingredients']);
    } catch (error) {
      console.error('Failed to save ingredient:', error);

      await Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'Unable to add ingredient. Please try again.',
        confirmButtonText: 'Close',
        confirmButtonColor: '#191919',
      });
    } finally {
      this.isSaving.set(false);
    }
  }

  // =========================================================
  // CANCEL
  // =========================================================

  cancel(): void {
    this.router.navigate(['/admin/inventory/ingredients']);
  }
}
