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
  // NORMALIZE UNIT
  // ========================================================

  normalizeUnit(unit: string | null | undefined): string {
    return (unit ?? '').toLowerCase().trim();
  }

  // ========================================================
  // DISPLAY RECIPE UNIT
  // ========================================================

  getDisplayUnit(ingredientId: number | null): string {
    const ingredient = this.getIngredient(ingredientId);

    if (!ingredient) {
      return 'unit';
    }

    return ingredient.recipeUnit || ingredient.unit;
  }

  // ========================================================
  // INVENTORY UNIT
  // ========================================================

  getInventoryUnit(ingredientId: number | null): string {
    const ingredient = this.getIngredient(ingredientId);

    return ingredient?.unit ?? '';
  }

  // ========================================================
  // RECIPE YIELD
  // ========================================================

  getRecipeYield(ingredientId: number | null): number {
    const ingredient = this.getIngredient(ingredientId);

    return Number(ingredient?.recipeYield) || 0;
  }

  // ========================================================
  // CONVERSION
  // ========================================================
  //
  // IMPORTANT:
  //
  // recipeYield means:
  //
  // HOW MANY RECIPE UNITS ARE PRODUCED
  // FROM ONE INVENTORY UNIT.
  //
  // Examples:
  //
  // Chicken
  // inventory = kg
  // recipe     = pcs
  // yield      = 10
  //
  // Means:
  //
  // 1 kg = 10 pcs
  //
  // Therefore:
  //
  // 1 pcs = 0.1 kg
  //
  // 2 pcs = 0.2 kg
  //
  // 5 pcs = 0.5 kg
  //
  // --------------------------------------------------------
  //
  // Egg
  // inventory = pcs
  // recipe     = pcs
  //
  // Same unit.
  //
  // 1 pcs = 1 pcs
  //
  // --------------------------------------------------------
  //
  // Tapa
  // inventory = kg
  // recipe     = g
  //
  // 1 kg = 1000 g
  //
  // 100 g = 0.1 kg
  //
  // ========================================================

  convertToInventoryUnit(
    recipeQuantity: number,
    ingredientId: number | null,
  ): number {
    const ingredient = this.getIngredient(ingredientId);

    if (!ingredient) {
      return 0;
    }

    const quantity = Number(recipeQuantity) || 0;

    if (quantity <= 0) {
      return 0;
    }

    const inventoryUnit = this.normalizeUnit(ingredient.unit);

    const recipeUnit = this.normalizeUnit(
      ingredient.recipeUnit || ingredient.unit,
    );

    const recipeYield = Number(ingredient.recipeYield) || 0;

    // ======================================================
    // SAME UNIT
    // ======================================================

    if (this.unitsAreSame(recipeUnit, inventoryUnit)) {
      return quantity;
    }

    // ======================================================
    // PCS FROM WEIGHT
    // ======================================================
    //
    // Example:
    //
    // 1 kg = 10 pcs
    //
    // 1 pcs = 1 / 10 kg
    //
    // ======================================================

    if (this.isPieceUnit(recipeUnit) && this.isWeightUnit(inventoryUnit)) {
      if (recipeYield <= 0) {
        return 0;
      }

      return quantity / recipeYield;
    }

    // ======================================================
    // GRAMS FROM KG
    // ======================================================

    if (this.isGramUnit(recipeUnit) && this.isKilogramUnit(inventoryUnit)) {
      return quantity / 1000;
    }

    // ======================================================
    // MG FROM KG
    // ======================================================

    if (
      this.isMilligramUnit(recipeUnit) &&
      this.isKilogramUnit(inventoryUnit)
    ) {
      return quantity / 1_000_000;
    }

    // ======================================================
    // ML FROM LITER
    // ======================================================

    if (this.isMilliliterUnit(recipeUnit) && this.isLiterUnit(inventoryUnit)) {
      return quantity / 1000;
    }

    // ======================================================
    // MG FROM GRAMS
    // ======================================================

    if (this.isMilligramUnit(recipeUnit) && this.isGramUnit(inventoryUnit)) {
      return quantity / 1000;
    }

    // ======================================================
    // DEFAULT
    // ======================================================

    return quantity;
  }

  // ========================================================
  // UNIT HELPERS
  // ========================================================

  isPieceUnit(unit: string): boolean {
    return ['pcs', 'pc', 'piece', 'pieces'].includes(unit);
  }

  isWeightUnit(unit: string): boolean {
    return [
      'kg',
      'kilogram',
      'kilograms',
      'g',
      'gram',
      'grams',
      'mg',
      'milligram',
      'milligrams',
    ].includes(unit);
  }

  isKilogramUnit(unit: string): boolean {
    return ['kg', 'kilogram', 'kilograms'].includes(unit);
  }

  isGramUnit(unit: string): boolean {
    return ['g', 'gram', 'grams'].includes(unit);
  }

  isMilligramUnit(unit: string): boolean {
    return ['mg', 'milligram', 'milligrams'].includes(unit);
  }

  isLiterUnit(unit: string): boolean {
    return ['l', 'liter', 'liters', 'litre', 'litres'].includes(unit);
  }

  isMilliliterUnit(unit: string): boolean {
    return ['ml', 'milliliter', 'milliliters'].includes(unit);
  }

  unitsAreSame(first: string, second: string): boolean {
    const normalize = (unit: string): string => {
      switch (unit) {
        case 'pc':
        case 'piece':
        case 'pieces':
          return 'pcs';

        case 'gram':
        case 'grams':
          return 'g';

        case 'kilogram':
        case 'kilograms':
          return 'kg';

        case 'milligram':
        case 'milligrams':
          return 'mg';

        case 'liter':
        case 'liters':
        case 'litre':
        case 'litres':
          return 'l';

        case 'milliliter':
        case 'milliliters':
          return 'ml';

        default:
          return unit;
      }
    };

    return normalize(first) === normalize(second);
  }

  // ========================================================
  // GET CONVERTED QUANTITY
  // ========================================================

  getConvertedQuantity(item: RecipeFormIngredient): number {
    return this.convertToInventoryUnit(item.quantity, item.ingredientId);
  }

  // ========================================================
  // FORMAT INVENTORY QUANTITY
  // ========================================================

  formatInventoryQuantity(
    quantity: number,
    ingredientId: number | null,
  ): string {
    const ingredient = this.getIngredient(ingredientId);

    if (!ingredient) {
      return '0';
    }

    const value = this.convertToInventoryUnit(quantity, ingredientId);

    return value.toFixed(4).replace(/\.?0+$/, '');
  }

  // ========================================================
  // RECIPE PREVIEW
  // ========================================================
  //
  // Example:
  //
  // Chicken
  // Recipe: 1 pcs
  // Yield: 10 pcs/kg
  //
  // Uses: 0.1 kg
  //
  // ========================================================

  getRecipeUsageText(item: RecipeFormIngredient): string {
    const ingredient = this.getIngredient(item.ingredientId);

    if (!ingredient) {
      return '';
    }

    const converted = this.getConvertedQuantity(item);

    const inventoryUnit = ingredient.unit;

    const recipeUnit = ingredient.recipeUnit || ingredient.unit;

    const yieldValue = Number(ingredient.recipeYield) || 0;

    if (this.unitsAreSame(recipeUnit, inventoryUnit)) {
      return `Uses ${this.formatNumber(converted)} ${inventoryUnit}`;
    }

    if (
      this.isPieceUnit(this.normalizeUnit(recipeUnit)) &&
      this.isWeightUnit(this.normalizeUnit(inventoryUnit))
    ) {
      if (yieldValue <= 0) {
        return 'Recipe yield is not configured';
      }

      return `Uses ${this.formatNumber(converted)} ${inventoryUnit} from ${yieldValue} ${recipeUnit}/${inventoryUnit}`;
    }

    return `Uses ${this.formatNumber(converted)} ${inventoryUnit}`;
  }

  // ========================================================
  // FORMAT NUMBER
  // ========================================================

  formatNumber(value: number): string {
    return value.toFixed(4).replace(/\.?0+$/, '');
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
  // INGREDIENT COST
  // ========================================================

  getIngredientCost(item: RecipeFormIngredient): number {
    const ingredient = this.getIngredient(item.ingredientId);

    if (!ingredient) {
      return 0;
    }

    const inventoryQuantity = this.getConvertedQuantity(item);

    const costPerUnit = Number(ingredient.costPerUnit) || 0;

    return inventoryQuantity * costPerUnit;
  }

  // ========================================================
  // RECIPE COST
  // ========================================================

  getRecipeCost(): number {
    return this.menuIngredients.reduce((total, item) => {
      return total + this.getIngredientCost(item);
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
  // INVALID YIELD
  // ========================================================

  hasInvalidYield(): Ingredient | null {
    for (const item of this.menuIngredients) {
      const ingredient = this.getIngredient(item.ingredientId);

      if (!ingredient) {
        continue;
      }

      const recipeUnit = this.normalizeUnit(ingredient.recipeUnit);

      const inventoryUnit = this.normalizeUnit(ingredient.unit);

      // Same units don't need yield.
      if (this.unitsAreSame(recipeUnit, inventoryUnit)) {
        continue;
      }

      // Different units require a yield.
      if (Number(ingredient.recipeYield) <= 0) {
        return ingredient;
      }
    }

    return null;
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

      const requiredQuantity = this.getConvertedQuantity(item);

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
    // YIELD
    // ======================================================

    const invalidYield = this.hasInvalidYield();

    if (invalidYield) {
      await Swal.fire({
        icon: 'warning',
        title: 'Recipe Yield Required',
        html: `
          <strong>
            ${invalidYield.name}
          </strong>

          <br><br>

          Inventory Unit:
          <strong>
            ${invalidYield.unit}
          </strong>

          <br>

          Recipe Unit:
          <strong>
            ${invalidYield.recipeUnit}
          </strong>

          <br><br>

          Please configure a valid
          <strong>Recipe Yield</strong>
          for this ingredient.
        `,
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
      const item = this.menuIngredients.find(
        (row) => row.ingredientId === insufficientIngredient.id,
      );

      const required = item ? this.getConvertedQuantity(item) : 0;

      await Swal.fire({
        icon: 'warning',
        title: 'Insufficient Stock',
        html: `
          <strong>
            ${insufficientIngredient.name}
          </strong>

          <br><br>

          Required:
          <strong>
            ${this.formatNumber(required)}
            ${insufficientIngredient.unit}
          </strong>

          <br>

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

    const recipeIngredients: CreateMenuIngredient[] = this.menuIngredients.map(
      (item) => {
        const ingredient = this.getIngredient(item.ingredientId);

        if (!ingredient) {
          throw new Error('Ingredient not found.');
        }

        const inventoryQuantity = this.getConvertedQuantity(item);

        return {
          ingredientId: item.ingredientId!,

          quantity: Number(inventoryQuantity.toFixed(6)),

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
