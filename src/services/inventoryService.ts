import {
  IngredientInventory,
  StorageLocation,
  IngredientCategory,
  StockStatus,
  calculateStockStatus,
} from '../models/IngredientInventory';
import { InventoryTransaction, TransactionType } from '../models/InventoryTransaction';
import { MealCompletion, IngredientDeduction } from '../models/MealCompletion';
import { Recipe } from '../models/Recipe';
import { storageService, STORES } from './storageService';
import { convertQuantity, areUnitsCompatible, formatSmartQuantity } from '../utils/unitConversion';
import { ingredientCatalogService } from './ingredientCatalogService';
import { findBestIngredientMatch } from '../utils/ingredientMatcher';

export interface IngredientRequirementCheck {
  recipeIngredientName: string;
  requiredQuantity: number;
  unit: string;
  matchedInventoryItem: IngredientInventory | null;
  availableQuantityInMatchingUnit: number;
  sufficient: boolean;
  shortfall: number; // positive if short
  proposedDeduction: number;
  remainingStock: number;
}

export interface MealRequirementCheck {
  recipeTitle: string;
  servings: number;
  items: IngredientRequirementCheck[];
  hasShortages: boolean;
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

        for (const item of stored) {
          let dirty = false;

          // Backfill pricing if missing from previously stored records
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
              // Sensible defaults based on unit type
              if (item.unit === 'g' || item.unit === 'kg') {
                item.price = 55.0;
                item.priceUnit = 'kg';
              } else if (item.unit === 'ml' || item.unit === 'L' || item.unit === 'l') {
                item.price = 28.0;
                item.priceUnit = 'L';
              } else {
                item.price = 6.5;
                item.priceUnit = 'piece';
              }
            }
            dirty = true;
          }

          // Backfill lastActivity* if missing from previously stored records
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
            await storageService.set(STORES.INVENTORY, item);
          }
          this.itemsMap.set(item.id, item);
        }
      } else {
        // Seed default inventory
        const now = new Date().toISOString();
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
          this.itemsMap.set(id, item);
          await storageService.set(STORES.INVENTORY, item);

          // Record initial stock transaction
          await this.recordTransaction({
            ingredientId: id,
            ingredientName: item.name,
            quantityChange: item.quantity,
            unit: item.unit,
            type: 'Purchase',
            notes: 'Initial household pantry stock',
          }, { skipLastActivityUpdate: !!raw.lastUsedAt });
        }
      }

      this.initialized = true;
    })();

    return this.initPromise;
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

  async findIngredientByName(name: string): Promise<IngredientInventory | null> {
    await this.init();
    return findBestIngredientMatch(name, this.getLoadedIngredients());
  }

  async addIngredient(
    data: Omit<IngredientInventory, 'id' | 'createdAt' | 'updatedAt'>,
    options?: { skipTransactionLog?: boolean }
  ): Promise<IngredientInventory> {
    await this.init();
    const id = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const item: IngredientInventory = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      lastActivityAt: data.lastActivityAt || now,
      lastActivityType: data.lastActivityType || 'Purchase',
      lastActivitySummary:
        data.lastActivitySummary ||
        (data.quantity > 0 ? `Added +${formatSmartQuantity(data.quantity, data.unit)}` : 'Added to pantry'),
    };

    this.itemsMap.set(id, item);
    await storageService.set(STORES.INVENTORY, item);

    if (item.quantity > 0 && !options?.skipTransactionLog) {
      await this.recordTransaction({
        ingredientId: id,
        ingredientName: item.name,
        quantityChange: item.quantity,
        unit: item.unit,
        type: 'Purchase',
        notes: 'Added new ingredient to pantry inventory',
      });
    }

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

    const now = new Date().toISOString();
    const previousQty = existing.quantity;
    const quantityChanged = updates.quantity !== undefined && updates.quantity !== previousQty;

    const updated: IngredientInventory = {
      ...existing,
      ...updates,
      updatedAt: now,
    };

    if (!quantityChanged && !options?.skipTransactionLog) {
      updated.lastActivityAt = now;
      updated.lastActivityType = 'Details Updated';
      updated.lastActivitySummary = 'Updated details';
    }

    this.itemsMap.set(id, updated);
    await storageService.set(STORES.INVENTORY, updated);

    // If quantity changed directly, log a manual adjustment (which also sets lastActivity*)
    if (quantityChanged && updates.quantity !== undefined && !options?.skipTransactionLog) {
      const delta = Math.round((updates.quantity - previousQty) * 100) / 100;
      await this.recordTransaction({
        ingredientId: id,
        ingredientName: updated.name,
        quantityChange: delta,
        unit: updated.unit,
        type: 'Manual Adjustment',
        notes: `Manual count update (${previousQty} → ${updates.quantity} ${updated.unit})`,
      });
    }

    return this.itemsMap.get(id) || updated;
  }

  async deleteIngredient(id: string): Promise<void> {
    await this.init();
    const item = this.itemsMap.get(id);
    if (item) {
      this.itemsMap.delete(id);
      await storageService.remove(STORES.INVENTORY, id);
    }
  }

  // --- Meal Requirements Check & Deduction ---

  async checkMealRequirements(recipe: Recipe, targetServings: number): Promise<MealRequirementCheck> {
    await this.init();
    const ratio = targetServings / (recipe.servings || 4);
    const checks: IngredientRequirementCheck[] = [];
    let hasShortages = false;
    let totalShortagesCount = 0;

    for (const ing of recipe.ingredients) {
      const requiredQty = ing.quantity * ratio;
      const matched = await this.findIngredientByName(ing.name);

      let availableInUnit = 0;
      let shortfall = 0;
      let proposedDeduction = 0;
      let remainingStock = 0;

      if (matched) {
        // Convert matched inventory quantity into recipe's unit
        const convertedStock = convertQuantity(matched.quantity, matched.unit, ing.unit);
        if (convertedStock !== null) {
          availableInUnit = convertedStock;
        } else {
          // If units are incompatible, fallback to raw quantity
          availableInUnit = matched.quantity;
        }

        if (availableInUnit >= requiredQty) {
          proposedDeduction = requiredQty;
          remainingStock = availableInUnit - requiredQty;
        } else {
          hasShortages = true;
          totalShortagesCount++;
          shortfall = requiredQty - availableInUnit;
          proposedDeduction = availableInUnit; // deduct all available
          remainingStock = 0;
        }
      } else {
        // Not in inventory at all
        hasShortages = true;
        totalShortagesCount++;
        shortfall = requiredQty;
        proposedDeduction = 0;
        remainingStock = 0;
      }

      checks.push({
        recipeIngredientName: ing.name,
        requiredQuantity: requiredQty,
        unit: ing.unit,
        matchedInventoryItem: matched,
        availableQuantityInMatchingUnit: availableInUnit,
        sufficient: shortfall <= 0,
        shortfall,
        proposedDeduction,
        remainingStock,
      });
    }

    return {
      recipeTitle: recipe.title,
      servings: targetServings,
      items: checks,
      hasShortages,
      totalShortagesCount,
    };
  }

  /**
   * Executes atomic meal completion:
   * 1. Deducts confirmed quantities from inventory.
   * 2. Records 'Meal Usage' transactions.
   * 3. Creates MealCompletion record.
   * 4. Updates inventory item timestamps.
   */
  async completeMeal(params: {
    mealId: string;
    weekId: string;
    dayIndex: number;
    mealType: 'breakfast' | 'dinner';
    recipe: Recipe;
    targetServings: number;
    customDeductions?: Array<{ recipeIngredientName: string; deductionQuantity: number; unit: string }>;
  }): Promise<MealCompletion> {
    await this.init();

    const completionId = `comp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const deductions: IngredientDeduction[] = [];

    const reqCheck = await this.checkMealRequirements(params.recipe, params.targetServings);

    for (const reqItem of reqCheck.items) {
      let deductAmount = reqItem.proposedDeduction;

      // Check if user customized the deduction amount in modal
      if (params.customDeductions) {
        const custom = params.customDeductions.find((c) => c.recipeIngredientName === reqItem.recipeIngredientName);
        if (custom) {
          deductAmount = custom.deductionQuantity;
        }
      }

      if (reqItem.matchedInventoryItem && deductAmount > 0) {
        const invItem = reqItem.matchedInventoryItem;
        const prevStock = invItem.quantity;

        // Convert deductAmount (in recipe unit) back to inventory unit
        const convertedDeduct = convertQuantity(deductAmount, reqItem.unit, invItem.unit) ?? deductAmount;
        const actualDeduct = Math.min(prevStock, Math.max(0, convertedDeduct));
        const newStock = Math.max(0, prevStock - actualDeduct);

        invItem.quantity = Math.round(newStock * 100) / 100;
        invItem.lastUsedAt = now;
        invItem.updatedAt = now;

        await storageService.set(STORES.INVENTORY, invItem);

        deductions.push({
          ingredientId: invItem.id,
          ingredientName: invItem.name,
          deductedQuantity: actualDeduct,
          unit: invItem.unit,
          previousStock: prevStock,
          remainingStock: invItem.quantity,
        });

        // Record Meal Usage Transaction
        await this.recordTransaction({
          ingredientId: invItem.id,
          ingredientName: invItem.name,
          quantityChange: -actualDeduct,
          unit: invItem.unit,
          type: 'Meal Usage',
          mealCompletionId: completionId,
          mealTitle: params.recipe.title,
          notes: `Cooked for ${params.recipe.title} (${params.targetServings} servings)`,
        });
      }
    }

    const completion: MealCompletion = {
      id: completionId,
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

    await storageService.set(STORES.COMPLETIONS, completion);
    return completion;
  }

  /**
   * Reverses a meal completion:
   * 1. Restores deducted inventory quantities.
   * 2. Records 'Reversal' transactions.
   * 3. Marks completion as 'reversed'.
   */
  async undoMealCompletion(completionId: string): Promise<MealCompletion | null> {
    await this.init();
    const completion = await storageService.get<MealCompletion>(STORES.COMPLETIONS, completionId);
    if (!completion || completion.status === 'reversed') return null;

    const now = new Date().toISOString();

    for (const d of completion.deductions) {
      const invItem = this.itemsMap.get(d.ingredientId);
      if (invItem) {
        invItem.quantity = Math.round((invItem.quantity + d.deductedQuantity) * 100) / 100;
        invItem.updatedAt = now;
        await storageService.set(STORES.INVENTORY, invItem);

        // Record reversal transaction
        await this.recordTransaction({
          ingredientId: invItem.id,
          ingredientName: invItem.name,
          quantityChange: d.deductedQuantity,
          unit: d.unit,
          type: 'Reversal',
          mealCompletionId: completionId,
          mealTitle: completion.recipeTitle,
          notes: `Reversed cooking completion of ${completion.recipeTitle}`,
        });
      }
    }

    completion.status = 'reversed';
    completion.reversedAt = now;
    await storageService.set(STORES.COMPLETIONS, completion);
    return completion;
  }

  async getCompletionById(completionId: string): Promise<MealCompletion | null> {
    return storageService.get<MealCompletion>(STORES.COMPLETIONS, completionId);
  }

  // --- Transactions Logging ---

  private formatActivitySummary(tx: Pick<InventoryTransaction, 'type' | 'quantityChange' | 'unit' | 'mealTitle'>): string {
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

  async recordTransaction(
    tx: Omit<InventoryTransaction, 'id' | 'timestamp'>,
    options?: { skipLastActivityUpdate?: boolean }
  ): Promise<InventoryTransaction> {
    const id = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const fullTx: InventoryTransaction = {
      ...tx,
      id,
      timestamp: now,
    };

    await storageService.set(STORES.TRANSACTIONS, fullTx);

    if (!options?.skipLastActivityUpdate) {
      const invItem = this.itemsMap.get(fullTx.ingredientId);
      if (invItem) {
        invItem.lastActivityAt = now;
        invItem.lastActivityType = fullTx.type;
        invItem.lastActivitySummary = this.formatActivitySummary(fullTx);
        if (fullTx.type === 'Meal Usage') {
          invItem.lastUsedAt = now;
        }
        invItem.updatedAt = now;
        this.itemsMap.set(invItem.id, invItem);
        await storageService.set(STORES.INVENTORY, invItem);
      }
    }

    return fullTx;
  }

  async getAllTransactions(ingredientId?: string): Promise<InventoryTransaction[]> {
    const all = await storageService.getAll<InventoryTransaction>(STORES.TRANSACTIONS);
    const filtered = ingredientId ? all.filter((t) => t.ingredientId === ingredientId) : all;
    // Sort descending by timestamp
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Adds stock from purchases (e.g. shopping list checkout or restock action).
   */
  async addStock(
    ingredientName: string,
    quantity: number,
    unit: string,
    location: StorageLocation = 'Pantry',
    category: IngredientCategory = 'Pantry'
  ): Promise<void> {
    await this.init();
    const existing = await this.findIngredientByName(ingredientName);

    if (existing) {
      const convertedQty = convertQuantity(quantity, unit, existing.unit) ?? quantity;
      await this.updateIngredient(
        existing.id,
        {
          quantity: Math.round((existing.quantity + convertedQty) * 100) / 100,
        },
        { skipTransactionLog: true }
      );
      await this.recordTransaction({
        ingredientId: existing.id,
        ingredientName: existing.name,
        quantityChange: convertedQty,
        unit: existing.unit,
        type: 'Purchase',
        notes: `Restocked via shopping list (${formatSmartQuantity(quantity, unit)})`,
      });
    } else {
      const catMatch = ingredientCatalogService.findCatalogItem(ingredientName);
      const newIng = await this.addIngredient(
        {
          name: ingredientName,
          quantity,
          unit,
          minStockLevel: Math.round(quantity * 0.3),
          location: catMatch?.defaultLocation || location,
          category: catMatch?.category || category,
          price: catMatch?.referencePriceZAR,
          priceUnit: catMatch?.priceUnit,
          notes: 'Added from shopping list',
        },
        { skipTransactionLog: true }
      );
      await this.recordTransaction({
        ingredientId: newIng.id,
        ingredientName: newIng.name,
        quantityChange: quantity,
        unit,
        type: 'Purchase',
        notes: 'Added new item from shopping list',
      });
    }
  }
}

export const inventoryService = new InventoryService();
