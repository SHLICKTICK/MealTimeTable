import { MasterIngredient } from '../models/MasterIngredient';
import { ingredientCatalogService } from '../services/ingredientCatalogService';
import { findBestIngredientMatch } from './ingredientMatcher';

/**
 * Pricing and unit-conversion utilities for ingredients (solid, liquid, and discrete units).
 * Supports South African Rand (ZAR / R) formatting and two-tier rate resolution:
 * 1. Pantry Override (household inventory price if explicitly stocked/priced)
 * 2. Master Ingredient Catalog (reference R/kg, R/L, or per-unit baseline + avgGramsPerUnit conversion)
 */

export type SolidPriceUnit = 'kg' | 'g';
export type LiquidPriceUnit = 'L' | 'ml';
export type DiscretePriceUnit = 'piece' | 'can' | 'pack' | 'unit';

export interface ResolvedPriceResult {
  price: number;
  priceUnit: string;
  source: 'pantry' | 'catalog' | 'none';
  matchedName?: string;
  avgGramsPerUnit?: number;
  avgMlPerUnit?: number;
}

export const SOLID_UNITS = new Set([
  'g',
  'gram',
  'grams',
  'kg',
  'kilogram',
  'kilograms',
  'mg',
  'milligram',
  'milligrams',
  'oz',
  'ounce',
  'ounces',
  'lb',
  'lbs',
  'pound',
  'pounds',
]);

export const LIQUID_UNITS = new Set([
  'ml',
  'milliliter',
  'milliliters',
  'millilitre',
  'millilitres',
  'l',
  'litre',
  'litres',
  'liter',
  'liters',
  'tsp',
  'teaspoon',
  'teaspoons',
  'tbsp',
  'tablespoon',
  'tablespoons',
  'cup',
  'cups',
  'fl oz',
]);

export const DISCRETE_UNITS = new Set([
  'piece',
  'pieces',
  'whole',
  'slice',
  'slices',
  'clove',
  'cloves',
  'can',
  'cans',
  'pack',
  'packs',
  'medium',
  'large',
  'small',
  'unit',
  'pinch',
  'pinches',
  'bunch',
  'stalk',
  'head',
]);

/**
 * Checks if a measurement unit is solid (weight-based).
 */
export function isSolidUnit(unit: string): boolean {
  return SOLID_UNITS.has(unit.trim().toLowerCase());
}

/**
 * Checks if a measurement unit is liquid (volume-based).
 */
export function isLiquidUnit(unit: string): boolean {
  return LIQUID_UNITS.has(unit.trim().toLowerCase());
}

/**
 * Formats a currency amount in ZAR (Rands).
 */
export function formatZAR(amount: number, minimumFractionDigits = 2): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'R0.00';
  }
  return `R${amount.toLocaleString('en-ZA', {
    minimumFractionDigits,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Returns available pricing unit options for a given ingredient measurement unit.
 */
export function getAvailablePriceUnits(unit: string): Array<{ value: string; label: string; isDefault?: boolean }> {
  const norm = unit.trim().toLowerCase();

  if (isSolidUnit(norm)) {
    return [
      { value: 'kg', label: 'per kg (R/kg)', isDefault: norm === 'kg' || norm === 'g' },
      { value: 'g', label: 'per g (R/g)', isDefault: false },
    ];
  }

  if (isLiquidUnit(norm)) {
    return [
      { value: 'L', label: 'per L (litre) (R/L)', isDefault: norm === 'l' || norm === 'litre' || norm === 'ml' },
      { value: 'ml', label: 'per ml (R/ml)', isDefault: false },
    ];
  }

  // Discrete / countable item (also allow per kg if weighed)
  return [
    { value: 'piece', label: 'per piece / item', isDefault: true },
    { value: 'can', label: 'per can' },
    { value: 'pack', label: 'per pack' },
    { value: 'unit', label: 'per unit' },
    { value: 'kg', label: 'per kg (R/kg)' },
  ];
}

/**
 * Normalizes any quantity into the base unit:
 * - grams for solids
 * - milliliters for liquids
 * - items for discrete
 */
export function toBaseQuantity(quantity: number, unit: string): { amount: number; type: 'solid' | 'liquid' | 'discrete' } {
  const u = unit.trim().toLowerCase();

  if (isSolidUnit(u)) {
    if (u === 'kg' || u === 'kilogram' || u === 'kilograms') {
      return { amount: quantity * 1000, type: 'solid' }; // to grams
    }
    if (u === 'mg' || u === 'milligram' || u === 'milligrams') {
      return { amount: quantity / 1000, type: 'solid' };
    }
    if (u === 'lb' || u === 'lbs' || u === 'pound' || u === 'pounds') {
      return { amount: quantity * 453.592, type: 'solid' };
    }
    if (u === 'oz' || u === 'ounce' || u === 'ounces') {
      return { amount: quantity * 28.3495, type: 'solid' };
    }
    return { amount: quantity, type: 'solid' }; // already grams
  }

  if (isLiquidUnit(u)) {
    if (u === 'l' || u === 'liter' || u === 'liters' || u === 'litre' || u === 'litres') {
      return { amount: quantity * 1000, type: 'liquid' }; // to ml
    }
    if (u === 'tsp' || u === 'teaspoon' || u === 'teaspoons') {
      return { amount: quantity * 5, type: 'liquid' };
    }
    if (u === 'tbsp' || u === 'tablespoon' || u === 'tablespoons') {
      return { amount: quantity * 15, type: 'liquid' };
    }
    if (u === 'cup' || u === 'cups') {
      return { amount: quantity * 250, type: 'liquid' };
    }
    if (u === 'fl oz') {
      return { amount: quantity * 29.5735, type: 'liquid' };
    }
    return { amount: quantity, type: 'liquid' }; // already ml
  }

  // Discrete
  return { amount: quantity, type: 'discrete' };
}

/**
 * Calculates the cost of an ingredient quantity based on its pricing and optional unit equivalence.
 * Supports:
 * - Solid qty (g, kg, oz, lb) vs Solid price (kg, g)
 * - Liquid qty (ml, L, tsp, tbsp, cup) vs Liquid price (L, ml)
 * - Discrete qty (pieces, large, medium, cloves, slices, whole) vs Solid R/kg using avgGramsPerUnit!
 * - Solid qty (g, kg) vs Discrete R/piece using avgGramsPerUnit!
 */
export function calculateIngredientCost(
  quantity: number,
  quantityUnit: string,
  price?: number,
  priceUnit?: string,
  avgGramsPerUnit?: number,
  avgMlPerUnit?: number
): number {
  if (!price || price <= 0 || !quantity || quantity <= 0) {
    return 0;
  }

  const pUnit = (priceUnit || '').trim().toLowerCase();
  const base = toBaseQuantity(quantity, quantityUnit);

  if (base.type === 'solid') {
    if (pUnit === 'kg' || pUnit === 'kilogram' || pUnit === 'kilograms') {
      return base.amount * (price / 1000);
    }
    if (pUnit === 'g' || pUnit === 'gram' || pUnit === 'grams') {
      return base.amount * price;
    }
    if (pUnit === 'mg') {
      return base.amount * (price * 1000);
    }
    if ((pUnit === 'piece' || pUnit === 'can' || pUnit === 'pack' || pUnit === 'unit') && avgGramsPerUnit && avgGramsPerUnit > 0) {
      return (base.amount / avgGramsPerUnit) * price;
    }
    // Fallback if ambiguous
    const costPerGram = price > 10 ? price / 1000 : price;
    return base.amount * costPerGram;
  }

  if (base.type === 'liquid') {
    if (pUnit === 'l' || pUnit === 'liter' || pUnit === 'liters' || pUnit === 'litre' || pUnit === 'litres') {
      return base.amount * (price / 1000);
    }
    if (pUnit === 'ml' || pUnit === 'milliliter' || pUnit === 'milliliters') {
      return base.amount * price;
    }
    if ((pUnit === 'piece' || pUnit === 'can' || pUnit === 'pack' || pUnit === 'unit') && avgMlPerUnit && avgMlPerUnit > 0) {
      return (base.amount / avgMlPerUnit) * price;
    }
    const costPerMl = price > 5 ? price / 1000 : price;
    return base.amount * costPerMl;
  }

  // Discrete / countable quantity (e.g. 4 large eggs, 2 onions, 3 garlic cloves, 4 cheese slices)
  if (pUnit === 'kg' || pUnit === 'kilogram' || pUnit === 'kilograms') {
    const gramsEach = avgGramsPerUnit && avgGramsPerUnit > 0 ? avgGramsPerUnit : 100;
    return quantity * gramsEach * (price / 1000);
  }
  if (pUnit === 'g' || pUnit === 'gram' || pUnit === 'grams') {
    const gramsEach = avgGramsPerUnit && avgGramsPerUnit > 0 ? avgGramsPerUnit : 100;
    return quantity * gramsEach * price;
  }
  if (pUnit === 'l' || pUnit === 'liter' || pUnit === 'liters' || pUnit === 'litre' || pUnit === 'litres') {
    const mlEach = avgMlPerUnit && avgMlPerUnit > 0 ? avgMlPerUnit : 250;
    return quantity * mlEach * (price / 1000);
  }
  if (pUnit === 'ml' || pUnit === 'milliliter' || pUnit === 'milliliters') {
    const mlEach = avgMlPerUnit && avgMlPerUnit > 0 ? avgMlPerUnit : 250;
    return quantity * mlEach * price;
  }

  return quantity * price;
}

/**
 * Two-tier ingredient price resolver:
 * Tier 1: User Pantry Inventory (user's live/custom price)
 * Tier 2: Master Ingredient Catalog (global R/kg or R/L baseline + discrete weights)
 */
export function resolveIngredientPrice(
  ingredientName: string,
  inventoryList: Array<{ name: string; unit: string; price?: number; priceUnit?: string }> = [],
  catalogList?: MasterIngredient[]
): ResolvedPriceResult {
  const catalog = catalogList ?? ingredientCatalogService.getLoadedCatalog();
  const pantryMatch = findBestIngredientMatch(ingredientName, inventoryList);
  const catalogMatch = findBestIngredientMatch(ingredientName, catalog);

  if (pantryMatch && pantryMatch.price && pantryMatch.price > 0) {
    return {
      price: pantryMatch.price,
      priceUnit: pantryMatch.priceUnit || catalogMatch?.priceUnit || 'kg',
      source: 'pantry',
      matchedName: pantryMatch.name,
      avgGramsPerUnit: catalogMatch?.avgGramsPerUnit,
      avgMlPerUnit: catalogMatch?.avgMlPerUnit,
    };
  }

  if (catalogMatch && catalogMatch.referencePriceZAR > 0) {
    return {
      price: catalogMatch.referencePriceZAR,
      priceUnit: catalogMatch.priceUnit,
      source: 'catalog',
      matchedName: catalogMatch.name,
      avgGramsPerUnit: catalogMatch.avgGramsPerUnit,
      avgMlPerUnit: catalogMatch.avgMlPerUnit,
    };
  }

  return { price: 0, priceUnit: '', source: 'none' };
}

/**
 * Calculates the total monetary value of current in-stock inventory for an item.
 */
export function getItemStockValue(item: {
  name?: string;
  quantity: number;
  unit: string;
  price?: number;
  priceUnit?: string;
}): number {
  const catalogMatch = item.name ? ingredientCatalogService.findCatalogItem(item.name) : null;
  const price = item.price && item.price > 0 ? item.price : catalogMatch?.referencePriceZAR;
  const priceUnit = item.priceUnit || catalogMatch?.priceUnit;
  return calculateIngredientCost(
    item.quantity,
    item.unit,
    price,
    priceUnit,
    catalogMatch?.avgGramsPerUnit,
    catalogMatch?.avgMlPerUnit
  );
}

/**
 * Formats a clean unit-rate string with secondary dual-unit breakdown:
 * e.g. "R85.00 / kg (R0.09 / g)" or "R18.50 / L (R0.02 / ml)"
 */
export function formatPriceRate(
  price?: number,
  priceUnit?: string,
  includeSecondary = true
): string {
  if (!price || price <= 0) {
    return 'Unpriced';
  }

  const u = (priceUnit || 'unit').trim();
  const uLower = u.toLowerCase();

  if (uLower === 'kg') {
    const formattedKg = formatZAR(price);
    if (!includeSecondary) return `${formattedKg} / kg`;
    const perGram = price / 1000;
    const perGramStr = perGram < 0.01 ? `<R0.01` : `R${perGram.toFixed(3).replace(/\.?0+$/, '')}`;
    return `${formattedKg} / kg <span class="text-[#77716D] text-[10px] font-normal">(${perGramStr}/g)</span>`;
  }

  if (uLower === 'g') {
    const formattedG = `R${price.toFixed(price < 0.1 ? 3 : 2)}`;
    if (!includeSecondary) return `${formattedG} / g`;
    const perKg = price * 1000;
    return `${formattedG} / g <span class="text-[#77716D] text-[10px] font-normal">(${formatZAR(perKg)}/kg)</span>`;
  }

  if (uLower === 'l' || uLower === 'litre' || uLower === 'liter') {
    const formattedL = formatZAR(price);
    if (!includeSecondary) return `${formattedL} / L`;
    const perMl = price / 1000;
    const perMlStr = perMl < 0.01 ? `<R0.01` : `R${perMl.toFixed(3).replace(/\.?0+$/, '')}`;
    return `${formattedL} / L <span class="text-[#77716D] text-[10px] font-normal">(${perMlStr}/ml)</span>`;
  }

  if (uLower === 'ml') {
    const formattedMl = `R${price.toFixed(price < 0.1 ? 3 : 2)}`;
    if (!includeSecondary) return `${formattedMl} / ml`;
    const perL = price * 1000;
    return `${formattedMl} / ml <span class="text-[#77716D] text-[10px] font-normal">(${formatZAR(perL)}/L)</span>`;
  }

  return `${formatZAR(price)} / ${u}`;
}

/**
 * Calculates recipe cost using two-tier resolution (Recipe override -> Pantry -> Master Catalog),
 * scaling by serving ratio.
 */
export function calculateRecipeCostBreakdown(
  ingredients: Array<{ name: string; quantity: number; unit: string; price?: number; priceUnit?: string }>,
  inventoryList: Array<{ name: string; unit: string; price?: number; priceUnit?: string }>,
  servingsRatio = 1,
  catalogList?: MasterIngredient[],
  baseServings?: number
): {
  totalCost: number;
  costPerServing: number;
  hasCatalogEstimates: boolean;
  unpricedCount: number;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    cost: number;
    rateDisplay: string;
    source: 'pantry' | 'catalog' | 'none';
  }>;
} {
  const catalog = catalogList ?? ingredientCatalogService.getLoadedCatalog();
  let total = 0;
  let hasCatalogEstimates = false;
  let unpricedCount = 0;

  const items = ingredients.map((ing) => {
    const scaledQty = ing.quantity * servingsRatio;

    let price = ing.price;
    let priceUnit = ing.priceUnit;
    let source: 'pantry' | 'catalog' | 'none' = price && price > 0 ? 'pantry' : 'none';
    let avgGramsPerUnit: number | undefined;
    let avgMlPerUnit: number | undefined;

    if (!price || price <= 0) {
      const resolved = resolveIngredientPrice(ing.name, inventoryList, catalog);
      price = resolved.price;
      priceUnit = resolved.priceUnit;
      source = resolved.source;
      avgGramsPerUnit = resolved.avgGramsPerUnit;
      avgMlPerUnit = resolved.avgMlPerUnit;
    } else {
      const catMatch = findBestIngredientMatch(ing.name, catalog);
      avgGramsPerUnit = catMatch?.avgGramsPerUnit;
      avgMlPerUnit = catMatch?.avgMlPerUnit;
    }

    if (source === 'catalog') {
      hasCatalogEstimates = true;
    } else if (source === 'none') {
      unpricedCount++;
    }

    const cost = calculateIngredientCost(scaledQty, ing.unit, price, priceUnit, avgGramsPerUnit, avgMlPerUnit);
    total += cost;

    return {
      name: ing.name,
      quantity: Math.round(scaledQty * 100) / 100,
      unit: ing.unit,
      cost,
      rateDisplay: price && price > 0 ? formatPriceRate(price, priceUnit, false) : 'Unpriced',
      source,
    };
  });

  const effectiveServings = (baseServings || 4) * (servingsRatio > 0 ? servingsRatio : 1);

  return {
    totalCost: Math.round(total * 100) / 100,
    costPerServing: effectiveServings > 0 ? Math.round((total / effectiveServings) * 100) / 100 : 0,
    hasCatalogEstimates,
    unpricedCount,
    items,
  };
}
