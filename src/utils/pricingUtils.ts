/**
 * Pricing and unit-conversion utilities for ingredients (solid, liquid, and discrete units).
 * Supports South African Rand (ZAR / R) formatting and automatic rate normalization:
 * - Solids: priced per kg or per g (1 kg = 1000 g)
 * - Liquids: priced per L or per ml (1 L = 1000 ml, culinary tsp/tbsp/cup conversions)
 * - Count / items: priced per piece, unit, can, pack, etc.
 */

export type SolidPriceUnit = 'kg' | 'g';
export type LiquidPriceUnit = 'L' | 'ml';
export type DiscretePriceUnit = 'piece' | 'can' | 'pack' | 'unit';

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

  // Discrete / countable item
  return [
    { value: 'piece', label: 'per piece / item', isDefault: true },
    { value: 'can', label: 'per can' },
    { value: 'pack', label: 'per pack' },
    { value: 'unit', label: 'per unit' },
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
 * Calculates the cost of an ingredient quantity based on its pricing.
 * Examples:
 * - 500 g at R85.00 / kg => R42.50
 * - 250 ml at R18.50 / L => R4.63
 * - 2 tbsp (30 ml) at R38.00 / L => R1.14
 * - 3 pieces at R4.50 / piece => R13.50
 */
export function calculateIngredientCost(
  quantity: number,
  quantityUnit: string,
  price?: number,
  priceUnit?: string
): number {
  if (!price || price <= 0 || !quantity || quantity <= 0) {
    return 0;
  }

  const pUnit = (priceUnit || '').trim().toLowerCase();
  const base = toBaseQuantity(quantity, quantityUnit);

  if (base.type === 'solid') {
    // Base is grams
    let costPerGram = 0;
    if (pUnit === 'kg' || pUnit === 'kilogram' || pUnit === 'kilograms') {
      costPerGram = price / 1000;
    } else if (pUnit === 'g' || pUnit === 'gram' || pUnit === 'grams') {
      costPerGram = price;
    } else if (pUnit === 'mg') {
      costPerGram = price * 1000;
    } else {
      // Default to per-kg if ambiguous or standard price
      costPerGram = price > 10 ? price / 1000 : price;
    }
    return base.amount * costPerGram;
  }

  if (base.type === 'liquid') {
    // Base is ml
    let costPerMl = 0;
    if (pUnit === 'l' || pUnit === 'liter' || pUnit === 'liters' || pUnit === 'litre' || pUnit === 'litres') {
      costPerMl = price / 1000;
    } else if (pUnit === 'ml' || pUnit === 'milliliter' || pUnit === 'milliliters') {
      costPerMl = price;
    } else {
      // Default to per-liter if price > 5
      costPerMl = price > 5 ? price / 1000 : price;
    }
    return base.amount * costPerMl;
  }

  // Discrete / countable
  return quantity * price;
}

/**
 * Calculates the total monetary value of current in-stock inventory for an item.
 */
export function getItemStockValue(item: {
  quantity: number;
  unit: string;
  price?: number;
  priceUnit?: string;
}): number {
  return calculateIngredientCost(item.quantity, item.unit, item.price, item.priceUnit);
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
 * Calculates recipe cost by matching recipe ingredients against inventory items
 * or ingredient prices, scaling by serving ratio.
 */
export function calculateRecipeCostBreakdown(
  ingredients: Array<{ name: string; quantity: number; unit: string; price?: number; priceUnit?: string }>,
  inventoryList: Array<{ name: string; unit: string; price?: number; priceUnit?: string }>,
  servingsRatio = 1
): {
  totalCost: number;
  costPerServing: number;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    cost: number;
    rateDisplay: string;
  }>;
} {
  let total = 0;
  const items = ingredients.map((ing) => {
    const scaledQty = ing.quantity * servingsRatio;

    // Match inventory pricing by ingredient name if not directly on the ingredient
    let price = ing.price;
    let priceUnit = ing.priceUnit;

    if (!price || price <= 0) {
      const match = inventoryList.find(
        (inv) =>
          inv.name.trim().toLowerCase() === ing.name.trim().toLowerCase() ||
          inv.name.toLowerCase().includes(ing.name.toLowerCase()) ||
          ing.name.toLowerCase().includes(inv.name.toLowerCase())
      );
      if (match && match.price) {
        price = match.price;
        priceUnit = match.priceUnit;
      }
    }

    const cost = calculateIngredientCost(scaledQty, ing.unit, price, priceUnit);
    total += cost;

    return {
      name: ing.name,
      quantity: Math.round(scaledQty * 100) / 100,
      unit: ing.unit,
      cost,
      rateDisplay: price ? formatPriceRate(price, priceUnit, false) : 'Unpriced',
    };
  });

  return {
    totalCost: Math.round(total * 100) / 100,
    costPerServing: servingsRatio > 0 ? Math.round((total / (4 * servingsRatio)) * 100) / 100 : 0,
    items,
  };
}
