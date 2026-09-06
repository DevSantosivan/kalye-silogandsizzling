import { Injectable, inject } from '@angular/core';

import { Ingredient } from '../../../models/ingredient.model';
import { SupabaseService } from '../../supabase.service';

// =========================================================
// STOCK IN PAYLOAD
// =========================================================

export interface StockInPayload {
  ingredientId: number;

  /**
   * Actual inventory quantity received.
   *
   * Example:
   * 5 kg
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
   * MANUAL recipe yield added by this stock-in.
   *
   * Example:
   * 15 pcs
   *
   * This is ADDED to the existing recipe yield.
   */
  recipeYield: number;

  supplier: string | null;

  costPerUnit: number;

  notes: string | null;
}

// =========================================================
// STOCK IN RESULT
// =========================================================

export interface StockInResult {
  ingredient: Ingredient;
}

// =========================================================
// SERVICE
// =========================================================

@Injectable({
  providedIn: 'root',
})
export class StockInService {
  private supabase = inject(SupabaseService);

  // =========================================================
  // RECEIVE STOCK
  // =========================================================

  async receiveStock(payload: StockInPayload): Promise<StockInResult> {
    // =======================================================
    // VALIDATE PAYLOAD
    // =======================================================

    const quantity = Number(payload.quantity);

    const recipeYield = Number(payload.recipeYield);

    const costPerUnit = Number(payload.costPerUnit);

    // =======================================================
    // VALIDATE QUANTITY
    // =======================================================

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error('Stock-in quantity must be greater than zero.');
    }

    // =======================================================
    // VALIDATE RECIPE YIELD
    // =======================================================

    if (
      !Number.isFinite(recipeYield) ||
      recipeYield < 0 ||
      !Number.isInteger(recipeYield)
    ) {
      throw new Error(
        'Recipe yield must be a whole number greater than or equal to zero.',
      );
    }

    // =======================================================
    // VALIDATE COST
    // =======================================================

    if (!Number.isFinite(costPerUnit) || costPerUnit < 0) {
      throw new Error('Cost per unit must be zero or greater.');
    }

    // =======================================================
    // GET EXISTING INGREDIENT
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
    // VALIDATE UNIT
    // =======================================================

    if (ingredient.unit !== payload.unit) {
      throw new Error(`Invalid unit. Ingredient uses ${ingredient.unit}.`);
    }

    // =======================================================
    // CURRENT STOCK
    // =======================================================

    const currentStock = Number(ingredient.stock) || 0;

    // =======================================================
    // CURRENT RECIPE YIELD
    // =======================================================

    const currentRecipeYield = Number(ingredient.recipe_yield) || 0;

    // =======================================================
    // NEW STOCK
    //
    // Current Stock + Received Stock
    //
    // Example:
    // 10 kg + 5 kg = 15 kg
    // =======================================================

    const newStock = currentStock + quantity;

    // =======================================================
    // NEW RECIPE YIELD
    //
    // Current Recipe Yield + New Recipe Yield
    //
    // Example:
    // 40 pcs + 15 pcs = 55 pcs
    // =======================================================

    const newRecipeYield = currentRecipeYield + recipeYield;

    // =======================================================
    // TOTAL PURCHASE COST
    // =======================================================

    const totalCost = quantity * costPerUnit;

    // =======================================================
    // INSERT STOCK-IN HISTORY
    // =======================================================

    const { error: stockInError } = await this.supabase.client
      .from('stock_in')
      .insert({
        ingredient_id: payload.ingredientId,

        quantity: quantity,

        unit: payload.unit,

        // Recipe yield ADDED by this stock-in
        recipe_yield: recipeYield,

        supplier: payload.supplier,

        cost_per_unit: costPerUnit,

        total_cost: totalCost,

        notes: payload.notes?.trim() || null,
      });

    if (stockInError) {
      console.error('Error creating stock-in record:', stockInError);

      throw stockInError;
    }

    // =======================================================
    // UPDATE INGREDIENT
    //
    // BOTH STOCK AND RECIPE YIELD ARE INCREASED
    // =======================================================

    const { data: updatedIngredient, error: updateError } =
      await this.supabase.client
        .from('ingredients')
        .update({
          // -----------------------------------------------
          // Actual inventory stock
          // -----------------------------------------------

          stock: newStock,

          // -----------------------------------------------
          // Latest purchase price
          // -----------------------------------------------

          cost_per_unit: costPerUnit,

          // -----------------------------------------------
          // Add recipe yield
          // -----------------------------------------------

          recipe_yield: newRecipeYield,

          // -----------------------------------------------
          // Timestamp
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
    // RETURN UPDATED INGREDIENT
    // =======================================================

    return {
      ingredient: this.mapIngredient(updatedIngredient),
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
