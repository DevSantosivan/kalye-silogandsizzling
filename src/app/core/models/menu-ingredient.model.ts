export interface MenuIngredient {
  id?: number;
  menuItemId?: number;

  ingredientId: number;

  // Quantity stored in the ingredient's inventory unit.
  //
  // Example:
  // Inventory = kg
  // User enters = 20 g
  // Database = 0.02 kg
  quantity: number;

  // Unit used by the inventory ingredient.
  //
  // Example:
  // chicken -> kg
  // cooking oil -> L
  // egg -> pcs
  unit: RecipeUnit;
}

// =========================================================
// RECIPE UNITS
// =========================================================

export type RecipeUnit = 'g' | 'kg' | 'mg' | 'ml' | 'L' | 'pcs';
