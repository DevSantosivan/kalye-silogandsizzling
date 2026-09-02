import { Injectable, inject } from '@angular/core';

import { Ingredient } from '../../../models/ingredient.model';
import { SupabaseService } from '../../supabase.service';

export interface StockOutPayload {
  ingredientId: number;
  quantity: number;
  unit: string;
  reason: string;
  notes: string | null;
}

export interface StockOutResult {
  ingredient: Ingredient;
}

@Injectable({
  providedIn: 'root',
})
export class StockOutService {
  private supabase = inject(SupabaseService);

  // ==========================================
  // STOCK OUT
  // ==========================================

  async stockOut(payload: StockOutPayload): Promise<StockOutResult> {
    // ----------------------------------------
    // GET CURRENT INGREDIENT
    // ----------------------------------------

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

    // ----------------------------------------
    // CURRENT STOCK
    // ----------------------------------------

    const currentStock = Number(ingredient.stock);

    // ----------------------------------------
    // VALIDATE STOCK
    // ----------------------------------------

    if (payload.quantity > currentStock) {
      throw new Error('Stock out quantity cannot exceed current stock.');
    }

    // ----------------------------------------
    // CALCULATE REMAINING STOCK
    // ----------------------------------------

    const remainingStock = currentStock - payload.quantity;

    // ----------------------------------------
    // INSERT STOCK OUT RECORD
    // ----------------------------------------

    const { error: stockOutError } = await this.supabase.client
      .from('stock_out')
      .insert({
        ingredient_id: payload.ingredientId,
        quantity: payload.quantity,
        unit: payload.unit,
        reason: payload.reason,
        notes: payload.notes,
      });

    if (stockOutError) {
      console.error('Error creating stock-out record:', stockOutError);

      throw stockOutError;
    }

    // ----------------------------------------
    // UPDATE INGREDIENT STOCK
    // ----------------------------------------

    const { data: updatedIngredient, error: updateError } =
      await this.supabase.client
        .from('ingredients')
        .update({
          stock: remainingStock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.ingredientId)
        .select()
        .single();

    if (updateError) {
      console.error('Error updating ingredient stock:', updateError);

      throw updateError;
    }

    // ----------------------------------------
    // RETURN UPDATED INGREDIENT
    // ----------------------------------------

    return {
      ingredient: this.mapIngredient(updatedIngredient),
    };
  }

  // ==========================================
  // MAP SUPABASE → ANGULAR MODEL
  // ==========================================

  private mapIngredient(item: any): Ingredient {
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      stock: Number(item.stock),
      unit: item.unit,
      reorderLevel: Number(item.reorder_level),
      costPerUnit: Number(item.cost_per_unit),
      isActive: item.is_active,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  }
}
