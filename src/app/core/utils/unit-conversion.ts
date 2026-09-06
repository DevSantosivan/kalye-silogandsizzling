import { RecipeUnit } from '../models/menu.model';

// =========================================================
// INGREDIENT-SPECIFIC CONVERSION
// =========================================================
//
// Normal conversion:
//
// kg <-> g
// L  <-> ml
// pcs <-> pcs
//
// Special conversion:
//
// pcs <-> kg/g
//
// Example:
//
// Chicken
// Inventory: 10 kg
// Equivalent pieces: 15 pcs
//
// 1 pc = 10 / 15 kg
//      = 0.666667 kg
//
// =========================================================

export interface PieceConversion {
  /**
   * Amount of inventory stock represented by
   * the configured number of pieces.
   *
   * Example:
   *
   * inventoryQuantity = 10
   * inventoryUnit = 'kg'
   *
   * pieceQuantity = 15
   * pieceUnit = 'pcs'
   */
  inventoryQuantity: number;

  inventoryUnit: RecipeUnit;

  pieceQuantity: number;
}

// =========================================================
// UNIT GROUPS
// =========================================================

const MASS_UNITS: RecipeUnit[] = ['mg', 'g', 'kg'];

const VOLUME_UNITS: RecipeUnit[] = ['ml', 'L'];

// =========================================================
// CONVERT TO BASE UNIT
//
// MASS -> grams
// VOLUME -> milliliters
// PCS  -> pieces
// =========================================================

export function convertToBaseUnit(quantity: number, unit: RecipeUnit): number {
  const value = Number(quantity) || 0;

  switch (unit) {
    // =====================================================
    // MASS
    // =====================================================

    case 'mg':
      return value / 1000;

    case 'g':
      return value;

    case 'kg':
      return value * 1000;

    // =====================================================
    // VOLUME
    // =====================================================

    case 'ml':
      return value;

    case 'L':
      return value * 1000;

    // =====================================================
    // COUNT
    // =====================================================

    case 'pcs':
      return value;

    default:
      return value;
  }
}

// =========================================================
// CONVERT FROM BASE UNIT
// =========================================================

export function convertFromBaseUnit(
  quantity: number,
  unit: RecipeUnit,
): number {
  const value = Number(quantity) || 0;

  switch (unit) {
    // =====================================================
    // MASS
    // =====================================================

    case 'mg':
      return value * 1000;

    case 'g':
      return value;

    case 'kg':
      return value / 1000;

    // =====================================================
    // VOLUME
    // =====================================================

    case 'ml':
      return value;

    case 'L':
      return value / 1000;

    // =====================================================
    // COUNT
    // =====================================================

    case 'pcs':
      return value;

    default:
      return value;
  }
}

// =========================================================
// CHECK UNIT GROUP
// =========================================================

function isMassUnit(unit: RecipeUnit): boolean {
  return MASS_UNITS.includes(unit);
}

function isVolumeUnit(unit: RecipeUnit): boolean {
  return VOLUME_UNITS.includes(unit);
}

// =========================================================
// NORMAL UNIT CONVERSION
//
// Supports:
//
// mg <-> g <-> kg
// ml <-> L
// pcs <-> pcs
//
// DOES NOT handle:
//
// pcs <-> kg
//
// because that requires ingredient-specific information.
// =========================================================

export function convertUnit(
  quantity: number,
  from: RecipeUnit,
  to: RecipeUnit,
): number {
  const value = Number(quantity) || 0;

  if (from === to) {
    return value;
  }

  // =====================================================
  // MASS
  // =====================================================

  if (isMassUnit(from) && isMassUnit(to)) {
    const grams = convertToBaseUnit(value, from);

    return convertFromBaseUnit(grams, to);
  }

  // =====================================================
  // VOLUME
  // =====================================================

  if (isVolumeUnit(from) && isVolumeUnit(to)) {
    const milliliters = convertToBaseUnit(value, from);

    return convertFromBaseUnit(milliliters, to);
  }

  // =====================================================
  // PIECES
  // =====================================================

  if (from === 'pcs' && to === 'pcs') {
    return value;
  }

  // =====================================================
  // INVALID NORMAL CONVERSION
  // =====================================================

  throw new Error(
    `Cannot convert ${from} to ${to} without ingredient conversion data.`,
  );
}

// =========================================================
// CONVERT PIECES TO INVENTORY UNIT
// =========================================================
//
// This is the IMPORTANT new function.
//
// Example:
//
// Chicken:
//
// inventoryQuantity = 10
// inventoryUnit = kg
// pieceQuantity = 15
//
// 1 pc:
//
// 1 / 15 * 10
// = 0.666667 kg
//
// =========================================================

export function convertPiecesToInventoryUnit(
  pieces: number,
  conversion: PieceConversion,
): number {
  const pieceValue = Number(pieces) || 0;
  const inventoryQuantity = Number(conversion.inventoryQuantity) || 0;
  const pieceQuantity = Number(conversion.pieceQuantity) || 0;

  if (pieceQuantity <= 0) {
    throw new Error('Piece conversion quantity must be greater than zero.');
  }

  if (inventoryQuantity < 0) {
    throw new Error('Inventory conversion quantity cannot be negative.');
  }

  return (pieceValue / pieceQuantity) * inventoryQuantity;
}

// =========================================================
// CONVERT INVENTORY UNIT TO PIECES
// =========================================================
//
// Example:
//
// Chicken:
//
// 10 kg = 15 pcs
//
// 5 kg:
//
// 5 / 10 * 15
// = 7.5 pcs
//
// =========================================================

export function convertInventoryUnitToPieces(
  inventoryQuantity: number,
  conversion: PieceConversion,
): number {
  const inventoryValue = Number(inventoryQuantity) || 0;
  const conversionInventoryQuantity = Number(conversion.inventoryQuantity) || 0;
  const pieceQuantity = Number(conversion.pieceQuantity) || 0;

  if (conversionInventoryQuantity <= 0) {
    throw new Error('Inventory conversion quantity must be greater than zero.');
  }

  if (pieceQuantity < 0) {
    throw new Error('Piece conversion quantity cannot be negative.');
  }

  return (inventoryValue / conversionInventoryQuantity) * pieceQuantity;
}

// =========================================================
// CONVERT RECIPE QUANTITY TO INVENTORY UNIT
// =========================================================
//
// This is the function na gagamitin natin sa CREATE MENU
// at eventually sa ORDER DEDUCTION.
//
// Example 1:
//
// Tapa
//
// Recipe:
// 100 g
//
// Inventory:
// kg
//
// Result:
// 0.1 kg
//
// ---------------------------------------------------------
//
// Example 2:
//
// Chicken
//
// Recipe:
// 1 pcs
//
// Inventory:
// 10 kg
//
// Equivalent:
// 15 pcs
//
// Result:
// 0.666667 kg
//
// ---------------------------------------------------------
//
// Example 3:
//
// Pork
//
// Recipe:
// 2 pcs
//
// Inventory:
// 10 kg
//
// Equivalent:
// 20 pcs
//
// Result:
// 1 kg
//
// =========================================================

export function convertRecipeToInventoryUnit(
  quantity: number,
  recipeUnit: RecipeUnit,
  inventoryUnit: RecipeUnit,
  pieceConversion?: PieceConversion,
): number {
  const value = Number(quantity) || 0;

  // =====================================================
  // SAME UNIT
  // =====================================================

  if (recipeUnit === inventoryUnit) {
    return value;
  }

  // =====================================================
  // PCS -> MASS
  //
  // Requires ingredient-specific conversion.
  // =====================================================

  if (recipeUnit === 'pcs' && isMassUnit(inventoryUnit)) {
    if (!pieceConversion) {
      throw new Error(
        `Piece conversion is required to convert pcs to ${inventoryUnit}.`,
      );
    }

    const inventoryQuantity = convertPiecesToInventoryUnit(
      value,
      pieceConversion,
    );

    return inventoryQuantity;
  }

  // =====================================================
  // MASS -> PCS
  //
  // Requires ingredient-specific conversion.
  // =====================================================

  if (isMassUnit(recipeUnit) && inventoryUnit === 'pcs') {
    if (!pieceConversion) {
      throw new Error(
        `Piece conversion is required to convert ${recipeUnit} to pcs.`,
      );
    }

    const inventoryQuantityInBaseUnit = convertUnit(
      value,
      recipeUnit,
      pieceConversion.inventoryUnit,
    );

    return convertInventoryUnitToPieces(
      inventoryQuantityInBaseUnit,
      pieceConversion,
    );
  }

  // =====================================================
  // NORMAL CONVERSION
  // =====================================================

  return convertUnit(value, recipeUnit, inventoryUnit);
}

// =========================================================
// GET COST PER RECIPE UNIT
// =========================================================
//
// IMPORTANT:
//
// costPerInventoryUnit is based on the actual inventory
// unit.
//
// Example:
//
// Chicken:
//
// Inventory:
// 10 kg
//
// Purchase cost:
// ₱2,000
//
// Cost per kg:
// ₱200
//
// 15 pcs equivalent:
//
// 1 pc = 0.666667 kg
//
// Cost per piece:
//
// ₱200 × 0.666667
// = ₱133.33
//
// =========================================================

export function getRecipeUnitCost(
  quantity: number,
  recipeUnit: RecipeUnit,
  inventoryUnit: RecipeUnit,
  costPerInventoryUnit: number,
  pieceConversion?: PieceConversion,
): number {
  const inventoryQuantity = convertRecipeToInventoryUnit(
    quantity,
    recipeUnit,
    inventoryUnit,
    pieceConversion,
  );

  return inventoryQuantity * (Number(costPerInventoryUnit) || 0);
}

// =========================================================
// GET COST PER PIECE
// =========================================================
//
// Convenience function.
//
// Example:
//
// 10 kg = ₱2,000
// 15 pcs equivalent
//
// Cost per piece:
//
// ₱2,000 / 15
// = ₱133.33
//
// =========================================================

export function getCostPerPiece(
  totalInventoryCost: number,
  pieceQuantity: number,
): number {
  const cost = Number(totalInventoryCost) || 0;
  const pieces = Number(pieceQuantity) || 0;

  if (pieces <= 0) {
    throw new Error('Piece quantity must be greater than zero.');
  }

  return cost / pieces;
}
