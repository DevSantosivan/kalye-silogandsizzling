// =========================================================
// MENU INGREDIENT
// =========================================================

export interface MenuIngredient {
  id?: number;

  menuItemId?: number;

  ingredientId: number;

  quantity: number;

  unit: RecipeUnit;
}

// =========================================================
// RECIPE UNITS
// =========================================================

export type RecipeUnit = 'g' | 'kg' | 'mg' | 'ml' | 'L' | 'pcs';

// =========================================================
// MENU ITEM
// =========================================================

export interface MenuItem {
  id: number;

  name: string;

  category: string;

  price: number;

  image: string | null;

  description: string | null;

  available: boolean;

  sold: number;

  createdAt?: string;

  updatedAt?: string;

  ingredients?: MenuIngredient[];
}

// =========================================================
// CREATE MENU
// =========================================================

export interface CreateMenuItem {
  name: string;

  category: string;

  price: number;

  image: string | null;

  description: string | null;

  available: boolean;

  ingredients: CreateMenuIngredient[];
}

// =========================================================
// CREATE RECIPE INGREDIENT
// =========================================================

export interface CreateMenuIngredient {
  ingredientId: number;

  quantity: number;

  unit: RecipeUnit;
}

// =========================================================
// UPDATE MENU
// =========================================================

export interface UpdateMenuItem {
  name: string;

  category: string;

  price: number;

  image: string | null;

  description: string | null;

  available: boolean;

  ingredients: CreateMenuIngredient[];
}
