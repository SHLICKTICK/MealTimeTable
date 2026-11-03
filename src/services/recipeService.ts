import { Recipe } from '../models/Recipe';
import { storageService, STORES } from './storageService';

// High-fidelity image assets generated for MealWeek
export const MEAL_IMAGES = {
  chicken_and_rice: '/src/assets/images/chicken_and_rice_hero_1793639192404.jpg',
  oats_berries: '/src/assets/images/oats_berries_breakfast_1793639192290.jpg',
  scrambled_eggs: '/src/assets/images/scrambled_eggs_dish_1793639315308.jpg',
  beef_stew: '/src/assets/images/beef_stew_dinner_1793639194600.jpg',
  pancakes: '/src/assets/images/pancakes_breakfast_1793639194210.jpg',
  pasta_primavera: '/src/assets/images/pasta_primavera_dish_1793639315170.jpg',
  greek_yogurt: '/src/assets/images/greek_yogurt_dish_1793639337290.jpg',
  grilled_chicken: '/src/assets/images/grilled_chicken_dish_1793639337877.jpg',
  breakfast_sandwich: '/src/assets/images/breakfast_sandwich_dish_1793639338000.jpg',
  burgers: '/src/assets/images/gourmet_burger_dish_1793639337686.jpg',
  french_toast: '/src/assets/images/french_toast_dish_1793639315929.jpg',
  pap_stew: '/src/assets/images/pap_and_stew_dish_1793639316135.jpg',
  roast_chicken: '/src/assets/images/grilled_chicken_dish_1793639337877.jpg',
  muffins_fruit: '/src/assets/images/oats_berries_breakfast_1793639192290.jpg',
};

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'rec-chicken-rice',
    title: 'Chicken & Rice',
    description: 'A simple and delicious family dinner.',
    category: 'Dinner',
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 35,
    imageUrl: MEAL_IMAGES.chicken_and_rice,
    estimatedCostZAR: 185.0,
    ingredients: [
      { id: 'ing-1', name: 'Chicken pieces', quantity: 800, unit: 'g', category: 'Meat & Poultry' },
      { id: 'ing-2', name: 'Rice', quantity: 400, unit: 'g', category: 'Pantry' },
      { id: 'ing-3', name: 'Carrots', quantity: 200, unit: 'g', category: 'Produce' },
      { id: 'ing-4', name: 'Onion', quantity: 1, unit: 'medium', category: 'Produce' },
      { id: 'ing-5', name: 'Cooking oil', quantity: 30, unit: 'ml', category: 'Pantry' },
      { id: 'ing-6', name: 'Salt', quantity: 5, unit: 'g', category: 'Spices & Condiments' },
    ],
    instructions: [
      'Season chicken pieces with salt, pepper, and herbs of your choice.',
      'Heat cooking oil in a wide heavy-based pot over medium-high heat and brown the chicken on all sides.',
      'Dice the onion and slice carrots; add them to the pot and sauté until fragrant.',
      'Rinse rice and stir into the pot, then add 800ml hot water or broth.',
      'Cover with a lid, reduce heat to low, and simmer for 25 minutes until chicken is tender and rice has absorbed the liquid.',
    ],
  },
  {
    id: 'rec-oats-berries',
    title: 'Oats & Berries',
    description: 'Warm wholesome oats topped with antioxidant-rich berries and seeds.',
    category: 'Breakfast',
    servings: 2,
    prepTimeMinutes: 5,
    cookTimeMinutes: 8,
    imageUrl: MEAL_IMAGES.oats_berries,
    estimatedCostZAR: 45.0,
    ingredients: [
      { id: 'ing-7', name: 'Rolled oats', quantity: 160, unit: 'g', category: 'Pantry' },
      { id: 'ing-8', name: 'Fresh berries', quantity: 120, unit: 'g', category: 'Produce' },
      { id: 'ing-9', name: 'Milk or oat milk', quantity: 350, unit: 'ml', category: 'Dairy & Eggs' },
      { id: 'ing-10', name: 'Chia seeds', quantity: 15, unit: 'g', category: 'Pantry' },
      { id: 'ing-11', name: 'Honey', quantity: 20, unit: 'ml', category: 'Pantry' },
    ],
    instructions: [
      'Combine oats and milk in a saucepan over medium heat.',
      'Cook for 6-8 minutes, stirring frequently until thick and creamy.',
      'Divide between two bowls, top with freshly rinsed berries, chia seeds, and a drizzle of honey.',
    ],
  },
  {
    id: 'rec-scrambled-eggs',
    title: 'Scrambled Eggs',
    description: 'Fluffy, velvety slow-cooked eggs with chives and toasted sourdough.',
    category: 'Breakfast',
    servings: 2,
    prepTimeMinutes: 5,
    cookTimeMinutes: 6,
    imageUrl: MEAL_IMAGES.scrambled_eggs,
    estimatedCostZAR: 38.0,
    ingredients: [
      { id: 'ing-12', name: 'Free-range eggs', quantity: 4, unit: 'large', category: 'Dairy & Eggs' },
      { id: 'ing-13', name: 'Butter', quantity: 20, unit: 'g', category: 'Dairy & Eggs' },
      { id: 'ing-14', name: 'Fresh chives', quantity: 5, unit: 'g', category: 'Produce' },
      { id: 'ing-15', name: 'Sea salt', quantity: 2, unit: 'g', category: 'Spices & Condiments' },
      { id: 'ing-16', name: 'Cracked pepper', quantity: 1, unit: 'g', category: 'Spices & Condiments' },
    ],
    instructions: [
      'Whisk eggs vigorously with a pinch of sea salt.',
      'Melt butter gently in a non-stick pan over medium-low heat.',
      'Pour in eggs and stir continuously with a silicone spatula until soft curds form.',
      'Remove from heat just before fully set and garnish with fresh chives.',
    ],
  },
  {
    id: 'rec-beef-stew',
    title: 'Beef Stew',
    description: 'Rich, melt-in-your-mouth slow braised beef with rustic vegetables.',
    category: 'Dinner',
    servings: 4,
    prepTimeMinutes: 20,
    cookTimeMinutes: 120,
    imageUrl: MEAL_IMAGES.beef_stew,
    estimatedCostZAR: 220.0,
    ingredients: [
      { id: 'ing-17', name: 'Stewing beef chunks', quantity: 800, unit: 'g', category: 'Meat & Poultry' },
      { id: 'ing-18', name: 'Potatoes', quantity: 350, unit: 'g', category: 'Produce' },
      { id: 'ing-19', name: 'Carrots', quantity: 250, unit: 'g', category: 'Produce' },
      { id: 'ing-20', name: 'Onion', quantity: 1, unit: 'large', category: 'Produce' },
      { id: 'ing-21', name: 'Beef stock', quantity: 500, unit: 'ml', category: 'Pantry' },
      { id: 'ing-22', name: 'Olive oil', quantity: 25, unit: 'ml', category: 'Pantry' },
    ],
    instructions: [
      'Sear the beef chunks in batches until deep golden brown on all sides.',
      'Sauté diced onions, carrots, and potatoes with aromatic herbs.',
      'Deglaze pot with stock, return beef, and simmer gently on low heat for 2 hours until fork-tender.',
    ],
  },
  {
    id: 'rec-pancakes',
    title: 'Pancakes',
    description: 'Cloud-soft buttermilk pancakes with pure amber maple syrup.',
    category: 'Breakfast',
    servings: 4,
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    imageUrl: MEAL_IMAGES.pancakes,
    estimatedCostZAR: 52.0,
    ingredients: [
      { id: 'ing-23', name: 'All-purpose flour', quantity: 250, unit: 'g', category: 'Pantry' },
      { id: 'ing-24', name: 'Milk', quantity: 300, unit: 'ml', category: 'Dairy & Eggs' },
      { id: 'ing-25', name: 'Eggs', quantity: 2, unit: 'medium', category: 'Dairy & Eggs' },
      { id: 'ing-26', name: 'Baking powder', quantity: 10, unit: 'g', category: 'Pantry' },
      { id: 'ing-27', name: 'Maple syrup', quantity: 60, unit: 'ml', category: 'Pantry' },
    ],
    instructions: [
      'Whisk dry ingredients in one bowl and wet ingredients in another.',
      'Gently fold together until just combined (leave small lumps).',
      'Ladle onto a greased griddle over medium heat until bubbles burst on surface, flip once.',
    ],
  },
  {
    id: 'rec-pasta-primavera',
    title: 'Pasta Primavera',
    description: 'Al dente penne tossed with crisp seasonal vegetables and parmesan.',
    category: 'Dinner',
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    imageUrl: MEAL_IMAGES.pasta_primavera,
    estimatedCostZAR: 135.0,
    ingredients: [
      { id: 'ing-28', name: 'Penne pasta', quantity: 400, unit: 'g', category: 'Pantry' },
      { id: 'ing-29', name: 'Fresh asparagus', quantity: 150, unit: 'g', category: 'Produce' },
      { id: 'ing-30', name: 'Cherry tomatoes', quantity: 200, unit: 'g', category: 'Produce' },
      { id: 'ing-31', name: 'Zucchini', quantity: 150, unit: 'g', category: 'Produce' },
      { id: 'ing-32', name: 'Extra virgin olive oil', quantity: 40, unit: 'ml', category: 'Pantry' },
      { id: 'ing-33', name: 'Parmesan cheese', quantity: 50, unit: 'g', category: 'Dairy & Eggs' },
    ],
    instructions: [
      'Boil pasta in well-salted water until al dente.',
      'Sauté garlic, sliced asparagus, zucchini, and halved cherry tomatoes in olive oil.',
      'Toss pasta with vegetables, a splash of cooking water, and shaved parmesan.',
    ],
  },
  {
    id: 'rec-greek-yogurt',
    title: 'Greek Yogurt',
    description: 'Velvety authentic Greek yogurt layered with compote and toasted nuts.',
    category: 'Breakfast',
    servings: 2,
    prepTimeMinutes: 5,
    cookTimeMinutes: 0,
    imageUrl: MEAL_IMAGES.greek_yogurt,
    estimatedCostZAR: 48.0,
    ingredients: [
      { id: 'ing-34', name: 'Greek yogurt (plain)', quantity: 400, unit: 'g', category: 'Dairy & Eggs' },
      { id: 'ing-35', name: 'Blackberries & compote', quantity: 120, unit: 'g', category: 'Produce' },
      { id: 'ing-36', name: 'Raw honey', quantity: 25, unit: 'ml', category: 'Pantry' },
      { id: 'ing-37', name: 'Toasted walnuts', quantity: 30, unit: 'g', category: 'Pantry' },
    ],
    instructions: [
      'Spoon Greek yogurt into chilled bowls.',
      'Swirl through blackberry compote, garnish with whole berries, toasted walnuts, and drizzle with honey.',
    ],
  },
  {
    id: 'rec-grilled-chicken',
    title: 'Grilled Chicken',
    description: 'Rosemary and lemon grilled chicken breast with roasted Mediterranean sides.',
    category: 'Dinner',
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    imageUrl: MEAL_IMAGES.grilled_chicken,
    estimatedCostZAR: 175.0,
    ingredients: [
      { id: 'ing-38', name: 'Chicken breast fillets', quantity: 800, unit: 'g', category: 'Meat & Poultry' },
      { id: 'ing-39', name: 'Fresh lemon', quantity: 2, unit: 'whole', category: 'Produce' },
      { id: 'ing-40', name: 'Fresh rosemary', quantity: 10, unit: 'g', category: 'Produce' },
      { id: 'ing-41', name: 'Olive oil', quantity: 30, unit: 'ml', category: 'Pantry' },
      { id: 'ing-42', name: 'Garlic cloves', quantity: 3, unit: 'cloves', category: 'Produce' },
    ],
    instructions: [
      'Marinate chicken fillets in lemon juice, zest, chopped rosemary, garlic, and olive oil for 20 minutes.',
      'Grill on medium-high heat for 6-7 minutes per side until seared with grill marks and cooked through.',
      'Rest for 5 minutes before slicing.',
    ],
  },
  {
    id: 'rec-breakfast-sandwich',
    title: 'Breakfast Sandwich',
    description: 'Toasted brioche, runny sunny egg, mature cheddar, and peppery rocket.',
    category: 'Breakfast',
    servings: 2,
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    imageUrl: MEAL_IMAGES.breakfast_sandwich,
    estimatedCostZAR: 55.0,
    ingredients: [
      { id: 'ing-43', name: 'Brioche sandwich buns', quantity: 2, unit: 'pieces', category: 'Bakery' },
      { id: 'ing-44', name: 'Eggs', quantity: 2, unit: 'large', category: 'Dairy & Eggs' },
      { id: 'ing-45', name: 'Cheddar cheese', quantity: 60, unit: 'g', category: 'Dairy & Eggs' },
      { id: 'ing-46', name: 'Baby arugula/rocket', quantity: 30, unit: 'g', category: 'Produce' },
      { id: 'ing-47', name: 'Butter', quantity: 15, unit: 'g', category: 'Dairy & Eggs' },
    ],
    instructions: [
      'Toast brioche buns in a skillet until golden.',
      'Fry eggs sunny side up and melt cheddar on top.',
      'Assemble with peppery arugula and a hint of flaky sea salt.',
    ],
  },
  {
    id: 'rec-burgers',
    title: 'Burgers',
    description: 'Gourmet smashed beef patties with melted cheddar and caramelized relish.',
    category: 'Dinner',
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 15,
    imageUrl: MEAL_IMAGES.burgers,
    estimatedCostZAR: 190.0,
    ingredients: [
      { id: 'ing-48', name: 'Ground beef (80/20)', quantity: 650, unit: 'g', category: 'Meat & Poultry' },
      { id: 'ing-49', name: 'Brioche burger buns', quantity: 4, unit: 'pieces', category: 'Bakery' },
      { id: 'ing-50', name: 'Cheddar cheese slices', quantity: 4, unit: 'slices', category: 'Dairy & Eggs' },
      { id: 'ing-51', name: 'Ripe tomatoes', quantity: 2, unit: 'medium', category: 'Produce' },
      { id: 'ing-52', name: 'Crisp lettuce', quantity: 80, unit: 'g', category: 'Produce' },
    ],
    instructions: [
      'Shape beef into 4 equal patties and season liberally with salt and pepper.',
      'Sear patties on a hot cast iron pan for 3 minutes per side; add cheese slices to melt.',
      'Toast buns and assemble with crisp lettuce, tomato slices, and burger sauce.',
    ],
  },
  {
    id: 'rec-french-toast',
    title: 'French Toast',
    description: 'Golden brioche French toast topped with fresh mixed berries and maple.',
    category: 'Breakfast',
    servings: 4,
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    imageUrl: MEAL_IMAGES.french_toast,
    estimatedCostZAR: 68.0,
    ingredients: [
      { id: 'ing-53', name: 'Thick sliced brioche', quantity: 6, unit: 'slices', category: 'Bakery' },
      { id: 'ing-54', name: 'Eggs', quantity: 3, unit: 'large', category: 'Dairy & Eggs' },
      { id: 'ing-55', name: 'Whole milk', quantity: 120, unit: 'ml', category: 'Dairy & Eggs' },
      { id: 'ing-56', name: 'Fresh berries', quantity: 150, unit: 'g', category: 'Produce' },
      { id: 'ing-57', name: 'Pure maple syrup', quantity: 50, unit: 'ml', category: 'Pantry' },
    ],
    instructions: [
      'Whisk eggs, milk, cinnamon, and vanilla extract in a shallow dish.',
      'Dip brioche slices for 10 seconds per side.',
      'Pan-fry in butter until crisp and golden; serve with berries and maple syrup.',
    ],
  },
  {
    id: 'rec-roast-chicken',
    title: 'Roast Chicken',
    description: 'Golden crispy whole roast chicken seasoned with garlic, thyme, and butter.',
    category: 'Dinner',
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 75,
    imageUrl: MEAL_IMAGES.roast_chicken,
    estimatedCostZAR: 195.0,
    ingredients: [
      { id: 'ing-58', name: 'Whole fresh chicken', quantity: 1.3, unit: 'kg', category: 'Meat & Poultry' },
      { id: 'ing-59', name: 'Baby potatoes', quantity: 500, unit: 'g', category: 'Produce' },
      { id: 'ing-60', name: 'Garlic head', quantity: 1, unit: 'whole', category: 'Produce' },
      { id: 'ing-61', name: 'Fresh thyme & rosemary', quantity: 15, unit: 'g', category: 'Produce' },
      { id: 'ing-62', name: 'Butter', quantity: 40, unit: 'g', category: 'Dairy & Eggs' },
    ],
    instructions: [
      'Rub chicken with softened herb butter, salt, and pepper.',
      'Arrange baby potatoes and halved garlic head around the chicken in a roasting tray.',
      'Roast at 200°C for 70-75 minutes until skin is crackling and juices run clear.',
    ],
  },
  {
    id: 'rec-muffins-fruit',
    title: 'Muffins & Fruit',
    description: 'Freshly baked blueberry bran muffins served with seasonal tropical fruits.',
    category: 'Breakfast',
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 22,
    imageUrl: MEAL_IMAGES.muffins_fruit,
    estimatedCostZAR: 58.0,
    ingredients: [
      { id: 'ing-63', name: 'Blueberry bran muffins', quantity: 4, unit: 'pieces', category: 'Bakery' },
      { id: 'ing-64', name: 'Fresh melon & berries', quantity: 300, unit: 'g', category: 'Produce' },
      { id: 'ing-65', name: 'Freshly squeezed juice', quantity: 500, unit: 'ml', category: 'Produce' },
    ],
    instructions: [
      'Warm muffins in the oven for 5 minutes.',
      'Slice fresh fruit into elegant bowls and serve alongside warm muffins and juice.',
    ],
  },
  {
    id: 'rec-pap-stew',
    title: 'Pap & Stew',
    description: 'Comforting South African maize meal (pap) with rich tomato beef stew.',
    category: 'Dinner',
    servings: 4,
    prepTimeMinutes: 20,
    cookTimeMinutes: 90,
    imageUrl: MEAL_IMAGES.pap_stew,
    estimatedCostZAR: 160.0,
    ingredients: [
      { id: 'ing-66', name: 'Coarse maize meal (pap)', quantity: 400, unit: 'g', category: 'Pantry' },
      { id: 'ing-67', name: 'Beef stew pieces', quantity: 650, unit: 'g', category: 'Meat & Poultry' },
      { id: 'ing-68', name: 'Tomato & onion relish', quantity: 300, unit: 'g', category: 'Produce' },
      { id: 'ing-69', name: 'Cooking oil', quantity: 20, unit: 'ml', category: 'Pantry' },
      { id: 'ing-70', name: 'Beef seasoning stock', quantity: 15, unit: 'g', category: 'Spices & Condiments' },
    ],
    instructions: [
      'Brown beef pieces in oil, add onions, tomatoes, and seasoning, then simmer for 1.5 hours.',
      'Bring water to a boil, slowly whisk in maize meal, cover, and steam on low heat for 35 minutes until fluffy and firm.',
      'Serve generous spoonfuls of pap topped with rich beef gravy.',
    ],
  },
];

class RecipeService {
  private recipes: Map<string, Recipe> = new Map();
  private initialized: boolean = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    const stored = await storageService.getAll<Recipe>(STORES.RECIPES);
    if (stored && stored.length > 0) {
      stored.forEach((r) => this.recipes.set(r.id, r));
    } else {
      // Seed with initial recipes
      for (const recipe of INITIAL_RECIPES) {
        this.recipes.set(recipe.id, recipe);
        await storageService.set(STORES.RECIPES, recipe);
      }
    }
    this.initialized = true;
  }

  async getAllRecipes(): Promise<Recipe[]> {
    await this.init();
    return Array.from(this.recipes.values());
  }

  async getRecipeById(id: string): Promise<Recipe | null> {
    await this.init();
    return this.recipes.get(id) || null;
  }

  async saveRecipe(recipe: Recipe): Promise<void> {
    await this.init();
    this.recipes.set(recipe.id, recipe);
    await storageService.set(STORES.RECIPES, recipe);
  }

  async deleteRecipe(id: string): Promise<void> {
    await this.init();
    this.recipes.delete(id);
    await storageService.remove(STORES.RECIPES, id);
  }

  async resetToDefaults(): Promise<void> {
    this.recipes.clear();
    for (const recipe of INITIAL_RECIPES) {
      this.recipes.set(recipe.id, recipe);
      await storageService.set(STORES.RECIPES, recipe);
    }
  }
}

export const recipeService = new RecipeService();
