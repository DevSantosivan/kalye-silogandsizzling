export interface Ingredient {
  id: number;

  // ==========================================
  // BASIC INFORMATION
  // ==========================================

  name: string;
  category: string;

  // ==========================================
  // INVENTORY
  // ==========================================

  /**
   * Current physical stock.
   *
   * Example:
   * 10 kg chicken
   */
  stock: number;

  /**
   * Unit used for purchasing and storing inventory.
   *
   * Examples:
   * kg, g, L, mL, pcs
   */
  unit: string;

  /**
   * Stock level that triggers reorder warning.
   */
  reorderLevel: number;

  /**
   * Latest purchase cost per inventory unit.
   *
   * Example:
   * ₱200 / kg
   */
  costPerUnit: number;

  // ==========================================
  // RECIPE CONFIGURATION
  // ==========================================

  /**
   * Unit used when creating recipes.
   *
   * Examples:
   * pcs, g, kg, ml, L
   */
  recipeUnit: string;

  /**
   * MANUALLY ENTERED recipe yield.
   *
   * Example:
   *
   * Stock: 10 kg Pork Tapa
   * Recipe Unit: pcs
   * Recipe Yield: 30 pcs
   *
   * No automatic conversion is performed.
   */
  recipeYield: number;

  // ==========================================
  // STATUS
  // ==========================================

  isActive: boolean;

  // ==========================================
  // TIMESTAMPS
  // ==========================================

  createdAt: string;
  updatedAt: string;
}
