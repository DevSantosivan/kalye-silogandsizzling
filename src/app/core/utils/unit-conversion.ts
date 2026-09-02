import { RecipeUnit } from '../models/menu.model';

// =========================================================
// CONVERT TO BASE UNIT
//
// MASS -> grams
// VOLUME -> milliliters
// PCS  -> pieces
// =========================================================

export function convertToBaseUnit(quantity: number, unit: RecipeUnit): number {
  switch (unit) {
    // MASS

    case 'mg':
      return quantity / 1000;

    case 'g':
      return quantity;

    case 'kg':
      return quantity * 1000;

    // VOLUME

    case 'ml':
      return quantity;

    case 'L':
      return quantity * 1000;

    // COUNT

    case 'pcs':
      return quantity;

    default:
      return quantity;
  }
}

// =========================================================
// CONVERT FROM BASE UNIT
// =========================================================

export function convertFromBaseUnit(
  quantity: number,
  unit: RecipeUnit,
): number {
  switch (unit) {
    case 'mg':
      return quantity * 1000;

    case 'g':
      return quantity;

    case 'kg':
      return quantity / 1000;

    case 'ml':
      return quantity;

    case 'L':
      return quantity / 1000;

    case 'pcs':
      return quantity;

    default:
      return quantity;
  }
}

// =========================================================
// CONVERT BETWEEN UNITS
// =========================================================

export function convertUnit(
  quantity: number,
  from: RecipeUnit,
  to: RecipeUnit,
): number {
  if (from === to) {
    return quantity;
  }

  // MASS

  if (['mg', 'g', 'kg'].includes(from) && ['mg', 'g', 'kg'].includes(to)) {
    const grams = convertToBaseUnit(quantity, from);

    return convertFromBaseUnit(grams, to);
  }

  // VOLUME

  if (['ml', 'L'].includes(from) && ['ml', 'L'].includes(to)) {
    const ml = convertToBaseUnit(quantity, from);

    return convertFromBaseUnit(ml, to);
  }

  // PIECES

  if (from === 'pcs' && to === 'pcs') {
    return quantity;
  }

  throw new Error(`Cannot convert ${from} to ${to}.`);
}
