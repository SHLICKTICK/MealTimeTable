export interface IngredientDeduction {
  ingredientId: string;
  ingredientName: string;
  deductedQuantity: number;
  unit: string;
  previousStock: number;
  remainingStock: number;
}

export interface MealCompletion {
  id: string;
  mealId: string; // plan meal id
  weekId: string;
  dayIndex: number;
  mealType: 'breakfast' | 'dinner';
  recipeId: string;
  recipeTitle: string;
  servings: number;
  completedAt: string; // ISO date
  deductions: IngredientDeduction[];
  status: 'active' | 'reversed';
  reversedAt?: string;
}
