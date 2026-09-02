import { Injectable, inject } from '@angular/core';

import { Ingredient } from '../../../models/ingredient.model';
import { SupabaseService } from '../../supabase.service';

@Injectable({
  providedIn: 'root',
})
export class IngredientService {
  private supabase = inject(SupabaseService);

  // ==========================================
  // GET ALL INGREDIENTS
  // ==========================================

  async getIngredients(): Promise<Ingredient[]> {
    const { data, error } = await this.supabase.client
      .from('ingredients')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching ingredients:', error);
      throw error;
    }

    return (data ?? []).map((item) => this.mapIngredient(item));
  }

  // ==========================================
  // GET INGREDIENT BY ID
  // ==========================================

  async getIngredientById(id: number): Promise<Ingredient | null> {
    const { data, error } = await this.supabase.client
      .from('ingredients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching ingredient:', error);
      return null;
    }

    return this.mapIngredient(data);
  }

  // ==========================================
  // CREATE INGREDIENT
  // ==========================================

  async createIngredient(payload: {
    name: string;
    category: string;
    stock: number;
    unit: string;
    reorderLevel: number;
    costPerUnit: number;
  }): Promise<Ingredient> {
    const { data, error } = await this.supabase.client
      .from('ingredients')
      .insert({
        name: payload.name,
        category: payload.category,
        stock: payload.stock,
        unit: payload.unit,
        reorder_level: payload.reorderLevel,
        cost_per_unit: payload.costPerUnit,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ingredient:', error);
      throw error;
    }

    return this.mapIngredient(data);
  }

  // ==========================================
  // UPDATE INGREDIENT
  // ==========================================

  async updateIngredient(
    id: number,
    payload: {
      name: string;
      category: string;
      unit: string;
      reorderLevel: number;
      costPerUnit: number;
    },
  ): Promise<Ingredient> {
    const { data, error } = await this.supabase.client
      .from('ingredients')
      .update({
        name: payload.name,
        category: payload.category,
        unit: payload.unit,
        reorder_level: payload.reorderLevel,
        cost_per_unit: payload.costPerUnit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating ingredient:', error);
      throw error;
    }

    return this.mapIngredient(data);
  }

  // ==========================================
  // DELETE INGREDIENT
  // SOFT DELETE
  // ==========================================

  async deleteIngredient(id: number): Promise<void> {
    const { error } = await this.supabase.client
      .from('ingredients')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error deleting ingredient:', error);
      throw error;
    }
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
