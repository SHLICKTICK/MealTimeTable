/**
 * Safe ingredient name matching utility.
 * Matches in priority order:
 * 1. Exact normalized canonical name
 * 2. Exact normalized alias
 * 3. Word-boundary whole-token containment (preventing false collisions such as
 *    "egg" -> "eggplant", "butter" -> "buttermilk", "pepper" -> "bell pepper", "cream" -> "cream cheese").
 */

const COLLISION_PAIRS: Array<[string, string]> = [
  ['egg', 'eggplant'],
  ['eggs', 'eggplant'],
  ['butter', 'buttermilk'],
  ['butter', 'peanut butter'],
  ['butter', 'almond butter'],
  ['butter', 'cashew butter'],
  ['cream', 'cream cheese'],
  ['cream', 'coconut cream'],
  ['cream', 'sour cream'],
  ['milk', 'coconut milk'],
  ['milk', 'buttermilk'],
  ['pepper', 'bell pepper'],
  ['pepper', 'peppers'],
  ['garlic', 'garlic head'],
  ['garlic cloves', 'garlic head'],
  ['tomato', 'tomato relish'],
  ['onion', 'onion relish'],
];

export function normalizeIngredientName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[^a-z0-9&/\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasCollision(a: string, b: string): boolean {
  for (const [shortTerm, longTerm] of COLLISION_PAIRS) {
    const aHasShort = new RegExp(`\\b${escapeRegExp(shortTerm)}\\b`).test(a) && !a.includes(longTerm);
    const bHasLong = b.includes(longTerm);
    const bHasShort = new RegExp(`\\b${escapeRegExp(shortTerm)}\\b`).test(b) && !b.includes(longTerm);
    const aHasLong = a.includes(longTerm);
    if ((aHasShort && bHasLong) || (bHasShort && aHasLong)) {
      return true;
    }
  }
  return false;
}

function containsWholePhrase(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false;
  if (hasCollision(haystack, needle)) return false;
  const regex = new RegExp(`(?:^|\\b)${escapeRegExp(needle)}(?:\\b|$)`, 'i');
  return regex.test(haystack);
}

const IGNORED_MODIFIER_WORDS = new Set([
  'fresh',
  'ripe',
  'large',
  'medium',
  'small',
  'whole',
  'raw',
  'plain',
  'crisp',
  'baby',
  'thick',
  'sliced',
  'pure',
  'extra',
  'virgin',
  'free-range',
  'free',
  'range',
  'toasted',
  'cracked',
  'sea',
  'all-purpose',
  'coarse',
  'or',
  'and',
]);

function extractCoreTokens(normalized: string): string[] {
  return normalized
    .split(/[\s/&-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !IGNORED_MODIFIER_WORDS.has(t));
}

export function findBestIngredientMatch<T extends { name: string; aliases?: string[] }>(
  queryName: string,
  candidates: T[]
): T | null {
  const query = normalizeIngredientName(queryName);
  if (!query || candidates.length === 0) return null;

  // 1. Exact canonical name match
  for (const item of candidates) {
    if (normalizeIngredientName(item.name) === query) {
      return item;
    }
  }

  // 2. Exact alias match
  for (const item of candidates) {
    if (item.aliases?.some((alias) => normalizeIngredientName(alias) === query)) {
      return item;
    }
  }

  // 3. Word-boundary & token similarity scoring
  const queryTokens = extractCoreTokens(query);
  let bestCandidate: T | null = null;
  let bestScore = 0;

  for (const item of candidates) {
    const labels = [item.name, ...(item.aliases || [])].map(normalizeIngredientName);

    for (const label of labels) {
      if (!label || hasCollision(query, label)) continue;

      let score = 0;

      // Exact phrase containment on word boundaries
      if (containsWholePhrase(query, label)) {
        score = Math.max(score, 60 + label.length);
      } else if (containsWholePhrase(label, query)) {
        score = Math.max(score, 55 + query.length);
      }

      // Core token overlap
      if (queryTokens.length > 0) {
        const labelTokens = extractCoreTokens(label);
        if (labelTokens.length > 0) {
          let shared = 0;
          for (const qt of queryTokens) {
            if (
              labelTokens.some(
                (lt) => lt === qt || (lt.length >= 4 && qt.length >= 4 && (lt === `${qt}s` || qt === `${lt}s`))
              )
            ) {
              shared++;
            }
          }
          if (shared > 0) {
            const coverage = shared / Math.max(queryTokens.length, labelTokens.length);
            score = Math.max(score, Math.round(shared * 25 + coverage * 30));
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = item;
      }
    }
  }

  return bestScore >= 35 ? bestCandidate : null;
}
