import { MasterIngredient, MasterPriceUnit } from '../models/MasterIngredient';
import { IngredientCategory, StorageLocation } from '../models/IngredientInventory';
import { FoodGroup, classifyIngredientFoodGroup } from '../utils/iconHelper';
import { storageService, STORES } from './storageService';
import { findBestIngredientMatch } from '../utils/ingredientMatcher';

interface SeedCatalogEntry {
  id: string;
  name: string;
  aliases: string[];
  foodGroup: FoodGroup;
  category: IngredientCategory;
  defaultLocation: StorageLocation;
  defaultUnit: string;
  referencePriceZAR: number;
  priceUnit: MasterPriceUnit;
  avgGramsPerUnit?: number;
  avgMlPerUnit?: number;
}

const SEED_CATALOG: SeedCatalogEntry[] = [
  // --- Proteins (Meat, Poultry, Seafood, Eggs, Legumes, Nuts, Stocks) ---
  {
    id: 'cat-chicken-pieces',
    name: 'Chicken pieces',
    aliases: ['chicken', 'chicken portions', 'chicken thighs', 'chicken drumsticks'],
    foodGroup: 'proteins',
    category: 'Meat & Poultry',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 85.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-chicken-breast',
    name: 'Chicken breast fillets',
    aliases: ['chicken breast', 'chicken breasts', 'chicken fillet', 'chicken fillets'],
    foodGroup: 'proteins',
    category: 'Meat & Poultry',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 115.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 180,
  },
  {
    id: 'cat-whole-chicken',
    name: 'Whole fresh chicken',
    aliases: ['whole chicken', 'roast chicken'],
    foodGroup: 'proteins',
    category: 'Meat & Poultry',
    defaultLocation: 'Fridge',
    defaultUnit: 'kg',
    referencePriceZAR: 68.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 1300,
  },
  {
    id: 'cat-stewing-beef',
    name: 'Stewing beef chunks',
    aliases: ['beef stew pieces', 'stewing beef', 'beef cubes', 'beef chuck', 'beef'],
    foodGroup: 'proteins',
    category: 'Meat & Poultry',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 135.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-ground-beef',
    name: 'Ground beef (80/20)',
    aliases: ['ground beef', 'beef mince', 'minced beef', 'lean beef mince', 'mince'],
    foodGroup: 'proteins',
    category: 'Meat & Poultry',
    defaultLocation: 'Freezer',
    defaultUnit: 'g',
    referencePriceZAR: 98.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-pork-chops',
    name: 'Pork chops',
    aliases: ['pork', 'pork fillet', 'pork belly', 'pork tenderloin'],
    foodGroup: 'proteins',
    category: 'Meat & Poultry',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 105.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 180,
  },
  {
    id: 'cat-lamb-chops',
    name: 'Lamb chops',
    aliases: ['lamb', 'lamb shanks', 'lamb mince', 'lamb cubes'],
    foodGroup: 'proteins',
    category: 'Meat & Poultry',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 185.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-bacon',
    name: 'Bacon',
    aliases: ['streaky bacon', 'back bacon', 'smoked bacon', 'pancetta'],
    foodGroup: 'proteins',
    category: 'Meat & Poultry',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 148.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-salmon',
    name: 'Salmon fillets',
    aliases: ['salmon', 'fresh salmon', 'smoked salmon'],
    foodGroup: 'proteins',
    category: 'Meat & Poultry',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 340.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 160,
  },
  {
    id: 'cat-white-fish',
    name: 'White fish fillets',
    aliases: ['hake', 'cod', 'tilapia', 'kingklip', 'fish fillets', 'fish'],
    foodGroup: 'proteins',
    category: 'Meat & Poultry',
    defaultLocation: 'Freezer',
    defaultUnit: 'g',
    referencePriceZAR: 145.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 170,
  },
  {
    id: 'cat-prawns',
    name: 'Prawns',
    aliases: ['shrimp', 'king prawns', 'peeled prawns'],
    foodGroup: 'proteins',
    category: 'Meat & Poultry',
    defaultLocation: 'Freezer',
    defaultUnit: 'g',
    referencePriceZAR: 260.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-eggs',
    name: 'Free-range eggs',
    aliases: ['eggs', 'egg', 'large eggs', 'medium eggs', 'whole eggs'],
    foodGroup: 'proteins',
    category: 'Dairy & Eggs',
    defaultLocation: 'Fridge',
    defaultUnit: 'large',
    referencePriceZAR: 64.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 55,
  },
  {
    id: 'cat-tofu',
    name: 'Tofu',
    aliases: ['firm tofu', 'silken tofu', 'extra firm tofu'],
    foodGroup: 'proteins',
    category: 'Produce',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 110.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-chickpeas',
    name: 'Chickpeas',
    aliases: ['canned chickpeas', 'garbanzo beans'],
    foodGroup: 'proteins',
    category: 'Pantry',
    defaultLocation: 'Pantry',
    defaultUnit: 'g',
    referencePriceZAR: 48.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 400,
  },
  {
    id: 'cat-lentils',
    name: 'Lentils',
    aliases: ['red lentils', 'brown lentils', 'green lentils', 'cooked lentils'],
    foodGroup: 'proteins',
    category: 'Pantry',
    defaultLocation: 'Pantry',
    defaultUnit: 'g',
    referencePriceZAR: 52.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-beans',
    name: 'Black beans',
    aliases: ['kidney beans', 'cannellini beans', 'butter beans', 'baked beans'],
    foodGroup: 'proteins',
    category: 'Pantry',
    defaultLocation: 'Pantry',
    defaultUnit: 'g',
    referencePriceZAR: 46.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 400,
  },
  {
    id: 'cat-walnuts',
    name: 'Toasted walnuts',
    aliases: ['walnuts', 'almonds', 'pecans', 'cashews', 'mixed nuts', 'peanuts'],
    foodGroup: 'proteins',
    category: 'Pantry',
    defaultLocation: 'Pantry',
    defaultUnit: 'g',
    referencePriceZAR: 290.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-peanut-butter',
    name: 'Peanut butter',
    aliases: ['almond butter', 'cashew butter', 'tahini'],
    foodGroup: 'proteins',
    category: 'Pantry',
    defaultLocation: 'Pantry',
    defaultUnit: 'g',
    referencePriceZAR: 115.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-chia-seeds',
    name: 'Chia seeds',
    aliases: ['flax seeds', 'pumpkin seeds', 'sunflower seeds', 'sesame seeds'],
    foodGroup: 'proteins',
    category: 'Pantry',
    defaultLocation: 'Pantry',
    defaultUnit: 'g',
    referencePriceZAR: 180.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-beef-stock',
    name: 'Beef stock',
    aliases: ['chicken stock', 'vegetable stock', 'beef broth', 'chicken broth', 'broth'],
    foodGroup: 'proteins',
    category: 'Pantry',
    defaultLocation: 'Pantry',
    defaultUnit: 'ml',
    referencePriceZAR: 38.0,
    priceUnit: 'L',
  },
  {
    id: 'cat-beef-seasoning-stock',
    name: 'Beef seasoning stock',
    aliases: ['stock powder', 'stock cube', 'stock cubes', 'bouillon'],
    foodGroup: 'proteins',
    category: 'Spices & Condiments',
    defaultLocation: 'Spice Rack',
    defaultUnit: 'g',
    referencePriceZAR: 140.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 10,
  },

  // --- Dairy ---
  {
    id: 'cat-milk',
    name: 'Milk',
    aliases: ['whole milk', 'full cream milk', 'skim milk', 'milk or oat milk', 'oat milk'],
    foodGroup: 'dairy',
    category: 'Dairy & Eggs',
    defaultLocation: 'Fridge',
    defaultUnit: 'ml',
    referencePriceZAR: 18.5,
    priceUnit: 'L',
  },
  {
    id: 'cat-cheddar',
    name: 'Cheddar cheese',
    aliases: ['cheddar', 'mature cheddar', 'cheddar cheese slices', 'cheese slices', 'mozzarella', 'grated cheese', 'cheese'],
    foodGroup: 'dairy',
    category: 'Dairy & Eggs',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 165.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 22,
  },
  {
    id: 'cat-parmesan',
    name: 'Parmesan cheese',
    aliases: ['parmesan', 'parmigiano', 'pecorino'],
    foodGroup: 'dairy',
    category: 'Dairy & Eggs',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 360.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-feta',
    name: 'Feta cheese',
    aliases: ['feta'],
    foodGroup: 'dairy',
    category: 'Dairy & Eggs',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 185.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-greek-yogurt',
    name: 'Greek yogurt (plain)',
    aliases: ['greek yogurt', 'plain yogurt', 'yogurt', 'yoghurt'],
    foodGroup: 'dairy',
    category: 'Dairy & Eggs',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 68.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-cream',
    name: 'Heavy cream',
    aliases: ['cream', 'whipping cream', 'pouring cream', 'sour cream', 'fresh cream'],
    foodGroup: 'dairy',
    category: 'Dairy & Eggs',
    defaultLocation: 'Fridge',
    defaultUnit: 'ml',
    referencePriceZAR: 78.0,
    priceUnit: 'L',
  },
  {
    id: 'cat-coconut-milk',
    name: 'Coconut milk',
    aliases: ['coconut cream', 'canned coconut milk'],
    foodGroup: 'dairy',
    category: 'Pantry',
    defaultLocation: 'Pantry',
    defaultUnit: 'ml',
    referencePriceZAR: 62.0,
    priceUnit: 'L',
    avgMlPerUnit: 400,
  },

  // --- Fats & Oils ---
  {
    id: 'cat-cooking-oil',
    name: 'Cooking oil',
    aliases: ['sunflower oil', 'canola oil', 'vegetable oil'],
    foodGroup: 'fats-and-oils',
    category: 'Pantry',
    defaultLocation: 'Pantry',
    defaultUnit: 'ml',
    referencePriceZAR: 38.0,
    priceUnit: 'L',
  },
  {
    id: 'cat-olive-oil',
    name: 'Olive oil',
    aliases: ['extra virgin olive oil'],
    foodGroup: 'fats-and-oils',
    category: 'Pantry',
    defaultLocation: 'Pantry',
    defaultUnit: 'ml',
    referencePriceZAR: 195.0,
    priceUnit: 'L',
  },
  {
    id: 'cat-butter',
    name: 'Butter',
    aliases: ['salted butter', 'unsalted butter'],
    foodGroup: 'fats-and-oils',
    category: 'Dairy & Eggs',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 130.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-cream-cheese',
    name: 'Cream cheese',
    aliases: ['mascarpone', 'ricotta'],
    foodGroup: 'fats-and-oils',
    category: 'Dairy & Eggs',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 175.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-avocado',
    name: 'Avocado',
    aliases: ['avocados', 'avo'],
    foodGroup: 'fats-and-oils',
    category: 'Produce',
    defaultLocation: 'Counter',
    defaultUnit: 'pieces',
    referencePriceZAR: 95.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 170,
  },

  // --- Carbohydrates (Grains, Flour, Pasta, Bread, Potatoes, Sweeteners) ---
  {
    id: 'cat-rice',
    name: 'Rice',
    aliases: ['white rice', 'basmati rice', 'jasmine rice', 'brown rice', 'long grain rice'],
    foodGroup: 'carbohydrates',
    category: 'Pantry',
    defaultLocation: 'Pantry',
    defaultUnit: 'g',
    referencePriceZAR: 26.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-rolled-oats',
    name: 'Rolled oats',
    aliases: ['oats', 'oatmeal', 'porridge oats'],
    foodGroup: 'carbohydrates',
    category: 'Pantry',
    defaultLocation: 'Pantry',
    defaultUnit: 'g',
    referencePriceZAR: 44.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-flour',
    name: 'All-purpose flour',
    aliases: ['flour', 'cake flour', 'wheat flour', 'bread flour', 'plain flour', 'self-raising flour'],
    foodGroup: 'carbohydrates',
    category: 'Pantry',
    defaultLocation: 'Pantry',
    defaultUnit: 'g',
    referencePriceZAR: 22.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-pasta',
    name: 'Penne pasta',
    aliases: ['pasta', 'spaghetti', 'macaroni', 'fusilli', 'linguine', 'fettuccine', 'lasagna sheets'],
    foodGroup: 'carbohydrates',
    category: 'Pantry',
    defaultLocation: 'Pantry',
    defaultUnit: 'g',
    referencePriceZAR: 46.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-quinoa',
    name: 'Quinoa',
    aliases: ['couscous', 'bulgur wheat', 'barley'],
    foodGroup: 'carbohydrates',
    category: 'Pantry',
    defaultLocation: 'Pantry',
    defaultUnit: 'g',
    referencePriceZAR: 115.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-maize-meal',
    name: 'Coarse maize meal (pap)',
    aliases: ['maize meal', 'pap', 'cornmeal', 'polenta'],
    foodGroup: 'carbohydrates',
    category: 'Pantry',
    defaultLocation: 'Pantry',
    defaultUnit: 'g',
    referencePriceZAR: 17.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-brioche-buns',
    name: 'Brioche burger buns',
    aliases: ['brioche sandwich buns', 'burger buns', 'brioche buns', 'bread rolls'],
    foodGroup: 'carbohydrates',
    category: 'Bakery',
    defaultLocation: 'Counter',
    defaultUnit: 'pieces',
    referencePriceZAR: 130.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 65,
  },
  {
    id: 'cat-sliced-brioche',
    name: 'Thick sliced brioche',
    aliases: ['brioche', 'sliced bread', 'sourdough', 'white bread', 'brown bread', 'bread slices'],
    foodGroup: 'carbohydrates',
    category: 'Bakery',
    defaultLocation: 'Counter',
    defaultUnit: 'slices',
    referencePriceZAR: 75.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 40,
  },
  {
    id: 'cat-muffins',
    name: 'Blueberry bran muffins',
    aliases: ['bran muffins', 'blueberry muffins', 'muffins'],
    foodGroup: 'carbohydrates',
    category: 'Bakery',
    defaultLocation: 'Counter',
    defaultUnit: 'pieces',
    referencePriceZAR: 110.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 85,
  },
  {
    id: 'cat-potatoes',
    name: 'Potatoes',
    aliases: ['potato', 'baby potatoes', 'baking potatoes'],
    foodGroup: 'carbohydrates',
    category: 'Produce',
    defaultLocation: 'Pantry',
    defaultUnit: 'g',
    referencePriceZAR: 19.5,
    priceUnit: 'kg',
    avgGramsPerUnit: 150,
  },
  {
    id: 'cat-sweet-potatoes',
    name: 'Sweet potatoes',
    aliases: ['sweet potato'],
    foodGroup: 'carbohydrates',
    category: 'Produce',
    defaultLocation: 'Pantry',
    defaultUnit: 'g',
    referencePriceZAR: 28.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 200,
  },
  {
    id: 'cat-sugar',
    name: 'Sugar',
    aliases: ['white sugar', 'brown sugar', 'caster sugar', 'icing sugar'],
    foodGroup: 'carbohydrates',
    category: 'Pantry',
    defaultLocation: 'Pantry',
    defaultUnit: 'g',
    referencePriceZAR: 28.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-honey',
    name: 'Honey',
    aliases: ['raw honey', 'clear honey'],
    foodGroup: 'carbohydrates',
    category: 'Pantry',
    defaultLocation: 'Pantry',
    defaultUnit: 'ml',
    referencePriceZAR: 165.0,
    priceUnit: 'L',
  },
  {
    id: 'cat-maple-syrup',
    name: 'Maple syrup',
    aliases: ['pure maple syrup', 'golden syrup'],
    foodGroup: 'carbohydrates',
    category: 'Pantry',
    defaultLocation: 'Pantry',
    defaultUnit: 'ml',
    referencePriceZAR: 240.0,
    priceUnit: 'L',
  },
  {
    id: 'cat-baking-powder',
    name: 'Baking powder',
    aliases: ['baking soda', 'bicarbonate of soda', 'yeast'],
    foodGroup: 'carbohydrates',
    category: 'Pantry',
    defaultLocation: 'Pantry',
    defaultUnit: 'g',
    referencePriceZAR: 95.0,
    priceUnit: 'kg',
  },

  // --- Vegetables, Herbs & Condiments ---
  {
    id: 'cat-carrots',
    name: 'Carrots',
    aliases: ['carrot'],
    foodGroup: 'vegetables',
    category: 'Produce',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 18.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 75,
  },
  {
    id: 'cat-onion',
    name: 'Onion',
    aliases: ['onions', 'brown onion', 'red onion', 'white onion', 'yellow onion', 'shallots'],
    foodGroup: 'vegetables',
    category: 'Produce',
    defaultLocation: 'Pantry',
    defaultUnit: 'medium',
    referencePriceZAR: 28.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 120,
  },
  {
    id: 'cat-garlic-cloves',
    name: 'Garlic cloves',
    aliases: ['garlic', 'garlic clove', 'minced garlic'],
    foodGroup: 'vegetables',
    category: 'Produce',
    defaultLocation: 'Pantry',
    defaultUnit: 'cloves',
    referencePriceZAR: 140.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 5,
  },
  {
    id: 'cat-garlic-head',
    name: 'Garlic head',
    aliases: ['garlic bulb', 'whole garlic'],
    foodGroup: 'vegetables',
    category: 'Produce',
    defaultLocation: 'Pantry',
    defaultUnit: 'whole',
    referencePriceZAR: 140.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 50,
  },
  {
    id: 'cat-tomatoes',
    name: 'Cherry tomatoes',
    aliases: ['ripe tomatoes', 'tomatoes', 'tomato', 'plum tomatoes', 'roma tomatoes'],
    foodGroup: 'vegetables',
    category: 'Produce',
    defaultLocation: 'Counter',
    defaultUnit: 'g',
    referencePriceZAR: 36.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 120,
  },
  {
    id: 'cat-tomato-relish',
    name: 'Tomato & onion relish',
    aliases: ['tomato relish', 'tomato paste', 'canned tomatoes', 'chopped tomatoes', 'passata'],
    foodGroup: 'vegetables',
    category: 'Pantry',
    defaultLocation: 'Pantry',
    defaultUnit: 'g',
    referencePriceZAR: 42.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 400,
  },
  {
    id: 'cat-asparagus',
    name: 'Fresh asparagus',
    aliases: ['asparagus', 'asparagus spears'],
    foodGroup: 'vegetables',
    category: 'Produce',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 195.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-zucchini',
    name: 'Zucchini',
    aliases: ['courgette', 'courgettes', 'baby marrow', 'baby marrows'],
    foodGroup: 'vegetables',
    category: 'Produce',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 38.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 180,
  },
  {
    id: 'cat-arugula',
    name: 'Baby arugula/rocket',
    aliases: ['arugula', 'rocket', 'wild rocket'],
    foodGroup: 'vegetables',
    category: 'Produce',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 220.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-lettuce',
    name: 'Crisp lettuce',
    aliases: ['lettuce', 'cos lettuce', 'iceberg lettuce', 'mixed greens', 'salad greens'],
    foodGroup: 'vegetables',
    category: 'Produce',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 65.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 300,
  },
  {
    id: 'cat-spinach',
    name: 'Spinach',
    aliases: ['baby spinach', 'swiss chard', 'kale'],
    foodGroup: 'vegetables',
    category: 'Produce',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 75.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-broccoli',
    name: 'Broccoli',
    aliases: ['broccoli florets', 'broccolini'],
    foodGroup: 'vegetables',
    category: 'Produce',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 58.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 350,
  },
  {
    id: 'cat-cauliflower',
    name: 'Cauliflower',
    aliases: ['cauliflower florets'],
    foodGroup: 'vegetables',
    category: 'Produce',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 48.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-bell-pepper',
    name: 'Bell pepper',
    aliases: ['red bell pepper', 'green pepper', 'yellow pepper', 'peppers', 'capsicum'],
    foodGroup: 'vegetables',
    category: 'Produce',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 68.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 150,
  },
  {
    id: 'cat-mushrooms',
    name: 'Mushrooms',
    aliases: ['button mushrooms', 'portobello mushrooms', 'brown mushrooms'],
    foodGroup: 'vegetables',
    category: 'Produce',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 95.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-chives',
    name: 'Fresh chives',
    aliases: ['chives', 'spring onion', 'scallions', 'green onions'],
    foodGroup: 'vegetables',
    category: 'Produce',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 280.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-fresh-herbs',
    name: 'Fresh rosemary',
    aliases: ['rosemary', 'fresh thyme & rosemary', 'thyme', 'fresh parsley', 'parsley', 'basil', 'fresh basil', 'coriander', 'cilantro', 'fresh herbs'],
    foodGroup: 'vegetables',
    category: 'Produce',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 280.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-salt',
    name: 'Salt',
    aliases: ['sea salt', 'table salt', 'kosher salt'],
    foodGroup: 'vegetables',
    category: 'Spices & Condiments',
    defaultLocation: 'Spice Rack',
    defaultUnit: 'g',
    referencePriceZAR: 16.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-pepper',
    name: 'Cracked pepper',
    aliases: ['black pepper', 'ground black pepper', 'pepper'],
    foodGroup: 'vegetables',
    category: 'Spices & Condiments',
    defaultLocation: 'Spice Rack',
    defaultUnit: 'g',
    referencePriceZAR: 240.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-soy-sauce',
    name: 'Soy sauce',
    aliases: ['tamari', 'worcestershire sauce'],
    foodGroup: 'vegetables',
    category: 'Spices & Condiments',
    defaultLocation: 'Pantry',
    defaultUnit: 'ml',
    referencePriceZAR: 95.0,
    priceUnit: 'L',
  },
  {
    id: 'cat-vinegar',
    name: 'Vinegar',
    aliases: ['balsamic vinegar', 'apple cider vinegar', 'red wine vinegar', 'white vinegar'],
    foodGroup: 'vegetables',
    category: 'Spices & Condiments',
    defaultLocation: 'Pantry',
    defaultUnit: 'ml',
    referencePriceZAR: 68.0,
    priceUnit: 'L',
  },

  // --- Fruit ---
  {
    id: 'cat-berries',
    name: 'Fresh berries',
    aliases: ['berries', 'blueberries', 'strawberries', 'raspberries', 'blackberries & compote', 'blackberries'],
    foodGroup: 'fruit',
    category: 'Produce',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 140.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-lemon',
    name: 'Fresh lemon',
    aliases: ['lemon', 'lemons', 'lime', 'limes', 'lemon juice'],
    foodGroup: 'fruit',
    category: 'Produce',
    defaultLocation: 'Counter',
    defaultUnit: 'whole',
    referencePriceZAR: 38.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 85,
  },
  {
    id: 'cat-melon',
    name: 'Fresh melon & berries',
    aliases: ['melon', 'watermelon', 'mixed fruit', 'fruit salad'],
    foodGroup: 'fruit',
    category: 'Produce',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 48.0,
    priceUnit: 'kg',
  },
  {
    id: 'cat-juice',
    name: 'Freshly squeezed juice',
    aliases: ['orange juice', 'apple juice', 'fruit juice'],
    foodGroup: 'fruit',
    category: 'Produce',
    defaultLocation: 'Fridge',
    defaultUnit: 'ml',
    referencePriceZAR: 42.0,
    priceUnit: 'L',
  },
  {
    id: 'cat-bananas',
    name: 'Bananas',
    aliases: ['banana'],
    foodGroup: 'fruit',
    category: 'Produce',
    defaultLocation: 'Counter',
    defaultUnit: 'pieces',
    referencePriceZAR: 26.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 120,
  },
  {
    id: 'cat-apples',
    name: 'Apples',
    aliases: ['apple', 'green apple', 'red apple'],
    foodGroup: 'fruit',
    category: 'Produce',
    defaultLocation: 'Counter',
    defaultUnit: 'pieces',
    referencePriceZAR: 29.0,
    priceUnit: 'kg',
    avgGramsPerUnit: 160,
  },
];

class IngredientCatalogService {
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  private itemsMap: Map<string, MasterIngredient> = new Map();

  async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const stored = await storageService.getAll<MasterIngredient>(STORES.INGREDIENT_CATALOG);
      if (stored && stored.length > 0) {
        for (const item of stored) {
          this.itemsMap.set(item.id, item);
        }

        // Add any newly added seed entries that don't yet exist in user's stored catalog
        const now = new Date().toISOString();
        for (const seed of SEED_CATALOG) {
          if (!this.itemsMap.has(seed.id)) {
            const full: MasterIngredient = { ...seed, updatedAt: now };
            this.itemsMap.set(full.id, full);
            await storageService.set(STORES.INGREDIENT_CATALOG, full);
          }
        }
      } else {
        const now = new Date().toISOString();
        for (const seed of SEED_CATALOG) {
          const full: MasterIngredient = { ...seed, updatedAt: now };
          this.itemsMap.set(full.id, full);
          await storageService.set(STORES.INGREDIENT_CATALOG, full);
        }
      }

      this.initialized = true;
    })();

    return this.initPromise;
  }

  getLoadedCatalog(): MasterIngredient[] {
    return Array.from(this.itemsMap.values());
  }

  async getAllCatalogItems(): Promise<MasterIngredient[]> {
    await this.init();
    return Array.from(this.itemsMap.values());
  }

  findCatalogItem(name: string): MasterIngredient | null {
    return findBestIngredientMatch(name, this.getLoadedCatalog());
  }

  async updateCatalogItem(
    id: string,
    updates: Partial<
      Pick<
        MasterIngredient,
        'name' | 'referencePriceZAR' | 'priceUnit' | 'avgGramsPerUnit' | 'avgMlPerUnit' | 'foodGroup' | 'category' | 'defaultLocation' | 'aliases'
      >
    >
  ): Promise<MasterIngredient | null> {
    await this.init();
    const existing = this.itemsMap.get(id);
    if (!existing) return null;

    const updated: MasterIngredient = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.itemsMap.set(id, updated);
    await storageService.set(STORES.INGREDIENT_CATALOG, updated);
    return updated;
  }

  async addCatalogItem(params: {
    name: string;
    referencePriceZAR: number;
    priceUnit: MasterPriceUnit;
    avgGramsPerUnit?: number;
    category?: IngredientCategory;
    defaultLocation?: StorageLocation;
    defaultUnit?: string;
    aliases?: string[];
  }): Promise<MasterIngredient> {
    await this.init();
    const cleanName = params.name.trim();
    const id = `cat-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const category = params.category || 'Pantry';
    const item: MasterIngredient = {
      id,
      name: cleanName,
      aliases: params.aliases || [],
      foodGroup: classifyIngredientFoodGroup(cleanName, category),
      category,
      defaultLocation: params.defaultLocation || 'Pantry',
      defaultUnit: params.defaultUnit || (params.priceUnit === 'L' || params.priceUnit === 'ml' ? 'ml' : 'g'),
      referencePriceZAR: Math.max(0, params.referencePriceZAR),
      priceUnit: params.priceUnit,
      avgGramsPerUnit: params.avgGramsPerUnit && params.avgGramsPerUnit > 0 ? params.avgGramsPerUnit : undefined,
      updatedAt: new Date().toISOString(),
    };

    this.itemsMap.set(id, item);
    await storageService.set(STORES.INGREDIENT_CATALOG, item);
    return item;
  }

  async deleteCatalogItem(id: string): Promise<void> {
    await this.init();
    this.itemsMap.delete(id);
    await storageService.remove(STORES.INGREDIENT_CATALOG, id);
  }

  async resetToDefaults(): Promise<void> {
    const existingKeys = Array.from(this.itemsMap.keys());
    for (const key of existingKeys) {
      await storageService.remove(STORES.INGREDIENT_CATALOG, key);
    }
    this.itemsMap.clear();
    const now = new Date().toISOString();
    for (const seed of SEED_CATALOG) {
      const full: MasterIngredient = { ...seed, updatedAt: now };
      this.itemsMap.set(full.id, full);
      await storageService.set(STORES.INGREDIENT_CATALOG, full);
    }
    this.initialized = true;
  }
}

export const ingredientCatalogService = new IngredientCatalogService();
