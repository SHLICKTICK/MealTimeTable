/**
 * Unit conversion utilities for ingredient measurements across recipes and inventory.
 */

// Normalization maps
const WEIGHT_UNITS = new Set(['g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms', 'mg']);
const VOLUME_UNITS = new Set(['ml', 'milliliter', 'milliliters', 'l', 'litre', 'litres', 'liter', 'liters']);
const COUNT_UNITS = new Set(['piece', 'pieces', 'whole', 'slice', 'slices', 'medium', 'large', 'small', 'clove', 'cloves', 'can', 'cans', 'pack', 'packs']);

export function normalizeUnit(unit: string): string {
  const u = unit.trim().toLowerCase();
  if (u === 'gram' || u === 'grams') return 'g';
  if (u === 'kilogram' || u === 'kilograms') return 'kg';
  if (u === 'milliliter' || u === 'milliliters') return 'ml';
  if (u === 'litre' || u === 'litres' || u === 'liter' || u === 'liters') return 'L';
  if (u === 'piece' || u === 'pieces') return 'pieces';
  if (u === 'slice' || u === 'slices') return 'slices';
  if (u === 'clove' || u === 'cloves') return 'cloves';
  if (u === 'can' || u === 'cans') return 'cans';
  return u;
}

export function areUnitsCompatible(unitA: string, unitB: string): boolean {
  const a = normalizeUnit(unitA);
  const b = normalizeUnit(unitB);

  if (a === b) return true;
  if (WEIGHT_UNITS.has(a) && WEIGHT_UNITS.has(b)) return true;
  if (VOLUME_UNITS.has(a) && VOLUME_UNITS.has(b)) return true;
  if (COUNT_UNITS.has(a) && COUNT_UNITS.has(b)) return true;

  return false;
}

/**
 * Converts a quantity from one unit to another.
 * Returns null if the units are incompatible (e.g. grams to litres without density).
 */
export function convertQuantity(amount: number, fromUnit: string, toUnit: string): number | null {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);

  if (from === to) return amount;

  // Weight conversions (base: grams)
  if (WEIGHT_UNITS.has(from) && WEIGHT_UNITS.has(to)) {
    let inGrams = amount;
    if (from === 'kg') inGrams = amount * 1000;
    else if (from === 'mg') inGrams = amount / 1000;

    if (to === 'g') return inGrams;
    if (to === 'kg') return inGrams / 1000;
    if (to === 'mg') return inGrams * 1000;
  }

  // Volume conversions (base: ml)
  if (VOLUME_UNITS.has(from) && VOLUME_UNITS.has(to)) {
    let inMl = amount;
    if (from === 'l') inMl = amount * 1000;

    if (to === 'ml') return inMl;
    if (to === 'l') return inMl / 1000;
  }

  // Count/piece units (treat 1-to-1 if both count)
  if (COUNT_UNITS.has(from) && COUNT_UNITS.has(to)) {
    return amount;
  }

  // Incompatible
  return null;
}

export function formatSmartQuantity(amount: number, unit: string): string {
  const norm = normalizeUnit(unit);
  const clean = (n: number) => (Number.isInteger(n) ? n.toString() : (Math.round(n * 100) / 100).toString());

  if (norm === 'g' && amount >= 1000) {
    return `${clean(amount / 1000)} kg`;
  }
  if (norm === 'ml' && amount >= 1000) {
    return `${clean(amount / 1000)} L`;
  }
  return `${clean(amount)} ${unit}`;
}
