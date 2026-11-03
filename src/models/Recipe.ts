import { Ingredient } from './Ingredient';

export interface Recipe {
  id: string;
  title: string;
  description: string;
  category: 'Breakfast' | 'Dinner' | 'Lunch';
  servings: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  imageUrl: string;
  ingredients: Ingredient[];
  instructions?: string[];
  estimatedCostZAR?: number;
}
