import { Injectable, inject } from '@angular/core';

import { Ingredient } from '../../../models/ingredient.model';

import { SupabaseService } from '../../supabase.service';

// =========================================================
// STOCK OUT PAYLOAD
// =========================================================

export interface StockOutPayload {
  ingredientId: number;

  /**
   * Actual inventory quantity removed.
   *
   * Example:
   * 2 kg
   */
  quantity: number;

  /**
   * Inventory unit.
   *
   * Example:
   * kg
   */
  unit: string;

  /**
   * MANUAL RECIPE YIELD WASTED.
   *
   * Example:
   * 5 pcs
   *
   * This is manually entered.
   * It is NOT automatically calculated from quantity.
   */
  recipeYieldWasted: number;

  /**
   * Recipe unit.
   *
   * Usually:
   * pcs
   */
  recipeUnit: string;

  /**
   * Reason for stock deduction.
   */
  reason: string;

  /**
   * Optional notes.
   */
  notes: string | null;
}

// =========================================================
// STOCK OUT RESULT
// =========================================================

export interface StockOutResult {
  ingredient: Ingredient;

  recipeYieldWasted: number;

  recipeUnit: string;
}

// =========================================================
// SERVICE
// =========================================================

@Injectable({
  providedIn: 'root',
})
export class StockOutService {
  private supabase = inject(SupabaseService);

  // =========================================================
  // STOCK OUT
  // =========================================================

  async stockOut(payload: StockOutPayload): Promise<StockOutResult> {
    // =======================================================
    // GET CURRENT INGREDIENT
    // =======================================================

    const { data: ingredient, error: ingredientError } =
      await this.supabase.client
        .from('ingredients')
        .select('*')
        .eq('id', payload.ingredientId)
        .single();

    if (ingredientError) {
      console.error('Error fetching ingredient:', ingredientError);

      throw ingredientError;
    }

    if (!ingredient) {
      throw new Error('Ingredient not found.');
    }

    // =======================================================
    // VALIDATE INGREDIENT ID
    // =======================================================

    if (!Number.isFinite(Number(payload.ingredientId))) {
      throw new Error('Invalid ingredient ID.');
    }

    // =======================================================
    // VALIDATE UNIT
    // =======================================================

    if (payload.unit !== ingredient.unit) {
      throw new Error(
        `Stock unit mismatch. Ingredient uses ${ingredient.unit}.`,
      );
    }

    // =======================================================
    // CURRENT STOCK
    // =======================================================

    const currentStock = Number(ingredient.stock) || 0;

    // =======================================================
    // STOCK OUT QUANTITY
    // =======================================================

    const quantity = Number(payload.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error('Stock-out quantity must be greater than zero.');
    }

    // =======================================================
    // AVAILABLE STOCK
    // =======================================================

    if (quantity > currentStock) {
      throw new Error(
        `Insufficient stock. Available stock is ${currentStock} ${ingredient.unit}.`,
      );
    }

    // =======================================================
    // CURRENT RECIPE YIELD
    // =======================================================

    const currentRecipeYield = Number(ingredient.recipe_yield) || 0;

    // =======================================================
    // RECIPE YIELD WASTED
    // =======================================================

    const recipeYieldWasted = Number(payload.recipeYieldWasted);

    if (
      !Number.isFinite(recipeYieldWasted) ||
      recipeYieldWasted < 0 ||
      !Number.isInteger(recipeYieldWasted)
    ) {
      throw new Error(
        'Recipe Yield Wasted must be a whole number greater than or equal to zero.',
      );
    }

    // =======================================================
    // VALIDATE RECIPE YIELD WASTED
    // =======================================================

    if (recipeYieldWasted > currentRecipeYield) {
      throw new Error(
        `Recipe Yield Wasted cannot exceed the current recipe yield of ${currentRecipeYield} ${
          ingredient.recipe_unit || 'pcs'
        }.`,
      );
    }

    // =======================================================
    // RECIPE UNIT
    // =======================================================

    const recipeUnit =
      payload.recipeUnit?.trim() || ingredient.recipe_unit || 'pcs';

    // =======================================================
    // CALCULATE REMAINING STOCK
    // =======================================================

    const remainingStock = currentStock - quantity;

    // =======================================================
    // CALCULATE REMAINING RECIPE YIELD
    // =======================================================

    const remainingRecipeYield = currentRecipeYield - recipeYieldWasted;

    // =======================================================
    // SAFETY CHECK
    // =======================================================

    if (remainingStock < 0) {
      throw new Error('Remaining stock cannot be negative.');
    }

    if (remainingRecipeYield < 0) {
      throw new Error('Remaining recipe yield cannot be negative.');
    }

    // =======================================================
    // INSERT STOCK OUT HISTORY
    // =======================================================

    const { error: stockOutError } = await this.supabase.client
      .from('stock_out')
      .insert({
        ingredient_id: payload.ingredientId,

        quantity: quantity,

        unit: payload.unit,

        recipe_yield_wasted: recipeYieldWasted,

        recipe_unit: recipeUnit,

        reason: payload.reason.trim(),

        notes: payload.notes?.trim() || null,
      });

    if (stockOutError) {
      console.error('Error creating stock-out record:', stockOutError);

      throw stockOutError;
    }

    // =======================================================
    // UPDATE INGREDIENT
    //
    // BOTH VALUES ARE UPDATED:
    //
    // stock
    // recipe_yield
    // =======================================================

    const { data: updatedIngredient, error: updateError } =
      await this.supabase.client
        .from('ingredients')
        .update({
          // -----------------------------------------------
          // Actual inventory stock
          // -----------------------------------------------

          stock: remainingStock,

          // -----------------------------------------------
          // Recipe yield
          //
          // Example:
          // 50 pcs - 5 pcs = 45 pcs
          // -----------------------------------------------

          recipe_yield: remainingRecipeYield,

          // -----------------------------------------------
          // Updated timestamp
          // -----------------------------------------------

          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.ingredientId)
        .select()
        .single();

    if (updateError) {
      console.error(
        'Error updating ingredient stock and recipe yield:',
        updateError,
      );

      throw updateError;
    }

    // =======================================================
    // SAFETY CHECK
    // =======================================================

    if (!updatedIngredient) {
      throw new Error('Ingredient was not updated.');
    }

    // =======================================================
    // RETURN
    // =======================================================

    return {
      ingredient: this.mapIngredient(updatedIngredient),

      recipeYieldWasted: recipeYieldWasted,

      recipeUnit: recipeUnit,
    };
  }

  // =========================================================
  // MAP SUPABASE → ANGULAR MODEL
  // =========================================================

  private mapIngredient(item: any): Ingredient {
    return {
      id: Number(item.id),

      name: item.name,

      category: item.category,

      // ==========================================
      // INVENTORY
      // ==========================================

      stock: Number(item.stock) || 0,

      unit: item.unit,

      reorderLevel: Number(item.reorder_level) || 0,

      costPerUnit: Number(item.cost_per_unit) || 0,

      // ==========================================
      // RECIPE
      // ==========================================

      recipeUnit: item.recipe_unit ?? item.unit,

      recipeYield: Number(item.recipe_yield) || 0,

      // ==========================================
      // STATUS
      // ==========================================

      isActive: item.is_active ?? true,

      // ==========================================
      // TIMESTAMPS
      // ==========================================

      createdAt: item.created_at,

      updatedAt: item.updated_at,
    };
  }
}
