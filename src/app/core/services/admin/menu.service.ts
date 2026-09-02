import { Injectable, inject } from '@angular/core';
import {
  MenuItem,
  CreateMenuItem,
  UpdateMenuItem,
} from '../../models/menu.model';
import { SupabaseService } from '../supabase.service';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private supabase = inject(SupabaseService);

  // =========================================================
  // GET ALL MENU
  // =========================================================

  async getMenus(): Promise<MenuItem[]> {
    const { data, error } = await this.supabase.client
      .from('menu_items')
      .select(
        `
        *,
        ingredients:menu_item_ingredients (
          id,
          ingredient_id,
          quantity,
          unit,
          ingredient:ingredients (
            id,
            name,
            stock,
            unit,
            cost_per_unit
          )
        )
      `,
      )
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      console.error('GET MENUS ERROR:', error);

      throw error;
    }

    return (data ?? []).map((item: any) => ({
      id: item.id,

      name: item.name,

      category: item.category,

      price: Number(item.price),

      image: item.image,

      description: item.description,

      available: item.available,

      sold: item.sold ?? 0,

      createdAt: item.created_at,

      updatedAt: item.updated_at,

      ingredients: (item.ingredients ?? []).map((recipe: any) => ({
        id: recipe.id,

        menuItemId: item.id,

        ingredientId: recipe.ingredient_id,

        quantity: Number(recipe.quantity),

        unit: recipe.unit,
      })),
    }));
  }

  // =========================================================
  // GET MENU BY ID
  // =========================================================

  async getMenuById(id: number): Promise<MenuItem> {
    const { data, error } = await this.supabase.client
      .from('menu_items')
      .select(
        `
        *,
        ingredients:menu_item_ingredients (
          id,
          ingredient_id,
          quantity,
          unit,
          ingredient:ingredients (
            id,
            name,
            stock,
            unit,
            cost_per_unit
          )
        )
      `,
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('GET MENU ERROR:', error);

      throw error;
    }

    return {
      id: data.id,

      name: data.name,

      category: data.category,

      price: Number(data.price),

      image: data.image,

      description: data.description,

      available: data.available,

      sold: data.sold ?? 0,

      createdAt: data.created_at,

      updatedAt: data.updated_at,

      ingredients: (data.ingredients ?? []).map((recipe: any) => ({
        id: recipe.id,

        menuItemId: data.id,

        ingredientId: recipe.ingredient_id,

        quantity: Number(recipe.quantity),

        unit: recipe.unit,
      })),
    };
  }

  // =========================================================
  // CREATE
  // =========================================================

  async createMenu(menu: CreateMenuItem): Promise<MenuItem> {
    // -----------------------------------------
    // CREATE MENU ITEM
    // -----------------------------------------

    const { data, error } = await this.supabase.client
      .from('menu_items')
      .insert({
        name: menu.name,

        category: menu.category,

        price: menu.price,

        image: menu.image,

        description: menu.description,

        available: menu.available,

        sold: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('CREATE MENU ERROR:', error);

      throw error;
    }

    // -----------------------------------------
    // CREATE RECIPE
    // -----------------------------------------

    const recipeRows = menu.ingredients.map((ingredient) => ({
      menu_item_id: data.id,

      ingredient_id: ingredient.ingredientId,

      quantity: ingredient.quantity,

      unit: ingredient.unit,
    }));

    const { error: recipeError } = await this.supabase.client
      .from('menu_item_ingredients')
      .insert(recipeRows);

    if (recipeError) {
      console.error('CREATE RECIPE ERROR:', recipeError);

      // rollback menu item

      await this.supabase.client.from('menu_items').delete().eq('id', data.id);

      throw recipeError;
    }

    return this.getMenuById(data.id);
  }

  // =========================================================
  // UPDATE
  // =========================================================

  async updateMenu(id: number, menu: UpdateMenuItem): Promise<MenuItem> {
    // -----------------------------------------
    // UPDATE MENU
    // -----------------------------------------

    const { error } = await this.supabase.client
      .from('menu_items')
      .update({
        name: menu.name,

        category: menu.category,

        price: menu.price,

        image: menu.image,

        description: menu.description,

        available: menu.available,
      })
      .eq('id', id);

    if (error) {
      console.error('UPDATE MENU ERROR:', error);

      throw error;
    }

    // -----------------------------------------
    // REMOVE OLD RECIPE
    // -----------------------------------------

    const { error: deleteRecipeError } = await this.supabase.client
      .from('menu_item_ingredients')
      .delete()
      .eq('menu_item_id', id);

    if (deleteRecipeError) {
      console.error('DELETE OLD RECIPE ERROR:', deleteRecipeError);

      throw deleteRecipeError;
    }

    // -----------------------------------------
    // INSERT NEW RECIPE
    // -----------------------------------------

    const recipeRows = menu.ingredients.map((ingredient) => ({
      menu_item_id: id,

      ingredient_id: ingredient.ingredientId,

      quantity: ingredient.quantity,

      unit: ingredient.unit,
    }));

    if (recipeRows.length > 0) {
      const { error: recipeError } = await this.supabase.client
        .from('menu_item_ingredients')
        .insert(recipeRows);

      if (recipeError) {
        console.error('UPDATE RECIPE ERROR:', recipeError);

        throw recipeError;
      }
    }

    return this.getMenuById(id);
  }

  // =========================================================
  // DELETE
  // =========================================================

  async deleteMenu(id: number): Promise<void> {
    const { error } = await this.supabase.client
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('DELETE MENU ERROR:', error);

      throw error;
    }
  }

  // =========================================================
  // TOGGLE AVAILABILITY
  // =========================================================

  async toggleAvailability(id: number, available: boolean): Promise<void> {
    const { error } = await this.supabase.client
      .from('menu_items')
      .update({
        available,
      })
      .eq('id', id);

    if (error) {
      console.error('TOGGLE MENU ERROR:', error);

      throw error;
    }
  }
}
