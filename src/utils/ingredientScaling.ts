import { Ingredient } from '../models/Ingredient';

export interface ScaledIngredient extends Ingredient {
  scaledQuantity: number;
  formattedQuantity: string;
}

/**
 * Scales an ingredient quantity proportionally based on base servings vs target servings.
 * Automatically converts units if quantity crosses readable thresholds (e.g. 1000g -> 1kg).
 */
export function scaleIngredient(ingredient: Ingredient, baseServings: number, targetServings: number): ScaledIngredient {
  const safeBase = Math.max(1, baseServings);
  const safeTarget = Math.max(1, targetServings);
  const ratio = safeTarget / safeBase;
  const scaledQuantity = ingredient.quantity * ratio;

  return {
    ...ingredient,
    scaledQuantity,
    formattedQuantity: formatQuantityWithUnit(scaledQuantity, ingredient.unit),
  };
}

export function scaleIngredientsList(ingredients: Ingredient[], baseServings: number, targetServings: number): ScaledIngredient[] {
  return ingredients.map((ing) => scaleIngredient(ing, baseServings, targetServings));
}

export function formatQuantityWithUnit(amount: number, unit: string): string {
  // If unit is grams and exceeds or equals 1000g, format as kg
  if (unit.toLowerCase() === 'g' && amount >= 1000) {
    const kg = amount / 1000;
    return `${cleanDecimals(kg)} kg`;
  }

  // If unit is ml and exceeds or equals 1000ml, format as L
  if (unit.toLowerCase() === 'ml' && amount >= 1000) {
    const l = amount / 1000;
    return `${cleanDecimals(l)} L`;
  }

  return `${cleanDecimals(amount)} ${unit}`;
}

export function cleanDecimals(val: number): string {
  if (Number.isInteger(val)) return val.toString();
  // Round to at most 1 decimal place if close
  const rounded = Math.round(val * 10) / 10;
  return rounded.toString();
}
