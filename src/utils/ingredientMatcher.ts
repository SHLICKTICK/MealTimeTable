/**
 * Safe ingredient identity normalisation and matching utility.
 *
 * Matching order:
 * 1. Exact normalised name match
 * 2. Singularised canonical name match (handles "carrot" <-> "carrots", case, whitespace)
 * 3. Exact or canonical alias match
 * 4. Token-based similarity with strict identity-qualifier & collision guards
 *    (prevents merging "Fresh milk" vs "Powdered milk", "Salt" vs "Garlic salt",
 *     "Fresh tomatoes" vs "Tomato paste", "Butter" vs "Margarine", etc.)
 * 5. Ambiguity detection when multiple distinct pantry items tie closely.
 */

export type MatchConfidence = 'exact' | 'canonical' | 'alias' | 'fuzzy' | 'ambiguous' | 'none';

export interface IngredientMatchResult<T> {
  match: T | null;
  confidence: MatchConfidence;
  needsReview: boolean;
  ambiguousCandidates?: T[];
  reason?: string;
}

const COLLISION_PAIRS: Array<[string, string]> = [
  ['egg', 'eggplant'],
  ['butter', 'margarine'],
  ['butter', 'buttermilk'],
  ['butter', 'peanut butter'],
  ['butter', 'almond butter'],
  ['butter', 'cashew butter'],
  ['butter', 'cocoa butter'],
  ['cream', 'cream cheese'],
  ['cream', 'coconut cream'],
  ['cream', 'sour cream'],
  ['cream', 'ice cream'],
  ['milk', 'powdered milk'],
  ['milk', 'condensed milk'],
  ['milk', 'evaporated milk'],
  ['milk', 'coconut milk'],
  ['milk', 'oat milk'],
  ['milk', 'almond milk'],
  ['milk', 'soy milk'],
  ['milk', 'buttermilk'],
  ['salt', 'garlic salt'],
  ['salt', 'onion salt'],
  ['salt', 'celery salt'],
  ['salt', 'epsom salt'],
  ['pepper', 'bell pepper'],
  ['pepper', 'chili pepper'],
  ['pepper', 'chilli pepper'],
  ['pepper', 'cayenne pepper'],
  ['garlic', 'garlic head'],
  ['garlic clove', 'garlic head'],
  ['garlic', 'garlic powder'],
  ['garlic', 'garlic salt'],
  ['tomato', 'tomato paste'],
  ['tomato', 'tomato puree'],
  ['tomato', 'tomato sauce'],
  ['tomato', 'tomato relish'],
  ['tomato', 'sun-dried tomato'],
  ['onion', 'onion powder'],
  ['onion', 'onion salt'],
  ['onion', 'onion relish'],
  ['onion', 'spring onion'],
  ['onion', 'green onion'],
  ['chicken', 'chicken stock'],
  ['chicken', 'chicken broth'],
  ['beef', 'beef stock'],
  ['beef', 'beef broth'],
  ['beef', 'beef seasoning'],
  ['vegetable', 'vegetable stock'],
  ['vegetable', 'vegetable broth'],
  ['rice', 'rice flour'],
  ['rice', 'rice vinegar'],
  ['flour', 'almond flour'],
  ['flour', 'coconut flour'],
  ['flour', 'cornflour'],
  ['flour', 'rice flour'],
];

/**
 * Qualifiers that fundamentally change what an ingredient IS (form, derivative, or spice blend).
 * If one label contains one of these tokens and the other does not, they must NOT fuzzy-merge.
 */
const IDENTITY_QUALIFIERS = new Set([
  'powder',
  'powdered',
  'paste',
  'puree',
  'sauce',
  'relish',
  'ketchup',
  'stock',
  'broth',
  'bouillon',
  'seasoning',
  'margarine',
  'vinegar',
  'oil',
  'flour',
  'starch',
  'cornflour',
  'syrup',
  'extract',
  'essence',
  'dried',
  'sun-dried',
  'dehydrated',
  'condensed',
  'evaporated',
  'coconut',
  'almond',
  'soy',
  'oat',
  'peanut',
  'cashew',
  'cocoa',
  'garlic',
  'onion',
  'celery',
  'chili',
  'chilli',
  'cayenne',
  'smoked',
  'pickled',
  'butter',
  'milk',
  'cream',
  'cheese',
  'salt',
  'sugar',
  'spring',
  'green',
  'sweet',
  'icing',
  'buttermilk',
  'eggplant',
]);

const BENIGN_MODIFIER_WORDS = new Set([
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
  'slices',
  'slice',
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
  'farmhouse',
  'organic',
  'lean',
  'unsalted',
  'salted',
  'yellow',
  'brown',
  'white',
  'red',
  'chilled',
  'warm',
  'pieces',
  'piece',
  'chunk',
  'chunks',
  'clove',
  'cloves',
  'fillet',
  'fillets',
  'or',
  'and',
]);

const NON_SINGULARIZE_WORDS = new Set([
  'asparagus',
  'couscous',
  'hummus',
  'citrus',
  'glass',
  'grass',
  'moss',
  'molasses',
  'swiss',
]);

export function singularizeWord(word: string): string {
  const w = word.trim().toLowerCase();
  if (w.length <= 3 || NON_SINGULARIZE_WORDS.has(w)) return w;
  if (w.endsWith('ss') || w.endsWith('us') || w.endsWith('is')) return w;

  if (w.endsWith('ies') && w.length > 4) {
    return `${w.slice(0, -3)}y`;
  }
  if (w.endsWith('oes') && w.length > 4) {
    return w.slice(0, -2);
  }
  if (w.endsWith('ves') && w.length > 4) {
    return `${w.slice(0, -3)}f`;
  }
  if (/(ches|shes|xes|zes)$/.test(w) && w.length > 4) {
    return w.slice(0, -2);
  }
  if (w.endsWith('s')) {
    return w.slice(0, -1);
  }
  return w;
}

export function normalizeIngredientName(value: string): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[^a-z0-9&/\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Produces a singularised canonical key keeping all meaningful tokens
 * (e.g. "  Carrots " -> "carrot", "Powdered  Milk" -> "powdered milk").
 */
export function canonicalizeIngredientName(value: string): string {
  const norm = normalizeIngredientName(value);
  if (!norm) return '';
  return norm
    .split(/\s+/)
    .map((token) => singularizeWord(token))
    .join(' ')
    .trim();
}

/**
 * Produces a core canonical key with benign freshness/size adjectives removed
 * (e.g. "Fresh Carrots" -> "carrot", "Free-range eggs" -> "egg").
 */
export function getCoreIngredientKey(value: string): string {
  const norm = normalizeIngredientName(value);
  if (!norm) return '';
  const core = norm
    .split(/[\s/&-]+/)
    .map((t) => singularizeWord(t))
    .filter((t) => t.length >= 2 && !BENIGN_MODIFIER_WORDS.has(t));
  return core.join(' ').trim();
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toSingularPhrase(value: string): string {
  return normalizeIngredientName(value)
    .split(/[\s/&-]+/)
    .filter(Boolean)
    .map(singularizeWord)
    .join(' ');
}

function hasCollision(a: string, b: string): boolean {
  const sa = toSingularPhrase(a);
  const sb = toSingularPhrase(b);

  for (const [shortTerm, longTerm] of COLLISION_PAIRS) {
    const shortRegex = new RegExp(`\\b${escapeRegExp(shortTerm)}\\b`);
    const aHasShort = shortRegex.test(sa) && !sa.includes(longTerm);
    const bHasLong = sb.includes(longTerm);
    const bHasShort = shortRegex.test(sb) && !sb.includes(longTerm);
    const aHasLong = sa.includes(longTerm);
    if ((aHasShort && bHasLong) || (bHasShort && aHasLong)) {
      return true;
    }
  }

  // Symmetric identity-qualifier guard: if one side contains an identity-altering qualifier
  // that the other side lacks, do not auto-merge.
  const tokensA = new Set(sa.split(' ').filter(Boolean));
  const tokensB = new Set(sb.split(' ').filter(Boolean));

  for (const tok of tokensA) {
    if (IDENTITY_QUALIFIERS.has(tok) && !tokensB.has(tok)) {
      return true;
    }
  }
  for (const tok of tokensB) {
    if (IDENTITY_QUALIFIERS.has(tok) && !tokensA.has(tok)) {
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

function extractCoreTokens(normalized: string): string[] {
  return normalized
    .split(/[\s/&-]+/)
    .map((t) => singularizeWord(t.trim()))
    .filter((t) => t.length >= 3 && !BENIGN_MODIFIER_WORDS.has(t));
}

function splitAlternatives(normalized: string): string[] {
  if (!normalized.includes(' or ')) return [normalized];
  return normalized
    .split(/\s+or\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function matchIngredient<T extends { name: string; aliases?: string[] }>(
  queryName: string,
  candidates: T[]
): IngredientMatchResult<T> {
  const rawQuery = normalizeIngredientName(queryName);
  if (!rawQuery || candidates.length === 0) {
    return { match: null, confidence: 'none', needsReview: false };
  }

  const queryForms = splitAlternatives(rawQuery);
  const canonicalQueries = queryForms.map(canonicalizeIngredientName).filter(Boolean);
  const coreQueries = queryForms.map(getCoreIngredientKey).filter(Boolean);

  // 1. Exact normalised name match
  for (const item of candidates) {
    const itemNorm = normalizeIngredientName(item.name);
    if (queryForms.includes(itemNorm)) {
      return { match: item, confidence: 'exact', needsReview: false };
    }
  }

  // 2. Singularised canonical name match (e.g. "Carrot" <-> "Carrots")
  const canonicalMatches = candidates.filter((item) => {
    const itemCanonical = canonicalizeIngredientName(item.name);
    return canonicalQueries.includes(itemCanonical);
  });
  if (canonicalMatches.length === 1) {
    return { match: canonicalMatches[0], confidence: 'canonical', needsReview: false };
  }
  if (canonicalMatches.length > 1) {
    return {
      match: null,
      confidence: 'ambiguous',
      needsReview: true,
      ambiguousCandidates: canonicalMatches,
      reason: `Multiple pantry items match "${queryName}": ${canonicalMatches.map((c) => c.name).join(', ')}.`,
    };
  }

  // 3. Exact or canonical alias match
  for (const item of candidates) {
    const aliases = item.aliases || [];
    if (
      aliases.some((alias) => {
        const aNorm = normalizeIngredientName(alias);
        const aCanon = canonicalizeIngredientName(alias);
        return queryForms.includes(aNorm) || canonicalQueries.includes(aCanon);
      })
    ) {
      return { match: item, confidence: 'alias', needsReview: false };
    }
  }

  // 4. Core canonical match (ignoring only benign modifiers like "fresh", "large", "free-range")
  const coreMatches = candidates.filter((item) => {
    const itemCore = getCoreIngredientKey(item.name);
    if (!itemCore) return false;
    return coreQueries.some((cq) => cq === itemCore && !hasCollision(rawQuery, item.name));
  });
  if (coreMatches.length === 1) {
    return { match: coreMatches[0], confidence: 'canonical', needsReview: false };
  }
  if (coreMatches.length > 1) {
    return {
      match: null,
      confidence: 'ambiguous',
      needsReview: true,
      ambiguousCandidates: coreMatches,
      reason: `Multiple pantry items match "${queryName}": ${coreMatches.map((c) => c.name).join(', ')}.`,
    };
  }

  // 5. Scored fuzzy token similarity (strictly guarded against collisions & conflicting qualifiers)
  const scored: Array<{ item: T; score: number }> = [];

  for (const item of candidates) {
    const labels = [item.name, ...(item.aliases || [])].map(normalizeIngredientName);
    let itemBestScore = 0;

    for (const qForm of queryForms) {
      const qCanon = canonicalizeIngredientName(qForm);
      const qTokens = extractCoreTokens(qForm);

      for (const label of labels) {
        if (!label || hasCollision(qForm, label)) continue;

        const labelCanon = canonicalizeIngredientName(label);
        let score = 0;

        if (containsWholePhrase(qCanon, labelCanon)) {
          score = Math.max(score, 60 + labelCanon.length);
        } else if (containsWholePhrase(labelCanon, qCanon)) {
          score = Math.max(score, 55 + qCanon.length);
        }

        if (qTokens.length > 0) {
          const labelTokens = extractCoreTokens(label);
          if (labelTokens.length > 0) {
            let shared = 0;
            for (const qt of qTokens) {
              if (labelTokens.some((lt) => lt === qt)) {
                shared++;
              }
            }
            if (shared > 0) {
              const coverage = shared / Math.max(qTokens.length, labelTokens.length);
              score = Math.max(score, Math.round(shared * 25 + coverage * 30));
            }
          }
        }

        if (score > itemBestScore) {
          itemBestScore = score;
        }
      }
    }

    if (itemBestScore >= 40) {
      scored.push({ item, score: itemBestScore });
    }
  }

  if (scored.length === 0) {
    return { match: null, confidence: 'none', needsReview: false };
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored[0];

  // If a second candidate is within 4 points of the top fuzzy score, flag as ambiguous for review
  const closeRunners = scored.filter((s) => top.score - s.score <= 4);
  if (closeRunners.length > 1) {
    return {
      match: null,
      confidence: 'ambiguous',
      needsReview: true,
      ambiguousCandidates: closeRunners.map((r) => r.item),
      reason: `Ambiguous ingredient match for "${queryName}" (${closeRunners.map((r) => r.item.name).join(' vs ')}).`,
    };
  }

  return { match: top.item, confidence: 'fuzzy', needsReview: false };
}

export function findBestIngredientMatch<T extends { name: string; aliases?: string[] }>(
  queryName: string,
  candidates: T[]
): T | null {
  return matchIngredient(queryName, candidates).match;
}
