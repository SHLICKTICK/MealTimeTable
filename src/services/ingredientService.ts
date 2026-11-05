import { Ingredient } from '../models/Ingredient';
import { WeeklyPlan } from '../models/WeeklyPlan';
import { recipeService } from './recipeService';
import { storageService, STORES } from './storageService';
import { inventoryService } from './inventoryService';
import { formatQuantityWithUnit } from '../utils/ingredientScaling';
import { convertQuantity, formatSmartQuantity } from '../utils/unitConversion';

export interface ShoppingItem extends Ingredient {
  displayQuantity: string;
  sourceMeals: string[];
  quantityRequired: number;
  quantityInStock: number;
  quantityToBuy: number;
  isSufficientInStock: boolean;
  addedToInventory?: boolean;
}

interface StoredShoppingState {
  id: string;
  purchased: Record<string, boolean>;
  addedToInventory: Record<string, boolean>;
}

class IngredientService {
  async getShoppingListForWeek(plan: WeeklyPlan): Promise<ShoppingItem[]> {
    await inventoryService.init();
    const allRecipes = await recipeService.getAllRecipes();
    const recipeMap = new Map(allRecipes.map((r) => [r.id, r]));

    // Fetch existing purchased items state from storage
    const storedState = (await storageService.get<StoredShoppingState>(
      STORES.SHOPPING_LIST,
      plan.id
    )) || { id: plan.id, purchased: {}, addedToInventory: {} };

    // Map: normalized ingredient name + unit -> raw required quantity & metadata
    const itemMap = new Map<
      string,
      {
        id: string;
        name: string;
        unit: string;
        category: Ingredient['category'];
        quantityRequired: number;
        sourceMeals: string[];
      }
    >();

    for (const day of plan.days) {
      const meals = [day.breakfast, day.dinner].filter(Boolean);
      for (const meal of meals) {
        if (!meal) continue;
        const recipe = recipeMap.get(meal.recipeId);
        if (!recipe) continue;

        const ratio = (meal.servings || recipe.servings) / recipe.servings;

        for (const ing of recipe.ingredients) {
          const normKey = `${ing.name.trim().toLowerCase()}_${ing.unit.trim().toLowerCase()}`;
          const scaledQty = ing.quantity * ratio;

          if (itemMap.has(normKey)) {
            const existing = itemMap.get(normKey)!;
            existing.quantityRequired += scaledQty;
            const mealLabel = `${day.dayName} ${meal.mealType === 'breakfast' ? 'Breakfast' : 'Dinner'}`;
            if (!existing.sourceMeals.includes(mealLabel)) {
              existing.sourceMeals.push(mealLabel);
            }
          } else {
            const itemKey = `shop-${plan.id}-${normKey.replace(/[^a-z0-9]/g, '_')}`;
            itemMap.set(normKey, {
              id: itemKey,
              name: ing.name,
              unit: ing.unit,
              category: ing.category || 'Pantry',
              quantityRequired: scaledQty,
              sourceMeals: [`${day.dayName} ${meal.mealType === 'breakfast' ? 'Breakfast' : 'Dinner'}`],
            });
          }
        }
      }
    }

    const items: ShoppingItem[] = [];

    for (const raw of itemMap.values()) {
      // Compare required amount with current inventory stock
      const matchedStock = await inventoryService.findIngredientByName(raw.name);
      let inStockInRecipeUnit = 0;

      if (matchedStock) {
        const converted = convertQuantity(matchedStock.quantity, matchedStock.unit, raw.unit);
        inStockInRecipeUnit = converted !== null ? converted : matchedStock.quantity;
      }

      // Quantity to purchase = max(0, required - inStock) per specification
      const qtyToBuy = Math.max(0, raw.quantityRequired - inStockInRecipeUnit);
      const isSufficient = qtyToBuy === 0;

      const isPurchased = !!storedState.purchased[raw.id];
      const isAdded = !!storedState.addedToInventory?.[raw.id];

      const displayQty = isSufficient
        ? `In Pantry (${formatQuantityWithUnit(inStockInRecipeUnit, raw.unit)})`
        : formatQuantityWithUnit(qtyToBuy, raw.unit);

      items.push({
        id: raw.id,
        name: raw.name,
        quantity: isSufficient ? raw.quantityRequired : qtyToBuy,
        quantityRequired: Math.round(raw.quantityRequired * 10) / 10,
        quantityInStock: Math.round(inStockInRecipeUnit * 10) / 10,
        quantityToBuy: Math.round(qtyToBuy * 10) / 10,
        isSufficientInStock: isSufficient,
        unit: raw.unit,
        category: raw.category || 'Pantry',
        purchased: isPurchased,
        addedToInventory: isAdded,
        displayQuantity: displayQty,
        sourceMeals: raw.sourceMeals,
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
   * to prevent duplicate additions.
   */
  async addPurchasedToInventory(weekId: string, item: ShoppingItem): Promise<boolean> {
    const storedState = (await storageService.get<StoredShoppingState>(
      STORES.SHOPPING_LIST,
      weekId
    )) || { id: weekId, purchased: {}, addedToInventory: {} };

    if (storedState.addedToInventory?.[item.id]) {
      return false; // Already added
    }

    // Add stock to inventory
    const addAmount = item.quantityToBuy > 0 ? item.quantityToBuy : item.quantityRequired;
    await inventoryService.addStock(item.name, addAmount, item.unit, 'Pantry', (item.category as any) || 'Pantry');

    // Record as added
    if (!storedState.addedToInventory) storedState.addedToInventory = {};
    storedState.addedToInventory[item.id] = true;
    storedState.purchased[item.id] = true;

    await storageService.set(STORES.SHOPPING_LIST, storedState);
    return true;
  }

  async clearPurchased(weekId: string): Promise<void> {
    await storageService.set(STORES.SHOPPING_LIST, { id: weekId, purchased: {}, addedToInventory: {} });
  }
}

export const ingredientService = new IngredientService();
