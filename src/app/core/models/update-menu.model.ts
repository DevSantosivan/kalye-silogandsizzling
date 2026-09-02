import { MenuIngredient } from './menu-ingredient.model';

export interface UpdateMenuRequest {
  name: string;

  category: string;

  price: number;

  image: string | null;

  description: string | null;

  available: boolean;

  ingredients: MenuIngredient[];
}
