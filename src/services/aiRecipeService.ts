import { appState } from '../app/state';
import { MEAL_IMAGES } from './recipeService';

export interface GeneratedRecipeData {
  title?: string;
  description: string;
  category: 'Breakfast' | 'Lunch' | 'Dinner';
  servings: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  estimatedCostZAR?: number;
  suggestedImageType?: string;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    category?: string;
  }>;
}

export class AiRecipeService {
  /**
   * Request Gemini to generate ingredients, portions, description, and metadata
   * for a given recipe name.
   */
  async generateIngredients(
    recipeTitle: string,
    servings: number = 4,
    category: string = 'Dinner'
  ): Promise<GeneratedRecipeData> {
    const trimmedTitle = recipeTitle.trim();
    if (!trimmedTitle) {
      throw new Error('Please enter a recipe name first.');
    }

    try {
      const response = await fetch('/api/recipes/generate-ingredients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeTitle: trimmedTitle,
          servings: Math.max(1, Math.min(20, servings)),
          category,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data: GeneratedRecipeData = await response.json();
      if (!data.ingredients || !Array.isArray(data.ingredients) || data.ingredients.length === 0) {
        throw new Error('AI returned an empty ingredient list.');
      }

      return data;
    } catch (err: any) {
      console.warn('API call to /api/recipes/generate-ingredients failed, using fallback culinary generator:', err);
      // Graceful offline / fallback generator to ensure seamless user experience
      return this.generateOfflineFallback(trimmedTitle, servings, category);
    }
  }

  /**
   * Offline / fallback culinary generator that supplies realistic ingredients
   * if the network or API is temporarily unavailable.
   */
  private generateOfflineFallback(
    title: string,
    servings: number,
    category: string
  ): GeneratedRecipeData {
    const lower = title.toLowerCase();
    const ratio = servings / 4;

    // Detect culinary keywords
    if (lower.includes('pasta') || lower.includes('spaghetti') || lower.includes('carbonara') || lower.includes('bolognese')) {
      return {
        description: `Classic savory ${title} prepared with artisanal pasta, rich aromatics, and fine seasonings.`,
        category: 'Dinner',
        servings,
        prepTimeMinutes: 15,
        cookTimeMinutes: 20,
        suggestedImageType: MEAL_IMAGES.pasta_primavera,
        ingredients: [
          { name: 'Pasta (Spaghetti or Penne)', quantity: Math.round(400 * ratio), unit: 'g', category: 'Pantry' },
          { name: 'Olive oil', quantity: Math.round(30 * ratio), unit: 'ml', category: 'Pantry' },
          { name: 'Garlic cloves', quantity: Math.max(1, Math.round(4 * ratio)), unit: 'cloves', category: 'Produce' },
          { name: 'Grated Parmesan cheese', quantity: Math.round(80 * ratio), unit: 'g', category: 'Dairy & Eggs' },
          { name: 'Black pepper & Salt', quantity: 5, unit: 'g', category: 'Spices & Condiments' },
          { name: 'Fresh basil or parsley', quantity: Math.round(15 * ratio), unit: 'g', category: 'Produce' },
        ],
      };
    }

    if (lower.includes('egg') || lower.includes('omelet') || lower.includes('scramble') || lower.includes('shakshuka')) {
      return {
        description: `Fluffy, protein-rich ${title} cooked with fresh farmhouse eggs and herbs.`,
        category: 'Breakfast',
        servings,
        prepTimeMinutes: 5,
        cookTimeMinutes: 10,
        suggestedImageType: MEAL_IMAGES.scrambled_eggs,
        ingredients: [
          { name: 'Large fresh eggs', quantity: Math.round(8 * ratio), unit: 'pieces', category: 'Dairy & Eggs' },
          { name: 'Butter', quantity: Math.round(30 * ratio), unit: 'g', category: 'Dairy & Eggs' },
          { name: 'Whole milk or cream', quantity: Math.round(60 * ratio), unit: 'ml', category: 'Dairy & Eggs' },
          { name: 'Fresh chives or herbs', quantity: 10, unit: 'g', category: 'Produce' },
          { name: 'Sea salt & Black pepper', quantity: 4, unit: 'g', category: 'Spices & Condiments' },
        ],
      };
    }

    if (lower.includes('curry') || lower.includes('stew') || lower.includes('potjie') || lower.includes('beef')) {
      return {
        description: `Hearty slow-simmered ${title} with tender meat, root vegetables, and fragrant spices.`,
        category: 'Dinner',
        servings,
        prepTimeMinutes: 20,
        cookTimeMinutes: 60,
        suggestedImageType: MEAL_IMAGES.beef_stew,
        ingredients: [
          { name: 'Stewing beef or protein', quantity: Math.round(750 * ratio), unit: 'g', category: 'Meat & Poultry' },
          { name: 'Potatoes (cubed)', quantity: Math.round(400 * ratio), unit: 'g', category: 'Produce' },
          { name: 'Carrots (sliced)', quantity: Math.round(250 * ratio), unit: 'g', category: 'Produce' },
          { name: 'Yellow onion', quantity: Math.max(1, Math.round(2 * ratio)), unit: 'medium', category: 'Produce' },
          { name: 'Beef broth or water', quantity: Math.round(500 * ratio), unit: 'ml', category: 'Pantry' },
          { name: 'Cooking oil', quantity: Math.round(30 * ratio), unit: 'ml', category: 'Pantry' },
          { name: 'Curry / Stew seasoning', quantity: 15, unit: 'g', category: 'Spices & Condiments' },
        ],
      };
    }

    if (lower.includes('pancake') || lower.includes('waffle') || lower.includes('crepe')) {
      return {
        description: `Golden, fluffy ${title} served warm with sweet toppings and butter.`,
        category: 'Breakfast',
        servings,
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        suggestedImageType: MEAL_IMAGES.pancakes,
        ingredients: [
          { name: 'All-purpose flour', quantity: Math.round(300 * ratio), unit: 'g', category: 'Pantry' },
          { name: 'Milk', quantity: Math.round(350 * ratio), unit: 'ml', category: 'Dairy & Eggs' },
          { name: 'Large eggs', quantity: Math.max(1, Math.round(2 * ratio)), unit: 'pieces', category: 'Dairy & Eggs' },
          { name: 'Baking powder', quantity: 10, unit: 'g', category: 'Pantry' },
          { name: 'Melted butter', quantity: Math.round(40 * ratio), unit: 'g', category: 'Dairy & Eggs' },
          { name: 'Maple syrup or Honey', quantity: Math.round(60 * ratio), unit: 'ml', category: 'Pantry' },
        ],
      };
    }

    if (lower.includes('salad') || lower.includes('bowl')) {
      return {
        description: `Crisp and refreshing ${title} with colorful seasonal produce and vinaigrette dressing.`,
        category: 'Lunch',
        servings,
        prepTimeMinutes: 15,
        cookTimeMinutes: 0,
        suggestedImageType: MEAL_IMAGES.greek_yogurt,
        ingredients: [
          { name: 'Mixed salad greens', quantity: Math.round(250 * ratio), unit: 'g', category: 'Produce' },
          { name: 'Cucumber (sliced)', quantity: Math.max(1, Math.round(1 * ratio)), unit: 'medium', category: 'Produce' },
          { name: 'Cherry tomatoes', quantity: Math.round(200 * ratio), unit: 'g', category: 'Produce' },
          { name: 'Extra virgin olive oil', quantity: Math.round(40 * ratio), unit: 'ml', category: 'Pantry' },
          { name: 'Lemon juice or vinegar', quantity: Math.round(20 * ratio), unit: 'ml', category: 'Pantry' },
          { name: 'Feta cheese or seeds', quantity: Math.round(100 * ratio), unit: 'g', category: 'Dairy & Eggs' },
        ],
      };
    }

    // Default culinary generator for any custom dish
    return {
      description: `A delicious homemade ${title} made with fresh ingredients and balanced flavors.`,
      category: category as 'Breakfast' | 'Lunch' | 'Dinner',
      servings,
      prepTimeMinutes: 15,
      cookTimeMinutes: 25,
      suggestedImageType: MEAL_IMAGES.chicken_and_rice,
      ingredients: [
        { name: `${title} Main Protein / Core Base`, quantity: Math.round(500 * ratio), unit: 'g', category: 'Meat & Poultry' },
        { name: 'Onion', quantity: Math.max(1, Math.round(1 * ratio)), unit: 'medium', category: 'Produce' },
        { name: 'Garlic cloves', quantity: Math.max(1, Math.round(3 * ratio)), unit: 'cloves', category: 'Produce' },
        { name: 'Cooking oil or butter', quantity: Math.round(30 * ratio), unit: 'ml', category: 'Pantry' },
        { name: 'Vegetables / Garnish', quantity: Math.round(200 * ratio), unit: 'g', category: 'Produce' },
        { name: 'Sea salt & Seasoning', quantity: 5, unit: 'g', category: 'Spices & Condiments' },
      ],
    };
  }
}

export const aiRecipeService = new AiRecipeService();
