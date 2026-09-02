import { Injectable, inject } from '@angular/core';
import { Ingredient } from '../../../models/ingredient.model';
import { SupabaseService } from '../../supabase.service';

export interface StockInPayload {
  ingredientId: number;
  quantity: number;
  unit: string;
  supplier: string | null;
  costPerUnit: number;
  notes: string | null;
}

export interface StockInResult {
  ingredient: Ingredient;
}

@Injectable({
  providedIn: 'root',
})
export class StockInService {
  private supabase = inject(SupabaseService);

  // ==========================================
  // RECEIVE STOCK
  // ==========================================

  async receiveStock(payload: StockInPayload): Promise<StockInResult> {
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
    // CALCULATE NEW STOCK
    // ----------------------------------------

    const currentStock = Number(ingredient.stock);

    const newStock = currentStock + payload.quantity;

    const totalCost = payload.quantity * payload.costPerUnit;

    // ----------------------------------------
    // INSERT STOCK IN RECORD
    // ----------------------------------------

    const { error: stockInError } = await this.supabase.client
      .from('stock_in')
      .insert({
        ingredient_id: payload.ingredientId,
        quantity: payload.quantity,
        unit: payload.unit,
        supplier: payload.supplier,
        cost_per_unit: payload.costPerUnit,
        total_cost: totalCost,
        notes: payload.notes,
      });

    if (stockInError) {
      console.error('Error creating stock-in record:', stockInError);

      throw stockInError;
    }

    // ----------------------------------------
    // UPDATE INGREDIENT STOCK
    // ----------------------------------------

    const { data: updatedIngredient, error: updateError } =
      await this.supabase.client
        .from('ingredients')
        .update({
          stock: newStock,
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
