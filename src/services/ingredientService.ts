import { Ingredient } from '../models/Ingredient';
import { WeeklyPlan } from '../models/WeeklyPlan';
import { recipeService } from './recipeService';
import { storageService, STORES } from './storageService';
import { formatQuantityWithUnit } from '../utils/ingredientScaling';

export interface ShoppingItem extends Ingredient {
  displayQuantity: string;
  sourceMeals: string[];
}

class IngredientService {
  async getShoppingListForWeek(plan: WeeklyPlan): Promise<ShoppingItem[]> {
    const allRecipes = await recipeService.getAllRecipes();
    const recipeMap = new Map(allRecipes.map((r) => [r.id, r]));

    // Fetch existing purchased items state from storage
    const storedState = (await storageService.get<{ id: string; purchased: Record<string, boolean> }>(
      STORES.SHOPPING_LIST,
      plan.id
    )) || { id: plan.id, purchased: {} };

    // Map: normalized ingredient name + unit -> ShoppingItem
    const itemMap = new Map<string, ShoppingItem>();

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
            existing.quantity += scaledQty;
            const mealLabel = `${day.dayName} ${meal.mealType === 'breakfast' ? 'Breakfast' : 'Dinner'}`;
            if (!existing.sourceMeals.includes(mealLabel)) {
              existing.sourceMeals.push(mealLabel);
            }
          } else {
            const itemKey = `shop-${plan.id}-${normKey.replace(/[^a-z0-9]/g, '_')}`;
            itemMap.set(normKey, {
              id: itemKey,
              name: ing.name,
              quantity: scaledQty,
              unit: ing.unit,
              category: ing.category || 'Pantry',
              purchased: !!storedState.purchased[itemKey],
              displayQuantity: '',
              sourceMeals: [`${day.dayName} ${meal.mealType === 'breakfast' ? 'Breakfast' : 'Dinner'}`],
            });
          }
        }
      }
    }

    const items = Array.from(itemMap.values()).map((item) => {
      item.displayQuantity = formatQuantityWithUnit(item.quantity, item.unit);
      return item;
    });

    // Sort by category then name
    items.sort((a, b) => {
      if (a.category !== b.category) {
        return (a.category || '').localeCompare(b.category || '');
      }
      return a.name.localeCompare(b.name);
    });

    return items;
  }

  async toggleItemPurchased(weekId: string, itemId: string, purchased: boolean): Promise<void> {
    const storedState = (await storageService.get<{ id: string; purchased: Record<string, boolean> }>(
      STORES.SHOPPING_LIST,
      weekId
    )) || { id: weekId, purchased: {} };

    storedState.purchased[itemId] = purchased;
    await storageService.set(STORES.SHOPPING_LIST, storedState);
  }

  async clearPurchased(weekId: string): Promise<void> {
    await storageService.set(STORES.SHOPPING_LIST, { id: weekId, purchased: {} });
  }
}

export const ingredientService = new IngredientService();
