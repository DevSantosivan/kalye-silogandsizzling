import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

import { Ingredient } from '../../../../core/models/ingredient.model';
import { IngredientService } from '../../../../core/services/admin/inventory/ingredient.service';

import { RichTextEditorComponent } from '../../../../shared/components/rich-text-editor/rich-text-editor.component';

import {
  CreateMenuRequest,
  CreateMenuIngredient,
} from '../../../../core/models/create-menu.model';

import { MenuService } from '../../../../core/services/admin/menu.service';

// ==========================================================
// UI RECIPE INGREDIENT
// ==========================================================
//
// Ito ang ginagamit ng FORM.
//
// Example:
//
// Inventory:
// Chicken = 10 kg
//
// User enters:
// 20 g
//
// Kaya quantity dito = 20
// at hindi 0.02.
//
// ==========================================================

interface RecipeFormIngredient {
  ingredientId: number | null;
  quantity: number;
}

// ==========================================================
// COMPONENT
// ==========================================================

@Component({
  selector: 'app-create-menu',
  standalone: true,
  imports: [FormsModule, RouterLink, RichTextEditorComponent],
  templateUrl: './create-menu.component.html',
  styleUrl: './create-menu.component.scss',
})
export class CreateMenuComponent implements OnInit {
  // ========================================================
  // SERVICES
  // ========================================================

  private router = inject(Router);

  private ingredientService = inject(IngredientService);

  private menuService = inject(MenuService);

  // ========================================================
  // MENU INFORMATION
  // ========================================================

  name = '';

  category = '';

  price = 0;

  image = '';

  description = '';

  available = true;

  // ========================================================
  // CATEGORIES
  // ========================================================

  categories = [
    'Silog',
    'Sizzling',
    'Rice Meals',
    'Chicken',
    'Pork',
    'Beef',
    'Seafood',
    'Drinks',
    'Sides',
    'Others',
  ];

  // ========================================================
  // INGREDIENTS
  // ========================================================

  ingredients = signal<Ingredient[]>([]);

  isLoadingIngredients = signal(false);

  // ========================================================
  // RECIPE
  // ========================================================

  menuIngredients: RecipeFormIngredient[] = [
    {
      ingredientId: null,
      quantity: 0,
    },
  ];

  // ========================================================
  // SAVING
  // ========================================================

  isSaving = signal(false);

  // ========================================================
  // INITIAL LOAD
  // ========================================================

  async ngOnInit(): Promise<void> {
    await this.loadIngredients();
  }

  // ========================================================
  // LOAD INGREDIENTS
  // ========================================================

  async loadIngredients(): Promise<void> {
    this.isLoadingIngredients.set(true);

    try {
      const data = await this.ingredientService.getIngredients();

      this.ingredients.set(data);
    } catch (error) {
      console.error('Failed to load ingredients:', error);

      await Swal.fire({
        icon: 'error',
        title: 'Unable to Load Ingredients',
        text: 'Something went wrong while loading your ingredients.',
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#191919',
      });
    } finally {
      this.isLoadingIngredients.set(false);
    }
  }

  // ========================================================
  // GET INGREDIENT
  // ========================================================

  getIngredient(ingredientId: number | null): Ingredient | undefined {
    if (ingredientId === null) {
      return undefined;
    }

    return this.ingredients().find(
      (ingredient) => ingredient.id === ingredientId,
    );
  }

  // ========================================================
  // DISPLAY UNIT
  // ========================================================
  //
  // Inventory:
  //
  // kg -> UI = g
  // L  -> UI = ml
  // pcs -> UI = pcs
  //
  // ========================================================

  getDisplayUnit(ingredientId: number | null): string {
    const ingredient = this.getIngredient(ingredientId);

    if (!ingredient) {
      return 'unit';
    }

    const unit = ingredient.unit?.toLowerCase().trim();

    switch (unit) {
      case 'kg':
      case 'kilogram':
      case 'kilograms':
        return 'g';

      case 'g':
      case 'gram':
      case 'grams':
        return 'g';

      case 'mg':
      case 'milligram':
      case 'milligrams':
        return 'mg';

      case 'l':
      case 'liter':
      case 'liters':
      case 'litre':
      case 'litres':
        return 'ml';

      case 'ml':
      case 'milliliter':
      case 'milliliters':
        return 'ml';

      case 'pcs':
      case 'pc':
      case 'piece':
      case 'pieces':
        return 'pcs';

      default:
        return ingredient.unit;
    }
  }

  // ========================================================
  // GET INVENTORY UNIT
  // ========================================================

  getInventoryUnit(ingredientId: number | null): string {
    const ingredient = this.getIngredient(ingredientId);

    return ingredient?.unit ?? '';
  }

  // ========================================================
  // CONVERT UI QUANTITY -> INVENTORY QUANTITY
  // ========================================================
  //
  // Example:
  //
  // Inventory = kg
  // UI = g
  //
  // 20g -> 0.02kg
  //
  // ========================================================

  convertToInventoryUnit(
    quantity: number,
    ingredientId: number | null,
  ): number {
    const ingredient = this.getIngredient(ingredientId);

    if (!ingredient) {
      return 0;
    }

    const value = Number(quantity) || 0;

    const unit = ingredient.unit?.toLowerCase().trim();

    switch (unit) {
      // ----------------------------------------------------
      // KG
      // ----------------------------------------------------

      case 'kg':
      case 'kilogram':
      case 'kilograms':
        return value / 1000;

      // ----------------------------------------------------
      // GRAMS
      // ----------------------------------------------------

      case 'g':
      case 'gram':
      case 'grams':
        return value;

      // ----------------------------------------------------
      // MILLIGRAMS
      // ----------------------------------------------------

      case 'mg':
      case 'milligram':
      case 'milligrams':
        return value / 1000;

      // ----------------------------------------------------
      // LITERS
      // ----------------------------------------------------

      case 'l':
      case 'liter':
      case 'liters':
      case 'litre':
      case 'litres':
        return value / 1000;

      // ----------------------------------------------------
      // MILLILITERS
      // ----------------------------------------------------

      case 'ml':
      case 'milliliter':
      case 'milliliters':
        return value;

      // ----------------------------------------------------
      // PIECES
      // ----------------------------------------------------

      case 'pcs':
      case 'pc':
      case 'piece':
      case 'pieces':
        return value;

      // ----------------------------------------------------
      // DEFAULT
      // ----------------------------------------------------

      default:
        return value;
    }
  }

  // ========================================================
  // GET CONVERTED QUANTITY
  // ========================================================

  getConvertedQuantity(item: RecipeFormIngredient): number {
    return this.convertToInventoryUnit(item.quantity, item.ingredientId);
  }

  // ========================================================
  // DUPLICATE INGREDIENT
  // ========================================================

  isIngredientSelected(ingredientId: number, currentIndex: number): boolean {
    return this.menuIngredients.some(
      (item, index) =>
        index !== currentIndex && item.ingredientId === ingredientId,
    );
  }

  // ========================================================
  // ADD INGREDIENT
  // ========================================================

  addIngredient(): void {
    this.menuIngredients.push({
      ingredientId: null,
      quantity: 0,
    });
  }

  // ========================================================
  // REMOVE INGREDIENT
  // ========================================================

  removeIngredient(index: number): void {
    if (this.menuIngredients.length === 1) {
      return;
    }

    this.menuIngredients.splice(index, 1);
  }

  // ========================================================
  // RECIPE COST
  // ========================================================

  getRecipeCost(): number {
    return this.menuIngredients.reduce((total, item) => {
      const ingredient = this.getIngredient(item.ingredientId);

      if (!ingredient) {
        return total;
      }

      const quantity = this.convertToInventoryUnit(
        item.quantity,
        item.ingredientId,
      );

      const costPerUnit = Number(ingredient.costPerUnit) || 0;

      return total + quantity * costPerUnit;
    }, 0);
  }

  // ========================================================
  // PROFIT
  // ========================================================

  getEstimatedProfit(): number {
    return Number(this.price) - this.getRecipeCost();
  }

  // ========================================================
  // PROFIT MARGIN
  // ========================================================

  getProfitMargin(): number {
    const sellingPrice = Number(this.price) || 0;

    if (sellingPrice <= 0) {
      return 0;
    }

    return (this.getEstimatedProfit() / sellingPrice) * 100;
  }

  // ========================================================
  // EMPTY RECIPE
  // ========================================================

  hasNoIngredients(): boolean {
    return this.menuIngredients.every((item) => item.ingredientId === null);
  }

  // ========================================================
  // INVALID RECIPE
  // ========================================================

  hasInvalidIngredients(): boolean {
    return this.menuIngredients.some(
      (item) =>
        item.ingredientId === null ||
        !item.quantity ||
        Number(item.quantity) <= 0,
    );
  }

  // ========================================================
  // STOCK VALIDATION
  // ========================================================

  hasInsufficientStock(): Ingredient | null {
    for (const item of this.menuIngredients) {
      const ingredient = this.getIngredient(item.ingredientId);

      if (!ingredient) {
        continue;
      }

      const requiredQuantity = this.convertToInventoryUnit(
        item.quantity,
        item.ingredientId,
      );

      const availableStock = Number(ingredient.stock) || 0;

      if (requiredQuantity > availableStock) {
        return ingredient;
      }
    }

    return null;
  }

  // ========================================================
  // CREATE MENU
  // ========================================================

  async createMenu(): Promise<void> {
    // ======================================================
    // NAME
    // ======================================================

    if (!this.name.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Menu Name Required',
        text: 'Please enter a menu name.',
        confirmButtonColor: '#191919',
      });

      return;
    }

    // ======================================================
    // CATEGORY
    // ======================================================

    if (!this.category) {
      await Swal.fire({
        icon: 'warning',
        title: 'Category Required',
        text: 'Please select a category.',
        confirmButtonColor: '#191919',
      });

      return;
    }

    // ======================================================
    // PRICE
    // ======================================================

    if (!this.price || Number(this.price) <= 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Invalid Price',
        text: 'Please enter a valid selling price.',
        confirmButtonColor: '#191919',
      });

      return;
    }

    // ======================================================
    // RECIPE
    // ======================================================

    if (this.hasNoIngredients()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Ingredients Required',
        text: 'Please add at least one ingredient.',
        confirmButtonColor: '#191919',
      });

      return;
    }

    if (this.hasInvalidIngredients()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Invalid Recipe',
        text: 'Please select an ingredient and enter a valid quantity for every recipe row.',
        confirmButtonColor: '#191919',
      });

      return;
    }

    // ======================================================
    // DUPLICATES
    // ======================================================

    const ingredientIds = this.menuIngredients
      .map((item) => item.ingredientId)
      .filter((id): id is number => id !== null);

    const hasDuplicates = new Set(ingredientIds).size !== ingredientIds.length;

    if (hasDuplicates) {
      await Swal.fire({
        icon: 'warning',
        title: 'Duplicate Ingredient',
        text: 'You cannot use the same ingredient more than once.',
        confirmButtonColor: '#191919',
      });

      return;
    }

    // ======================================================
    // STOCK
    // ======================================================

    const insufficientIngredient = this.hasInsufficientStock();

    if (insufficientIngredient) {
      await Swal.fire({
        icon: 'warning',
        title: 'Insufficient Stock',
        html: `
          <strong>
            ${insufficientIngredient.name}
          </strong>
          does not have enough stock.

          <br><br>

          Available:

          <strong>
            ${insufficientIngredient.stock}
            ${insufficientIngredient.unit}
          </strong>
        `,
        confirmButtonColor: '#191919',
      });

      return;
    }

    // ======================================================
    // BUILD RECIPE
    // ======================================================
    //
    // IMPORTANT:
    //
    // UI:
    //
    // Chicken = 20 g
    //
    // Inventory:
    //
    // Chicken = kg
    //
    // Database:
    //
    // quantity = 0.02
    // unit = kg
    //
    // ======================================================

    const recipeIngredients: CreateMenuIngredient[] = this.menuIngredients.map(
      (item) => {
        const ingredient = this.getIngredient(item.ingredientId);

        if (!ingredient) {
          throw new Error('Ingredient not found.');
        }

        return {
          ingredientId: item.ingredientId!,

          quantity: Number(
            this.convertToInventoryUnit(
              item.quantity,
              item.ingredientId,
            ).toFixed(6),
          ),

          unit: ingredient.unit as any,
        };
      },
    );

    // ======================================================
    // PAYLOAD
    // ======================================================

    const payload: CreateMenuRequest = {
      name: this.name.trim(),

      category: this.category,

      price: Number(this.price),

      image: this.image.trim() || null,

      description: this.description.trim() || null,

      available: this.available,

      ingredients: recipeIngredients,
    };

    console.log('CREATE MENU PAYLOAD:', payload);

    // ======================================================
    // CONFIRM
    // ======================================================

    const result = await Swal.fire({
      icon: 'question',

      title: 'Create menu item?',

      html: `
          <div style="text-align:center">

            <strong>
              ${this.name}
            </strong>

            <br><br>

            Selling Price:
            <strong>
              ₱${Number(this.price).toFixed(2)}
            </strong>

            <br>

            Ingredient Cost:
            <strong>
              ₱${this.getRecipeCost().toFixed(2)}
            </strong>

            <br>

            Estimated Profit:
            <strong>
              ₱${this.getEstimatedProfit().toFixed(2)}
            </strong>

          </div>
        `,

      showCancelButton: true,

      confirmButtonText: 'Yes, create it',

      cancelButtonText: 'Cancel',

      reverseButtons: true,

      confirmButtonColor: '#191919',

      cancelButtonColor: '#6b7280',

      focusCancel: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    // ======================================================
    // SAVE
    // ======================================================

    this.isSaving.set(true);

    try {
      await this.menuService.createMenu(payload);

      // ====================================================
      // SUCCESS
      // ====================================================

      await Swal.fire({
        icon: 'success',
        title: 'Menu Created',
        text: `${this.name} has been successfully added to your menu.`,
        confirmButtonText: 'Done',
        confirmButtonColor: '#191919',
      });

      await this.router.navigate(['/admin/menu']);
    } catch (error) {
      console.error('Failed to create menu:', error);

      await Swal.fire({
        icon: 'error',
        title: 'Create Failed',
        text: 'Unable to create menu item. Please try again.',
        confirmButtonText: 'Close',
        confirmButtonColor: '#191919',
      });
    } finally {
      this.isSaving.set(false);
    }
  }

  // ========================================================
  // CANCEL
  // ========================================================

  cancel(): void {
    this.router.navigate(['/admin/menu']);
  }

  // ========================================================
  // CURRENCY
  // ========================================================

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(value);
  }
}
