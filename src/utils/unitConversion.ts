/**
 * Unit normalisation, compatibility checking, and quantity conversion utilities
 * for ingredient measurements across recipes, pantry inventory, and shopping lists.
 *
 * Units are separated into strict dimensions:
 * - mass (base: g)
 * - volume (base: ml)
 * - count (discrete countable units)
 *
 * Mass and volume are never implicitly converted without an explicit density rule.
 */

export type UnitDimension = 'mass' | 'volume' | 'count' | 'unknown';

export interface UnitConversionResult {
  ok: boolean;
  value: number | null;
  normalizedFrom: string;
  normalizedTo: string;
  dimensionFrom: UnitDimension;
  dimensionTo: UnitDimension;
  reason?: string;
}

const MASS_TO_GRAMS: Record<string, number> = {
  mg: 0.001,
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};

// 1 US cup = 236.588 ml = 8 US fl oz = 16 US tbsp = 48 US tsp
// Note: 1 US fl oz = 29.5735 ml; 29.5735 * 8 = 236.588 ml; 1 tbsp = 3 tsp.
const VOLUME_TO_ML: Record<string, number> = {
  ml: 1,
  L: 1000,
  tsp: 236.588 / 48,
  tbsp: 236.588 / 16,
  'fl oz': 29.5735,
  cup: 236.588,
};

/**
 * Generic whole-item count units that can safely map 1:1 with each other
 * (e.g., "1 medium onion" vs "1 large onion" or "2 pieces" vs "2 whole").
 * Sub-units like cloves, slices, cans, pack, pinch, bunch, stalk, head only match themselves.
 */
const GENERIC_COUNT_UNITS = new Set([
  'pieces',
  'whole',
  'medium',
  'large',
  'small',
]);

const DISTINCT_COUNT_UNITS = new Set([
  'slices',
  'cloves',
  'cans',
  'pack',
  'pinch',
  'bunch',
  'stalk',
  'head',
]);

const UNIT_ALIASES: Record<string, string> = {
  // Mass
  mg: 'mg',
  milligram: 'mg',
  milligrams: 'mg',
  milligramme: 'mg',
  milligrammes: 'mg',
  g: 'g',
  gram: 'g',
  grams: 'g',
  gramme: 'g',
  grammes: 'g',
  kg: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  kilogramme: 'kg',
  kilogrammes: 'kg',
  oz: 'oz',
  ounce: 'oz',
  ounces: 'oz',
  lb: 'lb',
  lbs: 'lb',
  pound: 'lb',
  pounds: 'lb',

  // Volume
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  l: 'L',
  liter: 'L',
  liters: 'L',
  litre: 'L',
  litres: 'L',
  tsp: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tbsp: 'tbsp',
  tbs: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  cup: 'cup',
  cups: 'cup',
  'fl oz': 'fl oz',
  floz: 'fl oz',
  'fluid ounce': 'fl oz',
  'fluid ounces': 'fl oz',

  // Count / Discrete
  piece: 'pieces',
  pieces: 'pieces',
  unit: 'pieces',
  units: 'pieces',
  each: 'pieces',
  ea: 'pieces',
  whole: 'whole',
  medium: 'medium',
  large: 'large',
  small: 'small',
  slice: 'slices',
  slices: 'slices',
  clove: 'cloves',
  cloves: 'cloves',
  can: 'cans',
  cans: 'cans',
  pack: 'pack',
  packs: 'pack',
  package: 'pack',
  packages: 'pack',
  pinch: 'pinch',
  pinches: 'pinch',
  bunch: 'bunch',
  bunches: 'bunch',
  stalk: 'stalk',
  stalks: 'stalk',
  head: 'head',
  heads: 'head',
};

/**
 * Strips floating-point representation noise (e.g. 5.999999999999999 -> 6)
 * while preserving full numeric precision.
 */
function cleanFloatingNoise(value: number): number {
  if (!Number.isFinite(value)) return value;
  const rounded = Number(value.toPrecision(12));
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function roundForStorage(value: number, decimals: number = 6): number {
  if (!Number.isFinite(value)) return 0;
  const factor = Math.pow(10, decimals);
  const rounded = Math.round((value + Number.EPSILON) * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function normalizeUnit(unit: string): string {
  const cleaned = (unit || '')
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ');
  return UNIT_ALIASES[cleaned] ?? cleaned;
}

export function getUnitDimension(unit: string): UnitDimension {
  const norm = normalizeUnit(unit);
  if (!norm) return 'unknown';
  if (norm in MASS_TO_GRAMS) return 'mass';
  if (norm in VOLUME_TO_ML) return 'volume';
  if (GENERIC_COUNT_UNITS.has(norm) || DISTINCT_COUNT_UNITS.has(norm)) return 'count';
  return 'unknown';
}

export function areUnitsCompatible(unitA: string, unitB: string): boolean {
  const a = normalizeUnit(unitA);
  const b = normalizeUnit(unitB);
  const dimA = getUnitDimension(a);
  const dimB = getUnitDimension(b);

  if (dimA === 'unknown' || dimB === 'unknown') {
    return false;
  }

  if (a === b) return true;
  if (dimA !== dimB) return false;

  if (dimA === 'mass' || dimA === 'volume') {
    return true;
  }

  // Count dimension: only generic item counts convert 1:1 among themselves
  return GENERIC_COUNT_UNITS.has(a) && GENERIC_COUNT_UNITS.has(b);
}

/**
 * Converts a quantity from one unit to another and reports explicit failure reasons
 * whenever units are unknown or incompatible.
 */
export function convertQuantityDetailed(
  amount: number,
  fromUnit: string,
  toUnit: string
): UnitConversionResult {
  const normalizedFrom = normalizeUnit(fromUnit);
  const normalizedTo = normalizeUnit(toUnit);
  const dimensionFrom = getUnitDimension(normalizedFrom);
  const dimensionTo = getUnitDimension(normalizedTo);

  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return {
      ok: false,
      value: null,
      normalizedFrom,
      normalizedTo,
      dimensionFrom,
      dimensionTo,
      reason: 'Invalid numeric quantity.',
    };
  }

  if (dimensionFrom === 'unknown') {
    return {
      ok: false,
      value: null,
      normalizedFrom,
      normalizedTo,
      dimensionFrom,
      dimensionTo,
      reason: `Unknown measurement unit: "${fromUnit}".`,
    };
  }

  if (dimensionTo === 'unknown') {
    return {
      ok: false,
      value: null,
      normalizedFrom,
      normalizedTo,
      dimensionFrom,
      dimensionTo,
      reason: `Unknown measurement unit: "${toUnit}".`,
    };
  }

  if (normalizedFrom === normalizedTo) {
    return {
      ok: true,
      value: cleanFloatingNoise(amount),
      normalizedFrom,
      normalizedTo,
      dimensionFrom,
      dimensionTo,
    };
  }

  if (dimensionFrom !== dimensionTo) {
    return {
      ok: false,
      value: null,
      normalizedFrom,
      normalizedTo,
      dimensionFrom,
      dimensionTo,
      reason: `Incompatible units: cannot convert ${dimensionFrom} ("${normalizedFrom}") to ${dimensionTo} ("${normalizedTo}") without an explicit conversion rule.`,
    };
  }

  if (dimensionFrom === 'mass') {
    const inGrams = amount * MASS_TO_GRAMS[normalizedFrom];
    const converted = cleanFloatingNoise(inGrams / MASS_TO_GRAMS[normalizedTo]);
    return {
      ok: true,
      value: converted,
      normalizedFrom,
      normalizedTo,
      dimensionFrom,
      dimensionTo,
    };
  }

  if (dimensionFrom === 'volume') {
    const inMl = amount * VOLUME_TO_ML[normalizedFrom];
    const converted = cleanFloatingNoise(inMl / VOLUME_TO_ML[normalizedTo]);
    return {
      ok: true,
      value: converted,
      normalizedFrom,
      normalizedTo,
      dimensionFrom,
      dimensionTo,
    };
  }

  // Count dimension
  if (GENERIC_COUNT_UNITS.has(normalizedFrom) && GENERIC_COUNT_UNITS.has(normalizedTo)) {
    return {
      ok: true,
      value: cleanFloatingNoise(amount),
      normalizedFrom,
      normalizedTo,
      dimensionFrom,
      dimensionTo,
    };
  }

  return {
    ok: false,
    value: null,
    normalizedFrom,
    normalizedTo,
    dimensionFrom,
    dimensionTo,
    reason: `Incompatible count units: cannot convert "${normalizedFrom}" to "${normalizedTo}" without an explicit equivalence rule.`,
  };
}

/**
 * Converts a quantity from one unit to another.
 * Returns null if the units are unknown or incompatible.
 */
export function convertQuantity(amount: number, fromUnit: string, toUnit: string): number | null {
  const result = convertQuantityDetailed(amount, fromUnit, toUnit);
  return result.ok ? result.value : null;
}

export function formatSmartQuantity(amount: number, unit: string): string {
  const norm = normalizeUnit(unit);
  const clean = (n: number) => {
    const rounded = Math.round(n * 100) / 100;
    return Number.isInteger(rounded) ? rounded.toString() : rounded.toString();
  };

  if (norm === 'g' && amount >= 1000) {
    return `${clean(amount / 1000)} kg`;
  }
  if (norm === 'ml' && amount >= 1000) {
    return `${clean(amount / 1000)} L`;
  }
  return `${clean(amount)} ${unit}`;
}
