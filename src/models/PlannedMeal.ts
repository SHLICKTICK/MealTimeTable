export type MealType = 'breakfast' | 'dinner';

export interface PlannedMeal {
  id: string;
  dayIndex: number; // 0 = Monday, 6 = Sunday
  mealType: MealType;
  recipeId: string;
  title: string;
  imageUrl: string;
  servings: number;
}
