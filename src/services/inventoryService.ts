import {
  IngredientInventory,
  StorageLocation,
  IngredientCategory,
} from '../models/IngredientInventory';
import { InventoryTransaction, TransactionType } from '../models/InventoryTransaction';
import { MealCompletion, IngredientDeduction } from '../models/MealCompletion';
import { Recipe } from '../models/Recipe';
import { WeeklyPlan } from '../models/WeeklyPlan';
import { storageService, STORES, StorageBatchOp } from './storageService';
import {
  convertQuantityDetailed,
  formatSmartQuantity,
  normalizeUnit,
  roundForStorage,
} from '../utils/unitConversion';
import { ingredientCatalogService } from './ingredientCatalogService';
import {
  canonicalizeIngredientName,
  IngredientMatchResult,
  matchIngredient,
} from '../utils/ingredientMatcher';

export type RequirementConversionStatus =
  | 'exact'
  | 'converted'
  | 'incompatible_units'
  | 'missing_inventory'
  | 'ambiguous_match';

export interface IngredientRequirementCheck {
  recipeIngredientName: string;
  requiredQuantity: number;
  requiredUnit: string;
  unit: string;
  matchedInventoryItem: IngredientInventory | null;
  availableQuantity: number | null; // In matched inventory item's native unit
  availableUnit: string | null;
  availableQuantityInMatchingUnit: number | null; // In recipe unit; null when incompatible or missing
  missingQuantity: number;
  sufficient: boolean;
  shortfall: number; // positive if short
  proposedDeduction: number; // in recipe unit
  remainingStock: number; // in recipe unit when compatible, or native stock when incompatible
  conversionStatus: RequirementConversionStatus;
  conversionMessage?: string;
  needsReview: boolean;
}

export interface MealRequirementCheck {
  recipeTitle: string;
  servings: number;
  items: IngredientRequirementCheck[];
  hasShortages: boolean;
  hasIncompatibleUnits: boolean;
  hasReviewItems: boolean;
  totalShortagesCount: number;
}

// Initial realistic pantry stock matching our 14 dishes with solid (per kg/g) and liquid (per L/ml) pricing in ZAR
export const INITIAL_INVENTORY: Omit<IngredientInventory, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Chicken pieces',
    quantity: 1200,
    unit: 'g',
    minStockLevel: 500,
    location: 'Fridge',
    category: 'Meat & Poultry',
    price: 85.0,
    priceUnit: 'kg',
    lastUsedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    notes: 'Free-range chicken portions',
  },
  {
    name: 'Rice',
    quantity: 2000,
    unit: 'g',
    minStockLevel: 500,
    location: 'Pantry',
    category: 'Pantry',
    price: 26.0,
    priceUnit: 'kg',
    lastUsedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    name: 'Carrots',
    quantity: 300,
    unit: 'g',
    minStockLevel: 400,
    location: 'Fridge',
    category: 'Produce',
    price: 18.0,
    priceUnit: 'kg',
    lastUsedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    name: 'Onion',
    quantity: 6,
    unit: 'medium',
    minStockLevel: 2,
    location: 'Pantry',
    category: 'Produce',
    price: 4.5,
    priceUnit: 'piece',
  },
  {
    name: 'Cooking oil',
    quantity: 800,
    unit: 'ml',
    minStockLevel: 250,
    location: 'Pantry',
    category: 'Pantry',
    price: 38.0,
    priceUnit: 'L',
  },
  {
    name: 'Salt',
    quantity: 600,
    unit: 'g',
    minStockLevel: 100,
    location: 'Spice Rack',
    category: 'Spices & Condiments',
    price: 16.0,
    priceUnit: 'kg',
  },
  {
    name: 'Stewing beef chunks',
    quantity: 600,
    unit: 'g',
    minStockLevel: 700,
    location: 'Fridge',
    category: 'Meat & Poultry',
    price: 135.0,
    priceUnit: 'kg',
    notes: 'Prime beef cubes',
  },
  {
    name: 'Rolled oats',
    quantity: 1200,
    unit: 'g',
    minStockLevel: 300,
    location: 'Pantry',
    category: 'Pantry',
    price: 44.0,
    priceUnit: 'kg',
  },
  {
    name: 'Free-range eggs',
    quantity: 12,
    unit: 'large',
    minStockLevel: 4,
    location: 'Fridge',
    category: 'Dairy & Eggs',
    price: 3.5,
    priceUnit: 'piece',
  },
  {
    name: 'Milk',
    quantity: 2000,
    unit: 'ml',
    minStockLevel: 500,
    location: 'Fridge',
    category: 'Dairy & Eggs',
    price: 18.5,
    priceUnit: 'L',
  },
  {
    name: 'Fresh berries',
    quantity: 250,
    unit: 'g',
    minStockLevel: 150,
    location: 'Fridge',
    category: 'Produce',
    price: 140.0,
    priceUnit: 'kg',
  },
  {
    name: 'Butter',
    quantity: 250,
    unit: 'g',
    minStockLevel: 100,
    location: 'Fridge',
    category: 'Dairy & Eggs',
    price: 130.0,
    priceUnit: 'kg',
  },
  {
    name: 'Penne pasta',
    quantity: 1000,
    unit: 'g',
    minStockLevel: 400,
    location: 'Pantry',
    category: 'Pantry',
    price: 46.0,
    priceUnit: 'kg',
  },
  {
    name: 'Fresh asparagus',
    quantity: 0,
    unit: 'g',
    minStockLevel: 150,
    location: 'Fridge',
    category: 'Produce',
    price: 195.0,
    priceUnit: 'kg',
  },
  {
    name: 'Ground beef (80/20)',
    quantity: 0,
    unit: 'g',
    minStockLevel: 500,
    location: 'Freezer',
    category: 'Meat & Poultry',
    price: 98.0,
    priceUnit: 'kg',
  },
  {
    name: 'Brioche burger buns',
    quantity: 4,
    unit: 'pieces',
    minStockLevel: 2,
    location: 'Counter',
    category: 'Bakery',
    price: 8.5,
    priceUnit: 'piece',
  },
  {
    name: 'Cheddar cheese',
    quantity: 120,
    unit: 'g',
    minStockLevel: 200,
    location: 'Fridge',
    category: 'Dairy & Eggs',
    price: 165.0,
    priceUnit: 'kg',
  },
  {
    name: 'Greek yogurt (plain)',
    quantity: 500,
    unit: 'g',
    minStockLevel: 300,
    location: 'Fridge',
    category: 'Dairy & Eggs',
    price: 68.0,
    priceUnit: 'kg',
  },
  {
    name: 'Potatoes',
    quantity: 2500,
    unit: 'g',
    minStockLevel: 1000,
    location: 'Pantry',
    category: 'Produce',
    price: 19.5,
    priceUnit: 'kg',
  },
  {
    name: 'Coarse maize meal (pap)',
    quantity: 1500,
    unit: 'g',
    minStockLevel: 500,
    location: 'Pantry',
    category: 'Pantry',
    price: 17.0,
    priceUnit: 'kg',
  },
];

class InventoryService {
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  private itemsMap: Map<string, IngredientInventory> = new Map();
  private inFlightCompletions: Map<string, Promise<MealCompletion>> = new Map();
  private inFlightUndos: Map<string, Promise<MealCompletion | null>> = new Map();
  private inFlightOperations: Map<string, Promise<MealCompletion>> = new Map();

  async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      await ingredientCatalogService.init();

      const stored = await storageService.getAll<IngredientInventory>(STORES.INVENTORY);
      if (stored && stored.length > 0) {
        const needsActivityBackfill = stored.some((i) => !i.lastActivityAt);
        const allTransactions = needsActivityBackfill
          ? await storageService.getAll<InventoryTransaction>(STORES.TRANSACTIONS)
          : [];
        const latestTxByIng = new Map<string, InventoryTransaction>();
        for (const tx of allTransactions) {
          const prev = latestTxByIng.get(tx.ingredientId);
          if (!prev || new Date(tx.timestamp).getTime() > new Date(prev.timestamp).getTime()) {
            latestTxByIng.set(tx.ingredientId, tx);
          }
        }

        const dirtyItems: StorageBatchOp[] = [];
        for (const item of stored) {
          let dirty = false;

          if (item.price === undefined || !item.priceUnit) {
            const match = INITIAL_INVENTORY.find((i) => i.name.toLowerCase() === item.name.toLowerCase());
            const catMatch = ingredientCatalogService.findCatalogItem(item.name);
            if (match && match.price) {
              item.price = match.price;
              item.priceUnit = match.priceUnit;
            } else if (catMatch) {
              item.price = catMatch.referencePriceZAR;
              item.priceUnit = catMatch.priceUnit;
            } else {
              const norm = normalizeUnit(item.unit);
              if (norm === 'g' || norm === 'kg' || norm === 'mg' || norm === 'oz' || norm === 'lb') {
                item.price = 55.0;
                item.priceUnit = 'kg';
              } else if (norm === 'ml' || norm === 'L') {
                item.price = 28.0;
                item.priceUnit = 'L';
              } else {
                item.price = 6.5;
                item.priceUnit = 'piece';
              }
            }
            dirty = true;
          }

          if (!item.lastActivityAt) {
            const latestTx = latestTxByIng.get(item.id);
            if (latestTx) {
              item.lastActivityAt = latestTx.timestamp;
              item.lastActivityType = latestTx.type;
              item.lastActivitySummary = this.formatActivitySummary(latestTx);
            } else if (item.lastUsedAt) {
              item.lastActivityAt = item.lastUsedAt;
              item.lastActivityType = 'Meal Usage';
              item.lastActivitySummary = 'Used in meal';
            } else {
              item.lastActivityAt = item.updatedAt || item.createdAt;
              item.lastActivityType = 'Purchase';
              item.lastActivitySummary = 'Initial pantry stock';
            }
            dirty = true;
          }

          if (dirty) {
            dirtyItems.push({
              type: 'set',
              storeName: STORES.INVENTORY,
              item: item as unknown as Record<string, unknown>,
            });
          }
          this.itemsMap.set(item.id, item);
        }

        if (dirtyItems.length > 0) {
          await storageService.commitBatch([STORES.INVENTORY], dirtyItems);
        }
      } else {
        const now = new Date().toISOString();
        const seedOps: StorageBatchOp[] = [];
        const seededItems: IngredientInventory[] = [];

        for (const raw of INITIAL_INVENTORY) {
          const id = `inv-${raw.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          const item: IngredientInventory = {
            ...raw,
            id,
            createdAt: now,
            updatedAt: now,
            lastActivityAt: raw.lastUsedAt || now,
            lastActivityType: raw.lastUsedAt ? 'Meal Usage' : 'Purchase',
            lastActivitySummary: raw.lastUsedAt
              ? 'Used in meal'
              : `Initial +${formatSmartQuantity(raw.quantity, raw.unit)}`,
          };
          seededItems.push(item);
          seedOps.push({
            type: 'set',
            storeName: STORES.INVENTORY,
            item: item as unknown as Record<string, unknown>,
          });

          const tx = this.buildTransactionRecord({
            ingredientId: id,
            ingredientName: item.name,
            quantityChange: item.quantity,
            unit: item.unit,
            type: 'Purchase',
            notes: 'Initial household pantry stock',
          }, now);
          seedOps.push({
            type: 'set',
            storeName: STORES.TRANSACTIONS,
            item: tx as unknown as Record<string, unknown>,
          });
        }

        await storageService.commitBatch([STORES.INVENTORY, STORES.TRANSACTIONS], seedOps);
        for (const item of seededItems) {
          this.itemsMap.set(item.id, item);
        }
      }

      this.initialized = true;
    })();

    return this.initPromise;
  }

  /**
   * Clears in-memory cache and forces a clean reload from storage on next access.
   */
  resetCache(): void {
    this.initialized = false;
    this.initPromise = null;
    this.itemsMap.clear();
    this.inFlightCompletions.clear();
    this.inFlightUndos.clear();
    this.inFlightOperations.clear();
  }

  async getAllIngredients(): Promise<IngredientInventory[]> {
    await this.init();
    return Array.from(this.itemsMap.values());
  }

  getLoadedIngredients(): IngredientInventory[] {
    return Array.from(this.itemsMap.values());
  }

  async getIngredientById(id: string): Promise<IngredientInventory | null> {
    await this.init();
    return this.itemsMap.get(id) || null;
  }

  async matchIngredientByName(name: string): Promise<IngredientMatchResult<IngredientInventory>> {
    await this.init();
    return matchIngredient(name, this.getLoadedIngredients());
  }

  async findIngredientByName(name: string): Promise<IngredientInventory | null> {
    const result = await this.matchIngredientByName(name);
    return result.match;
  }

  private findCanonicalDuplicate(name: string): IngredientInventory | null {
    const target = canonicalizeIngredientName(name);
    if (!target) return null;
    for (const item of this.itemsMap.values()) {
      if (canonicalizeIngredientName(item.name) === target) {
        return item;
      }
    }
    return null;
  }

  async addIngredient(
    data: Omit<IngredientInventory, 'id' | 'createdAt' | 'updatedAt'>,
    options?: { skipTransactionLog?: boolean; allowDuplicate?: boolean }
  ): Promise<IngredientInventory> {
    await this.init();

    const cleanName = data.name.trim();
    if (!cleanName) {
      throw new Error('Ingredient name is required.');
    }
    if (typeof data.quantity !== 'number' || !Number.isFinite(data.quantity) || data.quantity < 0) {
      throw new Error('Ingredient quantity must be a finite non-negative number.');
    }
    if (typeof data.minStockLevel !== 'number' || !Number.isFinite(data.minStockLevel) || data.minStockLevel < 0) {
      throw new Error('Minimum stock level must be a finite non-negative number.');
    }
    const cleanUnit = (data.unit || '').trim();
    if (!cleanUnit) {
      throw new Error('Ingredient unit is required.');
    }

    // Reuse existing canonical inventory record to avoid duplicates
    if (!options?.allowDuplicate) {
      const existing = this.findCanonicalDuplicate(cleanName);
      if (existing) {
        const conv = convertQuantityDetailed(data.quantity, cleanUnit, existing.unit);
        if (!conv.ok || conv.value === null) {
          throw new Error(
            `"${existing.name}" already exists in pantry with unit "${existing.unit}" (${conv.reason || 'incompatible unit'}).`
          );
        }

        const now = new Date().toISOString();
        const delta = roundForStorage(conv.value);
        const nextQty = roundForStorage(existing.quantity + delta);
        const updated: IngredientInventory = {
          ...existing,
          quantity: nextQty,
          minStockLevel: data.minStockLevel ?? existing.minStockLevel,
          location: data.location || existing.location,
          category: data.category || existing.category,
          price: data.price !== undefined ? data.price : existing.price,
          priceUnit: data.priceUnit || existing.priceUnit,
          notes: data.notes || existing.notes,
          updatedAt: now,
        };

        const ops: StorageBatchOp[] = [];
        if (delta > 0 && !options?.skipTransactionLog) {
          const tx = this.buildTransactionRecord(
            {
              ingredientId: existing.id,
              ingredientName: updated.name,
              quantityChange: delta,
              unit: updated.unit,
              type: 'Purchase',
              notes: `Added stock (+${formatSmartQuantity(data.quantity, cleanUnit)})`,
            },
            now
          );
          updated.lastActivityAt = now;
          updated.lastActivityType = tx.type;
          updated.lastActivitySummary = this.formatActivitySummary(tx);
          ops.push({
            type: 'set',
            storeName: STORES.TRANSACTIONS,
            item: tx as unknown as Record<string, unknown>,
          });
        }

        ops.unshift({
          type: 'set',
          storeName: STORES.INVENTORY,
          item: updated as unknown as Record<string, unknown>,
        });

        const stores = ops.map((o) => o.storeName);
        await storageService.commitBatch(stores, ops);
        this.itemsMap.set(existing.id, updated);
        return updated;
      }
    }

    const id = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const cleanQty = roundForStorage(data.quantity);
    const item: IngredientInventory = {
      ...data,
      name: cleanName,
      quantity: cleanQty,
      unit: cleanUnit,
      id,
      createdAt: now,
      updatedAt: now,
      lastActivityAt: data.lastActivityAt || now,
      lastActivityType: data.lastActivityType || 'Purchase',
      lastActivitySummary:
        data.lastActivitySummary ||
        (cleanQty > 0 ? `Added +${formatSmartQuantity(cleanQty, cleanUnit)}` : 'Added to pantry'),
    };

    const ops: StorageBatchOp[] = [
      {
        type: 'set',
        storeName: STORES.INVENTORY,
        item: item as unknown as Record<string, unknown>,
      },
    ];

    if (cleanQty > 0 && !options?.skipTransactionLog) {
      const tx = this.buildTransactionRecord(
        {
          ingredientId: id,
          ingredientName: item.name,
          quantityChange: cleanQty,
          unit: item.unit,
          type: 'Purchase',
          notes: 'Added new ingredient to pantry inventory',
        },
        now
      );
      ops.push({
        type: 'set',
        storeName: STORES.TRANSACTIONS,
        item: tx as unknown as Record<string, unknown>,
      });
    }

    await storageService.commitBatch(
      ops.map((o) => o.storeName),
      ops
    );
    this.itemsMap.set(id, item);

    return item;
  }

  async updateIngredient(
    id: string,
    updates: Partial<IngredientInventory>,
    options?: { skipTransactionLog?: boolean }
  ): Promise<IngredientInventory> {
    await this.init();
    const existing = this.itemsMap.get(id);
    if (!existing) {
      throw new Error(`Ingredient with id ${id} not found.`);
    }

    if (updates.quantity !== undefined) {
      if (typeof updates.quantity !== 'number' || !Number.isFinite(updates.quantity) || updates.quantity < 0) {
        throw new Error('Quantity must be a finite non-negative number.');
      }
    }
    if (updates.minStockLevel !== undefined) {
      if (
        typeof updates.minStockLevel !== 'number' ||
        !Number.isFinite(updates.minStockLevel) ||
        updates.minStockLevel < 0
      ) {
        throw new Error('Minimum stock level must be a finite non-negative number.');
      }
    }

    const now = new Date().toISOString();
    const previousQty = existing.quantity;
    const nextQty = updates.quantity !== undefined ? roundForStorage(updates.quantity) : previousQty;
    const quantityChanged = updates.quantity !== undefined && Math.abs(nextQty - previousQty) > 1e-9;

    const updated: IngredientInventory = {
      ...existing,
      ...updates,
      quantity: nextQty,
      updatedAt: now,
    };

    const ops: StorageBatchOp[] = [];

    if (quantityChanged && !options?.skipTransactionLog) {
      const delta = roundForStorage(nextQty - previousQty);
      const tx = this.buildTransactionRecord(
        {
          ingredientId: id,
          ingredientName: updated.name,
          quantityChange: delta,
          unit: updated.unit,
          type: 'Manual Adjustment',
          notes: `Manual count update (${previousQty} → ${nextQty} ${updated.unit})`,
        },
        now
      );
      updated.lastActivityAt = now;
      updated.lastActivityType = tx.type;
      updated.lastActivitySummary = this.formatActivitySummary(tx);
      ops.push({
        type: 'set',
        storeName: STORES.TRANSACTIONS,
        item: tx as unknown as Record<string, unknown>,
      });
    } else if (!quantityChanged && !options?.skipTransactionLog) {
      updated.lastActivityAt = now;
      updated.lastActivityType = 'Details Updated';
      updated.lastActivitySummary = 'Updated details';
    }

    ops.unshift({
      type: 'set',
      storeName: STORES.INVENTORY,
      item: updated as unknown as Record<string, unknown>,
    });

    await storageService.commitBatch(
      ops.map((o) => o.storeName),
      ops
    );
    this.itemsMap.set(id, updated);

    return updated;
  }

  async deleteIngredient(id: string): Promise<void> {
    await this.init();
    const item = this.itemsMap.get(id);
    if (item) {
      await storageService.remove(STORES.INVENTORY, id);
      this.itemsMap.delete(id);
    }
  }

  // --- Meal Requirements Check & Deduction ---

  async checkMealRequirements(recipe: Recipe, targetServings: number): Promise<MealRequirementCheck> {
    await this.init();
    const safeServings = Number.isFinite(targetServings) && targetServings > 0 ? targetServings : recipe.servings || 4;
    const baseServings = recipe.servings && recipe.servings > 0 ? recipe.servings : 4;
    const ratio = safeServings / baseServings;
    const checks: IngredientRequirementCheck[] = [];
    let hasShortages = false;
    let hasIncompatibleUnits = false;
    let hasReviewItems = false;
    let totalShortagesCount = 0;

    for (const ing of recipe.ingredients) {
      const requiredQty = ing.quantity * ratio;
      const matchResult = await this.matchIngredientByName(ing.name);
      const matched = matchResult.match;

      let availableInUnit: number | null = null;
      let shortfall = requiredQty;
      let proposedDeduction = 0;
      let remainingStock = 0;
      let sufficient = false;
      let conversionStatus: RequirementConversionStatus = 'missing_inventory';
      let conversionMessage: string | undefined;
      let needsReview = false;

      if (matchResult.confidence === 'ambiguous') {
        hasShortages = true;
        hasReviewItems = true;
        totalShortagesCount++;
        conversionStatus = 'ambiguous_match';
        conversionMessage = matchResult.reason;
        needsReview = true;
      } else if (matched) {
        const conv = convertQuantityDetailed(matched.quantity, matched.unit, ing.unit);

        if (conv.ok && conv.value !== null) {
          availableInUnit = conv.value;
          conversionStatus =
            normalizeUnit(matched.unit) === normalizeUnit(ing.unit) ? 'exact' : 'converted';

          if (availableInUnit + 1e-9 >= requiredQty) {
            sufficient = true;
            shortfall = 0;
            proposedDeduction = requiredQty;
            remainingStock = Math.max(0, availableInUnit - requiredQty);
          } else {
            hasShortages = true;
            totalShortagesCount++;
            shortfall = Math.max(0, requiredQty - availableInUnit);
            proposedDeduction = availableInUnit;
            remainingStock = 0;
          }
        } else {
          // NEVER substitute raw quantities across incompatible units
          hasShortages = true;
          hasIncompatibleUnits = true;
          hasReviewItems = true;
          totalShortagesCount++;
          conversionStatus = 'incompatible_units';
          conversionMessage = conv.reason;
          needsReview = true;
          availableInUnit = null;
          shortfall = requiredQty;
          proposedDeduction = 0;
          remainingStock = matched.quantity;
        }
      } else {
        hasShortages = true;
        totalShortagesCount++;
        conversionStatus = 'missing_inventory';
        conversionMessage = `"${ing.name}" is not in pantry inventory.`;
      }

      checks.push({
        recipeIngredientName: ing.name,
        requiredQuantity: requiredQty,
        requiredUnit: ing.unit,
        unit: ing.unit,
        matchedInventoryItem: matched,
        availableQuantity: matched ? matched.quantity : null,
        availableUnit: matched ? matched.unit : null,
        availableQuantityInMatchingUnit: availableInUnit,
        missingQuantity: shortfall,
        sufficient,
        shortfall,
        proposedDeduction,
        remainingStock,
        conversionStatus,
        conversionMessage,
        needsReview,
      });
    }

    return {
      recipeTitle: recipe.title,
      servings: safeServings,
      items: checks,
      hasShortages,
      hasIncompatibleUnits,
      hasReviewItems,
      totalShortagesCount,
    };
  }

  /**
   * Executes atomic meal completion across inventory, transactions, completions, and weekly plan:
   * 1. Prevents concurrent double-submission and duplicate active completion of the same meal slot.
   * 2. Validates every deduction (finite, >= 0, compatible units, <= available stock).
   * 3. Commits inventory deductions, transactions, completion record, and plan status in one batch.
   */
  async completeMeal(params: {
    mealId: string;
    weekId: string;
    dayIndex: number;
    mealType: 'breakfast' | 'dinner';
    recipe: Recipe;
    targetServings: number;
    operationId?: string;
    customDeductions?: Array<{ recipeIngredientName: string; deductionQuantity: number; unit: string }>;
  }): Promise<MealCompletion> {
    if (params.operationId && this.inFlightOperations.has(params.operationId)) {
      return this.inFlightOperations.get(params.operationId)!;
    }

    const slotLockKey = `${params.weekId}:${params.dayIndex}:${params.mealType}:${params.mealId}`;
    if (this.inFlightCompletions.has(slotLockKey)) {
      return this.inFlightCompletions.get(slotLockKey)!;
    }

    const work = this.executeCompleteMeal(params);
    this.inFlightCompletions.set(slotLockKey, work);
    if (params.operationId) {
      this.inFlightOperations.set(params.operationId, work);
    }

    try {
      return await work;
    } finally {
      this.inFlightCompletions.delete(slotLockKey);
      if (params.operationId) {
        this.inFlightOperations.delete(params.operationId);
      }
    }
  }

  private async executeCompleteMeal(params: {
    mealId: string;
    weekId: string;
    dayIndex: number;
    mealType: 'breakfast' | 'dinner';
    recipe: Recipe;
    targetServings: number;
    operationId?: string;
    customDeductions?: Array<{ recipeIngredientName: string; deductionQuantity: number; unit: string }>;
  }): Promise<MealCompletion> {
    await this.init();

    if (!params.recipe || !params.recipe.id) {
      throw new Error('Cannot complete meal: recipe could not be found.');
    }
    if (typeof params.targetServings !== 'number' || !Number.isFinite(params.targetServings) || params.targetServings <= 0) {
      throw new Error('Target servings must be a positive number.');
    }

    // Idempotency & duplicate-completion checks
    const allCompletions = await storageService.getAll<MealCompletion>(STORES.COMPLETIONS);
    if (params.operationId) {
      const existingByOp = allCompletions.find((c) => c.operationId === params.operationId);
      if (existingByOp) {
        return existingByOp;
      }
    }

    const existingActive = allCompletions.find(
      (c) =>
        c.status === 'active' &&
        (c.mealId === params.mealId ||
          (c.weekId === params.weekId && c.dayIndex === params.dayIndex && c.mealType === params.mealType))
    );
    if (existingActive) {
      throw new Error('This meal has already been marked as cooked. Undo the prior completion first.');
    }

    const storedPlan = await storageService.get<WeeklyPlan>(STORES.WEEKLY_PLANS, params.weekId);
    if (storedPlan) {
      const slotMeal = storedPlan.days?.[params.dayIndex]?.[params.mealType];
      if (!slotMeal) {
        throw new Error('Cannot complete meal: planned meal slot no longer exists.');
      }
      if (slotMeal.status === 'cooked' && slotMeal.completionId) {
        throw new Error('This planned meal is already marked as cooked.');
      }
    }

    const completionId = `comp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const deductions: IngredientDeduction[] = [];

    const reqCheck = await this.checkMealRequirements(params.recipe, params.targetServings);

    // Stage inventory mutations on copies so any validation failure aborts cleanly before persisting
    const stagedItems = new Map<string, IngredientInventory>();
    for (const [k, v] of this.itemsMap.entries()) {
      stagedItems.set(k, { ...v });
    }

    const batchOps: StorageBatchOp[] = [];
    const touchedItemIds = new Set<string>();

    for (const reqItem of reqCheck.items) {
      let deductAmount = reqItem.proposedDeduction;
      let deductUnit = reqItem.unit;

      if (params.customDeductions) {
        const custom = params.customDeductions.find(
          (c) => c.recipeIngredientName === reqItem.recipeIngredientName
        );
        if (custom) {
          deductAmount = custom.deductionQuantity;
          deductUnit = custom.unit || reqItem.unit;
        }
      }

      if (typeof deductAmount !== 'number' || !Number.isFinite(deductAmount) || deductAmount < 0) {
        throw new Error(
          `Invalid deduction quantity for "${reqItem.recipeIngredientName}": must be a finite non-negative number.`
        );
      }

      if (deductAmount === 0) {
        continue;
      }

      if (!reqItem.matchedInventoryItem) {
        if (reqItem.conversionStatus === 'ambiguous_match') {
          throw new Error(
            reqItem.conversionMessage ||
              `Cannot deduct "${reqItem.recipeIngredientName}" automatically due to ambiguous pantry match.`
          );
        }
        throw new Error(
          `Cannot deduct ${formatSmartQuantity(deductAmount, deductUnit)} of "${reqItem.recipeIngredientName}": item is not in pantry inventory.`
        );
      }

      const invItem = stagedItems.get(reqItem.matchedInventoryItem.id)!;
      const conv = convertQuantityDetailed(deductAmount, deductUnit, invItem.unit);
      if (!conv.ok || conv.value === null) {
        throw new Error(
          `Cannot deduct "${reqItem.recipeIngredientName}": ${conv.reason || 'incompatible units.'}`
        );
      }

      const actualDeduct = roundForStorage(conv.value);
      const prevStock = invItem.quantity;

      if (actualDeduct > prevStock + 1e-6) {
        throw new Error(
          `Insufficient stock for "${invItem.name}": cannot deduct ${formatSmartQuantity(actualDeduct, invItem.unit)} when only ${formatSmartQuantity(prevStock, invItem.unit)} is available.`
        );
      }

      const clampedDeduct = Math.min(prevStock, actualDeduct);
      const newStock = roundForStorage(Math.max(0, prevStock - clampedDeduct));

      const tx = this.buildTransactionRecord(
        {
          ingredientId: invItem.id,
          ingredientName: invItem.name,
          quantityChange: -clampedDeduct,
          unit: invItem.unit,
          type: 'Meal Usage',
          mealCompletionId: completionId,
          mealTitle: params.recipe.title,
          notes: `Cooked for ${params.recipe.title} (${params.targetServings} servings)`,
        },
        now
      );

      invItem.quantity = newStock;
      invItem.lastUsedAt = now;
      invItem.lastActivityAt = now;
      invItem.lastActivityType = tx.type;
      invItem.lastActivitySummary = this.formatActivitySummary(tx);
      invItem.updatedAt = now;
      touchedItemIds.add(invItem.id);

      deductions.push({
        ingredientId: invItem.id,
        ingredientName: invItem.name,
        deductedQuantity: clampedDeduct,
        unit: invItem.unit,
        previousStock: prevStock,
        remainingStock: newStock,
      });

      batchOps.push({
        type: 'set',
        storeName: STORES.TRANSACTIONS,
        item: tx as unknown as Record<string, unknown>,
      });
    }

    for (const id of touchedItemIds) {
      batchOps.push({
        type: 'set',
        storeName: STORES.INVENTORY,
        item: stagedItems.get(id)! as unknown as Record<string, unknown>,
      });
    }

    const completion: MealCompletion = {
      id: completionId,
      operationId: params.operationId,
      mealId: params.mealId,
      weekId: params.weekId,
      dayIndex: params.dayIndex,
      mealType: params.mealType,
      recipeId: params.recipe.id,
      recipeTitle: params.recipe.title,
      servings: params.targetServings,
      completedAt: now,
      deductions,
      status: 'active',
    };

    batchOps.push({
      type: 'set',
      storeName: STORES.COMPLETIONS,
      item: completion as unknown as Record<string, unknown>,
    });

    const storesToLock: string[] = [STORES.INVENTORY, STORES.TRANSACTIONS, STORES.COMPLETIONS];

    if (storedPlan && storedPlan.days?.[params.dayIndex]?.[params.mealType]) {
      const updatedPlan: WeeklyPlan = {
        ...storedPlan,
        days: storedPlan.days.map((d, idx) =>
          idx === params.dayIndex
            ? {
                ...d,
                [params.mealType]: {
                  ...d[params.mealType]!,
                  status: 'cooked',
                  completionId,
                },
              }
            : d
        ),
      };
      batchOps.push({
        type: 'set',
        storeName: STORES.WEEKLY_PLANS,
        item: updatedPlan as unknown as Record<string, unknown>,
      });
      storesToLock.push(STORES.WEEKLY_PLANS);
    }

    await storageService.commitBatch(storesToLock, batchOps);

    // Commit staged items to in-memory cache only after storage succeeds
    for (const id of touchedItemIds) {
      this.itemsMap.set(id, stagedItems.get(id)!);
    }

    return completion;
  }

  /**
   * Atomically reverses a meal completion using the exact historical deduction records:
   * 1. Prevents concurrent or repeated reversals of the same completion.
   * 2. Restores exact deducted quantities (converting only if unit changed compatibly).
   * 3. Records 'Reversal' transactions, marks completion 'reversed', and resets plan slot.
   */
  async undoMealCompletion(completionId: string): Promise<MealCompletion | null> {
    if (!completionId) return null;
    if (this.inFlightUndos.has(completionId)) {
      return this.inFlightUndos.get(completionId)!;
    }

    const work = this.executeUndoMealCompletion(completionId);
    this.inFlightUndos.set(completionId, work);
    try {
      return await work;
    } finally {
      this.inFlightUndos.delete(completionId);
    }
  }

  private async executeUndoMealCompletion(completionId: string): Promise<MealCompletion | null> {
    await this.init();
    const completion = await storageService.get<MealCompletion>(STORES.COMPLETIONS, completionId);
    if (!completion || completion.status === 'reversed') return null;

    const now = new Date().toISOString();
    const stagedItems = new Map<string, IngredientInventory>();
    for (const [k, v] of this.itemsMap.entries()) {
      stagedItems.set(k, { ...v });
    }

    const batchOps: StorageBatchOp[] = [];
    const touchedItemIds = new Set<string>();

    for (const d of completion.deductions) {
      const invItem = stagedItems.get(d.ingredientId);
      if (!invItem) continue;

      const conv = convertQuantityDetailed(d.deductedQuantity, d.unit, invItem.unit);
      if (!conv.ok || conv.value === null) {
        throw new Error(
          `Cannot reverse "${d.ingredientName}": ${conv.reason || 'unit mismatch after completion.'}`
        );
      }

      const restoreAmount = roundForStorage(conv.value);
      const tx = this.buildTransactionRecord(
        {
          ingredientId: invItem.id,
          ingredientName: invItem.name,
          quantityChange: restoreAmount,
          unit: invItem.unit,
          type: 'Reversal',
          mealCompletionId: completionId,
          mealTitle: completion.recipeTitle,
          notes: `Reversed cooking completion of ${completion.recipeTitle}`,
        },
        now
      );

      invItem.quantity = roundForStorage(invItem.quantity + restoreAmount);
      invItem.lastActivityAt = now;
      invItem.lastActivityType = tx.type;
      invItem.lastActivitySummary = this.formatActivitySummary(tx);
      invItem.updatedAt = now;
      touchedItemIds.add(invItem.id);

      batchOps.push({
        type: 'set',
        storeName: STORES.TRANSACTIONS,
        item: tx as unknown as Record<string, unknown>,
      });
    }

    for (const id of touchedItemIds) {
      batchOps.push({
        type: 'set',
        storeName: STORES.INVENTORY,
        item: stagedItems.get(id)! as unknown as Record<string, unknown>,
      });
    }

    const reversedCompletion: MealCompletion = {
      ...completion,
      status: 'reversed',
      reversedAt: now,
    };

    batchOps.push({
      type: 'set',
      storeName: STORES.COMPLETIONS,
      item: reversedCompletion as unknown as Record<string, unknown>,
    });

    const storesToLock: string[] = [STORES.INVENTORY, STORES.TRANSACTIONS, STORES.COMPLETIONS];
    const storedPlan = await storageService.get<WeeklyPlan>(STORES.WEEKLY_PLANS, completion.weekId);
    const slotMeal = storedPlan?.days?.[completion.dayIndex]?.[completion.mealType];
    if (storedPlan && slotMeal && slotMeal.completionId === completionId) {
      const updatedMeal = { ...slotMeal, status: 'planned' as const };
      delete updatedMeal.completionId;
      const updatedPlan: WeeklyPlan = {
        ...storedPlan,
        days: storedPlan.days.map((d, idx) =>
          idx === completion.dayIndex ? { ...d, [completion.mealType]: updatedMeal } : d
        ),
      };
      batchOps.push({
        type: 'set',
        storeName: STORES.WEEKLY_PLANS,
        item: updatedPlan as unknown as Record<string, unknown>,
      });
      storesToLock.push(STORES.WEEKLY_PLANS);
    }

    await storageService.commitBatch(storesToLock, batchOps);

    for (const id of touchedItemIds) {
      this.itemsMap.set(id, stagedItems.get(id)!);
    }

    return reversedCompletion;
  }

  async getCompletionById(completionId: string): Promise<MealCompletion | null> {
    return storageService.get<MealCompletion>(STORES.COMPLETIONS, completionId);
  }

  // --- Transactions Logging ---

  private formatActivitySummary(
    tx: Pick<InventoryTransaction, 'type' | 'quantityChange' | 'unit' | 'mealTitle'>
  ): string {
    const absQty = formatSmartQuantity(Math.abs(tx.quantityChange), tx.unit);
    const sign = tx.quantityChange >= 0 ? '+' : '-';

    switch (tx.type) {
      case 'Meal Usage':
        return tx.mealTitle ? `Used -${absQty} · ${tx.mealTitle}` : `Used -${absQty}`;
      case 'Purchase':
        return `Restocked +${absQty}`;
      case 'Reversal':
        return tx.mealTitle ? `Reversed +${absQty} · ${tx.mealTitle}` : `Reversed +${absQty}`;
      case 'Waste':
        return `Waste -${absQty}`;
      case 'Manual Adjustment':
      default:
        return `Adjusted ${sign}${absQty}`;
    }
  }

  private buildTransactionRecord(
    tx: Omit<InventoryTransaction, 'id' | 'timestamp'>,
    timestamp: string = new Date().toISOString()
  ): InventoryTransaction {
    const id = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    return {
      ...tx,
      id,
      timestamp,
    };
  }

  async recordTransaction(
    tx: Omit<InventoryTransaction, 'id' | 'timestamp'>,
    options?: { skipLastActivityUpdate?: boolean }
  ): Promise<InventoryTransaction> {
    const now = new Date().toISOString();
    const fullTx = this.buildTransactionRecord(tx, now);
    const ops: StorageBatchOp[] = [
      {
        type: 'set',
        storeName: STORES.TRANSACTIONS,
        item: fullTx as unknown as Record<string, unknown>,
      },
    ];

    let updatedItem: IngredientInventory | null = null;
    if (!options?.skipLastActivityUpdate) {
      const invItem = this.itemsMap.get(fullTx.ingredientId);
      if (invItem) {
        updatedItem = {
          ...invItem,
          lastActivityAt: now,
          lastActivityType: fullTx.type,
          lastActivitySummary: this.formatActivitySummary(fullTx),
          lastUsedAt: fullTx.type === 'Meal Usage' ? now : invItem.lastUsedAt,
          updatedAt: now,
        };
        ops.push({
          type: 'set',
          storeName: STORES.INVENTORY,
          item: updatedItem as unknown as Record<string, unknown>,
        });
      }
    }

    await storageService.commitBatch(
      ops.map((o) => o.storeName),
      ops
    );
    if (updatedItem) {
      this.itemsMap.set(updatedItem.id, updatedItem);
    }

    return fullTx;
  }

  async getAllTransactions(ingredientId?: string): Promise<InventoryTransaction[]> {
    const all = await storageService.getAll<InventoryTransaction>(STORES.TRANSACTIONS);
    const filtered = ingredientId ? all.filter((t) => t.ingredientId === ingredientId) : all;
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Adds stock from purchases (e.g. shopping list checkout or quick restock) atomically,
   * creating exactly one 'Purchase' transaction record and enforcing unit compatibility.
   */
  async addStock(
    ingredientName: string,
    quantity: number,
    unit: string,
    location: StorageLocation = 'Pantry',
    category: IngredientCategory = 'Pantry'
  ): Promise<{ ingredient: IngredientInventory; transaction: InventoryTransaction }> {
    await this.init();

    const cleanName = ingredientName.trim();
    if (!cleanName) {
      throw new Error('Ingredient name is required to restock.');
    }
    if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0) {
      throw new Error('Restock quantity must be a finite positive number.');
    }
    const cleanUnit = (unit || '').trim();
    if (!cleanUnit) {
      throw new Error('Restock unit is required.');
    }

    const matchResult = await this.matchIngredientByName(cleanName);
    if (matchResult.confidence === 'ambiguous') {
      throw new Error(
        matchResult.reason ||
          `Cannot restock "${cleanName}" automatically because multiple pantry items matched.`
      );
    }

    const existing = matchResult.match;
    const now = new Date().toISOString();

    if (existing) {
      const conv = convertQuantityDetailed(quantity, cleanUnit, existing.unit);
      if (!conv.ok || conv.value === null) {
        throw new Error(
          `Cannot restock "${existing.name}": ${conv.reason || `incompatible unit "${cleanUnit}" vs pantry unit "${existing.unit}".`}`
        );
      }

      const addedInPantryUnit = roundForStorage(conv.value);
      const tx = this.buildTransactionRecord(
        {
          ingredientId: existing.id,
          ingredientName: existing.name,
          quantityChange: addedInPantryUnit,
          unit: existing.unit,
          type: 'Purchase',
          notes: `Restocked (${formatSmartQuantity(quantity, cleanUnit)})`,
        },
        now
      );

      const updated: IngredientInventory = {
        ...existing,
        quantity: roundForStorage(existing.quantity + addedInPantryUnit),
        lastActivityAt: now,
        lastActivityType: tx.type,
        lastActivitySummary: this.formatActivitySummary(tx),
        updatedAt: now,
      };

      await storageService.commitBatch([STORES.INVENTORY, STORES.TRANSACTIONS], [
        {
          type: 'set',
          storeName: STORES.INVENTORY,
          item: updated as unknown as Record<string, unknown>,
        },
        {
          type: 'set',
          storeName: STORES.TRANSACTIONS,
          item: tx as unknown as Record<string, unknown>,
        },
      ]);
      this.itemsMap.set(existing.id, updated);
      return { ingredient: updated, transaction: tx };
    }

    const catMatch = ingredientCatalogService.findCatalogItem(cleanName);
    const id = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const cleanQty = roundForStorage(quantity);

    const tx = this.buildTransactionRecord(
      {
        ingredientId: id,
        ingredientName: cleanName,
        quantityChange: cleanQty,
        unit: cleanUnit,
        type: 'Purchase',
        notes: 'Added new item from shopping list',
      },
      now
    );

    const newIng: IngredientInventory = {
      id,
      name: cleanName,
      quantity: cleanQty,
      unit: cleanUnit,
      minStockLevel: roundForStorage(cleanQty * 0.3),
      location: catMatch?.defaultLocation || location,
      category: catMatch?.category || category,
      price: catMatch?.referencePriceZAR,
      priceUnit: catMatch?.priceUnit,
      notes: 'Added from shopping list',
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
      lastActivityType: tx.type,
      lastActivitySummary: this.formatActivitySummary(tx),
    };

    await storageService.commitBatch([STORES.INVENTORY, STORES.TRANSACTIONS], [
      {
        type: 'set',
        storeName: STORES.INVENTORY,
        item: newIng as unknown as Record<string, unknown>,
      },
      {
        type: 'set',
        storeName: STORES.TRANSACTIONS,
        item: tx as unknown as Record<string, unknown>,
      },
    ]);
    this.itemsMap.set(id, newIng);
    return { ingredient: newIng, transaction: tx };
  }
}

export const inventoryService = new InventoryService();
