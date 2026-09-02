// =========================================================
// CREATE MENU REQUEST
// =========================================================

export interface CreateMenuRequest {
  name: string;

  category: string;

  price: number;

  image: string | null;

  description: string | null;

  available: boolean;

  ingredients: CreateMenuIngredient[];
}

// =========================================================
// CREATE MENU INGREDIENT
// =========================================================

export interface CreateMenuIngredient {
  ingredientId: number;

  quantity: number;

  unit: RecipeUnit;
}

// =========================================================
// RECIPE UNIT
// =========================================================

export type RecipeUnit = 'g' | 'kg' | 'mg' | 'ml' | 'L' | 'pcs';
