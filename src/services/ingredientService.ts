import { Ingredient } from '../models/Ingredient';
import { WeeklyPlan } from '../models/WeeklyPlan';
import { recipeService } from './recipeService';
import { storageService, STORES } from './storageService';
import { inventoryService } from './inventoryService';
import { ingredientCatalogService } from './ingredientCatalogService';
import {
  areUnitsCompatible,
  convertQuantityDetailed,
  formatSmartQuantity,
  getUnitDimension,
  normalizeUnit,
  roundForStorage,
} from '../utils/unitConversion';
import { calculateIngredientCost, resolveIngredientPrice } from '../utils/pricingUtils';
import { canonicalizeIngredientName, matchIngredient } from '../utils/ingredientMatcher';

export interface ShoppingItemRequirement {
  mealLabel: string;
  quantity: number;
  unit: string;
}

export interface ShoppingItem extends Ingredient {
  displayQuantity: string;
  sourceMeals: string[];
  originalRequirements: ShoppingItemRequirement[];
  quantityRequired: number;
  quantityInStock: number;
  quantityToBuy: number;
  isSufficientInStock: boolean;
  addedToInventory?: boolean;
  resolvedPrice?: number;
  resolvedPriceUnit?: string;
  priceSource?: 'pantry' | 'catalog' | 'none';
  estimatedCostZAR?: number;
  needsReview?: boolean;
  conversionWarning?: string;
  matchedInventoryId?: string;
  pantryStockNative?: { quantity: number; unit: string } | null;
}

interface StoredShoppingState {
  id: string;
  purchased: Record<string, boolean>;
  addedToInventory: Record<string, boolean>;
}

interface AggregatedBucket {
  id: string;
  name: string;
  unit: string;
  category: Ingredient['category'];
  quantityRequired: number;
  sourceMeals: string[];
  originalRequirements: ShoppingItemRequirement[];
  matchedInventoryId?: string;
  ambiguousReason?: string;
}

class IngredientService {
  private inFlightRestocks: Set<string> = new Set();

  async getShoppingListForWeek(plan: WeeklyPlan): Promise<ShoppingItem[]> {
    await Promise.all([inventoryService.init(), ingredientCatalogService.init()]);
    const allRecipes = await recipeService.getAllRecipes();
    const recipeMap = new Map(allRecipes.map((r) => [r.id, r]));
    const inventoryList = inventoryService.getLoadedIngredients();
    const catalogList = ingredientCatalogService.getLoadedCatalog();

    // Fetch existing purchased items state from storage
    const storedState = (await storageService.get<StoredShoppingState>(
      STORES.SHOPPING_LIST,
      plan.id
    )) || { id: plan.id, purchased: {}, addedToInventory: {} };

    const inventoryById = new Map(inventoryList.map((i) => [i.id, i]));
    // Track unallocated pantry stock per pantry item ID so stock is subtracted at most once
    const remainingPantryStock = new Map<string, number>();
    for (const inv of inventoryList) {
      remainingPantryStock.set(inv.id, Math.max(0, Number.isFinite(inv.quantity) ? inv.quantity : 0));
    }

    const bucketMap = new Map<string, AggregatedBucket>();

    for (const day of plan.days) {
      const meals = [day.breakfast, day.dinner].filter(Boolean);
      for (const meal of meals) {
        if (!meal) continue;
        const recipe = recipeMap.get(meal.recipeId);
        if (!recipe) continue;

        const baseServings = recipe.servings > 0 ? recipe.servings : 4;
        const targetServings = meal.servings && meal.servings > 0 ? meal.servings : baseServings;
        const ratio = targetServings / baseServings;
        const mealLabel = `${day.dayName} ${meal.mealType === 'breakfast' ? 'Breakfast' : 'Dinner'}`;

        for (const ing of recipe.ingredients) {
          if (typeof ing.quantity !== 'number' || !Number.isFinite(ing.quantity) || ing.quantity <= 0) {
            continue;
          }

          const scaledQty = ing.quantity * ratio;
          const invMatch = matchIngredient(ing.name, inventoryList);
          const catMatch = matchIngredient(ing.name, catalogList);
          const matchedInv = invMatch.confidence !== 'ambiguous' ? invMatch.match : null;
          const matchedCat = catMatch.confidence !== 'ambiguous' ? catMatch.match : null;

          const identityKey = matchedInv
            ? `inv:${matchedInv.id}`
            : matchedCat
            ? `cat:${matchedCat.id}`
            : `raw:${canonicalizeIngredientName(ing.name) || ing.name.trim().toLowerCase()}`;

          const dim = getUnitDimension(ing.unit);
          const normUnit = normalizeUnit(ing.unit);

          let bucketKey: string;
          let bucketUnit: string;
          let qtyInBucketUnit: number;

          if (dim === 'mass') {
            const conv = convertQuantityDetailed(scaledQty, ing.unit, 'g');
            if (conv.ok && conv.value !== null) {
              bucketKey = `${identityKey}|dim:mass`;
              bucketUnit = 'g';
              qtyInBucketUnit = conv.value;
            } else {
              bucketKey = `${identityKey}|unit:${normUnit}`;
              bucketUnit = ing.unit;
              qtyInBucketUnit = scaledQty;
            }
          } else if (dim === 'volume') {
            const conv = convertQuantityDetailed(scaledQty, ing.unit, 'ml');
            if (conv.ok && conv.value !== null) {
              bucketKey = `${identityKey}|dim:volume`;
              bucketUnit = 'ml';
              qtyInBucketUnit = conv.value;
            } else {
              bucketKey = `${identityKey}|unit:${normUnit}`;
              bucketUnit = ing.unit;
              qtyInBucketUnit = scaledQty;
            }
          } else if (dim === 'count' && areUnitsCompatible(normUnit, 'pieces')) {
            // Generic whole-item counts (pieces, whole, medium, large, small) share one bucket
            bucketKey = `${identityKey}|dim:count:generic`;
            bucketUnit =
              matchedInv && areUnitsCompatible(matchedInv.unit, ing.unit)
                ? normalizeUnit(matchedInv.unit)
                : normUnit;
            qtyInBucketUnit = scaledQty;
          } else {
            // Distinct count units (cloves, slices, cans, etc.) or unknown units stay separated
            bucketKey = `${identityKey}|unit:${normUnit || ing.unit.trim().toLowerCase()}`;
            bucketUnit = normUnit || ing.unit.trim();
            qtyInBucketUnit = scaledQty;
          }

          const existing = bucketMap.get(bucketKey);
          const reqRecord: ShoppingItemRequirement = {
            mealLabel,
            quantity: roundForStorage(scaledQty, 4),
            unit: ing.unit,
          };

          if (existing) {
            existing.quantityRequired += qtyInBucketUnit;
            existing.originalRequirements.push(reqRecord);
            if (!existing.sourceMeals.includes(mealLabel)) {
              existing.sourceMeals.push(mealLabel);
            }
          } else {
            const resolvedCategory =
              ing.category && ing.category !== 'Pantry'
                ? ing.category
                : matchedCat?.category || matchedInv?.category || ing.category || 'Pantry';
            const displayName = matchedInv?.name || matchedCat?.name || ing.name.trim();
            const itemKey = `shop-${plan.id}-${bucketKey.replace(/[^a-z0-9]/gi, '_')}`;

            bucketMap.set(bucketKey, {
              id: itemKey,
              name: displayName,
              unit: bucketUnit,
              category: resolvedCategory,
              quantityRequired: qtyInBucketUnit,
              sourceMeals: [mealLabel],
              originalRequirements: [reqRecord],
              matchedInventoryId: matchedInv?.id,
              ambiguousReason: invMatch.confidence === 'ambiguous' ? invMatch.reason : undefined,
            });
          }
        }
      }
    }

    const items: ShoppingItem[] = [];

    for (const raw of bucketMap.values()) {
      const matchedStock = raw.matchedInventoryId ? inventoryById.get(raw.matchedInventoryId) ?? null : null;

      // Preserve single shared requirement unit when units are incompatible with pantry,
      // or when using culinary/imperial measures (e.g. cup, tbsp, tsp, oz, lb)
      const uniqueNormUnits = Array.from(
        new Set(raw.originalRequirements.map((r) => normalizeUnit(r.unit)))
      );
      let displayUnit = raw.unit;
      let totalRequired = raw.quantityRequired;

      if (uniqueNormUnits.length === 1) {
        const singleUnit = uniqueNormUnits[0];
        const isCompatibleWithStock = matchedStock
          ? areUnitsCompatible(matchedStock.unit, singleUnit)
          : true;
        const isCulinaryOrImperial = ['cup', 'tbsp', 'tsp', 'fl oz', 'oz', 'lb'].includes(singleUnit);
        if (!isCompatibleWithStock || isCulinaryOrImperial) {
          const convBack = convertQuantityDetailed(raw.quantityRequired, raw.unit, singleUnit);
          if (convBack.ok && convBack.value !== null) {
            displayUnit = singleUnit;
            totalRequired = convBack.value;
          }
        }
      }

      let inStockInRecipeUnit = 0;
      let needsReview = false;
      let conversionWarning: string | undefined;
      let pantryStockNative: { quantity: number; unit: string } | null = null;

      if (raw.ambiguousReason) {
        needsReview = true;
        conversionWarning = raw.ambiguousReason;
      } else if (matchedStock) {
        const remainingNative = remainingPantryStock.get(matchedStock.id) ?? 0;
        pantryStockNative = {
          quantity: roundForStorage(remainingNative, 3),
          unit: matchedStock.unit,
        };

        const conv = convertQuantityDetailed(remainingNative, matchedStock.unit, displayUnit);
        if (conv.ok && conv.value !== null) {
          inStockInRecipeUnit = conv.value;
          const allocatedInBucket = Math.min(totalRequired, inStockInRecipeUnit);
          const usedNativeConv = convertQuantityDetailed(allocatedInBucket, displayUnit, matchedStock.unit);
          const usedNative =
            usedNativeConv.ok && usedNativeConv.value !== null ? usedNativeConv.value : 0;
          remainingPantryStock.set(
            matchedStock.id,
            Math.max(0, roundForStorage(remainingNative - usedNative, 6))
          );
        } else {
          // Incompatible units: preserve original requirement and flag for review without subtracting
          needsReview = true;
          conversionWarning = `Pantry has ${formatSmartQuantity(remainingNative, matchedStock.unit)}, weekly plan requires ${formatSmartQuantity(totalRequired, displayUnit)} (${conv.reason || 'incompatible units'}).`;
          inStockInRecipeUnit = 0;
        }
      }

      const rawQtyToBuy =
        inStockInRecipeUnit + 1e-6 >= totalRequired
          ? 0
          : Math.max(0, totalRequired - inStockInRecipeUnit);
      const isSufficient = rawQtyToBuy === 0 && !needsReview;

      const isPurchased = !!storedState.purchased[raw.id];
      const isAdded = !!storedState.addedToInventory?.[raw.id];

      const displayQty = isSufficient
        ? `In Pantry (${formatSmartQuantity(inStockInRecipeUnit, displayUnit)})`
        : formatSmartQuantity(rawQtyToBuy, displayUnit);

      const resolved = resolveIngredientPrice(raw.name, inventoryList, catalogList);
      const estimatedCost = !isSufficient
        ? calculateIngredientCost(
            rawQtyToBuy,
            displayUnit,
            resolved.price,
            resolved.priceUnit,
            resolved.avgGramsPerUnit,
            resolved.avgMlPerUnit
          )
        : 0;

      items.push({
        id: raw.id,
        name: raw.name,
        quantity: isSufficient ? roundForStorage(totalRequired, 3) : roundForStorage(rawQtyToBuy, 3),
        quantityRequired: roundForStorage(totalRequired, 3),
        quantityInStock: roundForStorage(inStockInRecipeUnit, 3),
        quantityToBuy: roundForStorage(rawQtyToBuy, 3),
        isSufficientInStock: isSufficient,
        unit: displayUnit,
        category: raw.category || 'Pantry',
        purchased: isPurchased,
        addedToInventory: isAdded,
        displayQuantity: displayQty,
        sourceMeals: raw.sourceMeals,
        originalRequirements: raw.originalRequirements,
        resolvedPrice: resolved.price,
        resolvedPriceUnit: resolved.priceUnit,
        priceSource: resolved.source,
        estimatedCostZAR: Math.round(estimatedCost * 100) / 100,
        needsReview,
        conversionWarning,
        matchedInventoryId: matchedStock?.id,
        pantryStockNative,
      });
    }

    // Sort: items needing purchase first, then by category, then by name
    items.sort((a, b) => {
      if (a.isSufficientInStock !== b.isSufficientInStock) {
        return a.isSufficientInStock ? 1 : -1;
      }
      if (a.category !== b.category) {
        return (a.category || '').localeCompare(b.category || '');
      }
      return a.name.localeCompare(b.name);
    });

    return items;
  }

  async toggleItemPurchased(weekId: string, itemId: string, purchased: boolean): Promise<void> {
    const storedState = (await storageService.get<StoredShoppingState>(
      STORES.SHOPPING_LIST,
      weekId
    )) || { id: weekId, purchased: {}, addedToInventory: {} };

    storedState.purchased[itemId] = purchased;
    await storageService.set(STORES.SHOPPING_LIST, storedState);
  }

  /**
   * Adds purchased item stock into inventory and marks addedToInventory: true
   * to prevent duplicate additions. Sufficient / zero-quantity items are skipped.
   */
  async addPurchasedToInventory(weekId: string, item: ShoppingItem): Promise<boolean> {
    if (item.isSufficientInStock || item.quantityToBuy <= 0 || !Number.isFinite(item.quantityToBuy)) {
      return false;
    }

    const lockKey = `${weekId}:${item.id}`;
    if (this.inFlightRestocks.has(lockKey)) {
      return false;
    }

    this.inFlightRestocks.add(lockKey);
    try {
      const storedState = (await storageService.get<StoredShoppingState>(
        STORES.SHOPPING_LIST,
        weekId
      )) || { id: weekId, purchased: {}, addedToInventory: {} };

      if (storedState.addedToInventory?.[item.id]) {
        return false; // Already added
      }

      const addAmount = item.quantityToBuy;
      await inventoryService.addStock(
        item.name,
        addAmount,
        item.unit,
        'Pantry',
        (item.category as any) || 'Pantry'
      );

      if (!storedState.addedToInventory) storedState.addedToInventory = {};
      storedState.addedToInventory[item.id] = true;
      storedState.purchased[item.id] = true;

      await storageService.set(STORES.SHOPPING_LIST, storedState);
      return true;
    } finally {
      this.inFlightRestocks.delete(lockKey);
    }
  }

  async clearPurchased(weekId: string): Promise<void> {
    await storageService.set(STORES.SHOPPING_LIST, { id: weekId, purchased: {}, addedToInventory: {} });
  }
}

export const ingredientService = new IngredientService();
