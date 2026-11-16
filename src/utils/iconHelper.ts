/**
 * Clean SVG icons matching Lucide icon aesthetics for vanilla TypeScript.
 */

export function getIconSvg(name: string, className: string = 'w-5 h-5'): string {
  switch (name) {
    case 'chef-hat':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/>
        <line x1="6" y1="17" x2="18" y2="17"/>
      </svg>`;

    case 'calendar':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
        <line x1="16" x2="16" y1="2" y2="6"/>
        <line x1="8" x2="8" y1="2" y2="6"/>
        <line x1="3" x2="21" y1="10" y2="10"/>
      </svg>`;

    case 'book-open':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>`;

    case 'package':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m7.5 4.27 9 5.15"/>
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
        <path d="m3.3 7 8.7 5 8.7-5"/>
        <path d="M12 22V12"/>
      </svg>`;

    case 'shopping-cart':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="8" cy="21" r="1"/>
        <circle cx="19" cy="21" r="1"/>
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
      </svg>`;

    case 'settings':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>`;

    case 'sun':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v2"/>
        <path d="M12 20v2"/>
        <path d="m4.93 4.93 1.41 1.41"/>
        <path d="m17.66 17.66 1.41 1.41"/>
        <path d="M2 12h2"/>
        <path d="M20 12h2"/>
        <path d="m6.34 17.66-1.41 1.41"/>
        <path d="m19.07 4.93-1.41 1.41"/>
      </svg>`;

    case 'moon':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
      </svg>`;

    case 'chevron-left':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m15 18-6-6 6-6"/>
      </svg>`;

    case 'chevron-right':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m9 18 6-6-6-6"/>
      </svg>`;

    case 'chevron-down':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m6 9 6 6 6-6"/>
      </svg>`;

    case 'user':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="8.5" r="4"/>
        <path d="M5.5 20.5a6.5 6.5 0 0 1 13 0Z"/>
      </svg>`;

    case 'chart-bar':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" x2="12" y1="20" y2="10"/>
        <line x1="18" x2="18" y1="20" y2="4"/>
        <line x1="6" x2="6" y1="20" y2="16"/>
      </svg>`;

    case 'utensils':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/>
        <path d="M15 2v20"/>
        <path d="M6 2v20"/>
        <path d="M9 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/>
      </svg>`;

    case 'sprout':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7 20h10"/>
        <path d="M10 20c5.5-2.5.8-6.4 3-10"/>
        <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/>
        <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>
      </svg>`;

    case 'x':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18"/>
        <path d="m6 6 12 12"/>
      </svg>`;

    case 'edit':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
        <path d="m15 5 4 4"/>
      </svg>`;

    case 'trash':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 6h18"/>
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
      </svg>`;

    case 'download':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" x2="12" y1="15" y2="3"/>
      </svg>`;

    case 'plus':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>`;

    case 'minus':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>`;

    case 'check':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>`;

    case 'check-circle':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>`;

    case 'alert-triangle':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>`;

    case 'rotate-ccw':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
      </svg>`;

    case 'history':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
        <path d="M12 7v5l4 2"/>
      </svg>`;

    case 'flame':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
      </svg>`;

    case 'arrow-up-down':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m21 16-4 4-4-4"/>
        <path d="M17 20V4"/>
        <path d="m3 8 4-4 4 4"/>
        <path d="M7 4v16"/>
      </svg>`;

    case 'chart-bar-filled':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="13" width="3.8" height="7" rx="1.6" fill="#E89B48"/>
        <rect x="10.1" y="8.5" width="3.8" height="11.5" rx="1.6" fill="#DF8E38"/>
        <rect x="16.2" y="4" width="3.8" height="16" rx="1.6" fill="#CE7E28"/>
      </svg>`;

    case 'leaf-filled':
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none">
        <path d="M19.5 4.5C12.5 4.5 6.5 8.2 5.2 14.8c-.4 2 .4 3.5 1.9 4.2 1.7.8 4.2.5 6.5-.8 4.6-2.6 6.4-8.1 5.9-13.7Z" fill="#63A342"/>
        <path d="M5 20c3.2-3.4 7.4-6.8 12.2-10.2" stroke="#DDF0D2" stroke-width="1.6" stroke-linecap="round"/>
      </svg>`;

    default:
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
  }
}

export type FoodGroup =
  | 'fruit'
  | 'vegetables'
  | 'dairy'
  | 'fats-and-oils'
  | 'carbohydrates'
  | 'proteins';

const FOOD_GROUP_LABELS: Record<FoodGroup, string> = {
  fruit: 'Fruit',
  vegetables: 'Vegetables',
  dairy: 'Dairy',
  'fats-and-oils': 'Fats & Oils',
  carbohydrates: 'Carbohydrates',
  proteins: 'Proteins',
};

/**
 * Classifies an ingredient into one of the six food-pyramid groups.
 */
export function classifyIngredientFoodGroup(name: string, category?: string): FoodGroup {
  const lower = name.toLowerCase();

  // Dairy-milk exceptions before checking "butter"
  if (lower.includes('buttermilk')) {
    return 'dairy';
  }

  // Nut/seed butters belong to Proteins rather than Fats & Oils
  if (
    lower.includes('peanut butter') ||
    lower.includes('almond butter') ||
    lower.includes('cashew butter') ||
    lower.includes('tahini')
  ) {
    return 'proteins';
  }

  // 1. Fats & Oils
  if (
    lower.includes('oil') ||
    lower.includes('butter') ||
    lower.includes('margarine') ||
    lower.includes('ghee') ||
    lower.includes('lard') ||
    lower.includes('mayo') ||
    lower.includes('mayonnaise') ||
    lower.includes('shortening') ||
    lower.includes('avocado') ||
    lower.includes('cream cheese')
  ) {
    return 'fats-and-oils';
  }

  // 2. Dairy
  if (
    lower.includes('milk') ||
    lower.includes('yogurt') ||
    lower.includes('yoghurt') ||
    lower.includes('cheese') ||
    lower.includes('cheddar') ||
    lower.includes('parmesan') ||
    lower.includes('mozzarella') ||
    lower.includes('feta') ||
    lower.includes('ricotta') ||
    lower.includes('cream') ||
    lower.includes('kefir') ||
    lower.includes('whey')
  ) {
    return 'dairy';
  }

  // 3. Proteins (meat, poultry, fish, eggs, legumes, nuts, seeds, meat stocks)
  if (
    lower.includes('chicken') ||
    lower.includes('beef') ||
    lower.includes('steak') ||
    lower.includes('pork') ||
    lower.includes('lamb') ||
    lower.includes('mutton') ||
    lower.includes('turkey') ||
    lower.includes('duck') ||
    lower.includes('bacon') ||
    lower.includes('ham') ||
    lower.includes('sausage') ||
    lower.includes('mince') ||
    lower.includes('meat') ||
    lower.includes('poultry') ||
    lower.includes('fish') ||
    lower.includes('salmon') ||
    lower.includes('tuna') ||
    lower.includes('cod') ||
    lower.includes('hake') ||
    lower.includes('trout') ||
    lower.includes('shrimp') ||
    lower.includes('prawn') ||
    lower.includes('seafood') ||
    lower.includes('egg') ||
    lower.includes('tofu') ||
    lower.includes('tempeh') ||
    lower.includes('lentil') ||
    lower.includes('chickpea') ||
    (lower.includes('bean') && !lower.includes('green bean')) ||
    lower.includes('walnut') ||
    lower.includes('almond') ||
    lower.includes('peanut') ||
    lower.includes('cashew') ||
    lower.includes('pecan') ||
    lower.includes('chia') ||
    lower.includes('flax') ||
    lower.includes('seed') ||
    lower.includes('protein') ||
    lower.includes('stock') ||
    lower.includes('broth')
  ) {
    return 'proteins';
  }

  // 4. Carbohydrates (check baked goods, grains, and starchy staples before fruit flavors like "blueberry muffin")
  if (
    lower.includes('rice') ||
    lower.includes('oat') ||
    lower.includes('wheat') ||
    lower.includes('flour') ||
    lower.includes('pasta') ||
    lower.includes('penne') ||
    lower.includes('spaghetti') ||
    lower.includes('macaroni') ||
    lower.includes('noodle') ||
    lower.includes('bread') ||
    lower.includes('brioche') ||
    lower.includes('bun') ||
    lower.includes('muffin') ||
    lower.includes('toast') ||
    lower.includes('bagel') ||
    lower.includes('croissant') ||
    lower.includes('tortilla') ||
    lower.includes('wrap') ||
    lower.includes('pita') ||
    lower.includes('couscous') ||
    lower.includes('quinoa') ||
    lower.includes('barley') ||
    lower.includes('pap') ||
    lower.includes('maize') ||
    lower.includes('cornmeal') ||
    lower.includes('cereal') ||
    lower.includes('granola') ||
    lower.includes('cracker') ||
    lower.includes('potato') ||
    lower.includes('yam') ||
    lower.includes('sugar') ||
    lower.includes('honey') ||
    lower.includes('syrup') ||
    lower.includes('maple') ||
    lower.includes('baking powder') ||
    lower.includes('yeast')
  ) {
    return 'carbohydrates';
  }

  // 5. Fruit
  if (
    lower.includes('berr') ||
    lower.includes('apple') ||
    lower.includes('banana') ||
    lower.includes('orange') ||
    lower.includes('lemon') ||
    lower.includes('lime') ||
    lower.includes('citrus') ||
    lower.includes('melon') ||
    lower.includes('grape') ||
    lower.includes('peach') ||
    lower.includes('pear') ||
    lower.includes('plum') ||
    lower.includes('mango') ||
    lower.includes('pineapple') ||
    lower.includes('kiwi') ||
    lower.includes('fig') ||
    lower.includes('date') ||
    lower.includes('raisin') ||
    lower.includes('cherr') ||
    lower.includes('apricot') ||
    lower.includes('compote') ||
    lower.includes('fruit') ||
    lower.includes('juice')
  ) {
    return 'fruit';
  }

  // 6. Vegetables (greens, root veg, culinary herbs & plant seasonings)
  if (
    lower.includes('carrot') ||
    lower.includes('onion') ||
    lower.includes('garlic') ||
    lower.includes('shallot') ||
    lower.includes('leek') ||
    lower.includes('tomato') ||
    lower.includes('asparagus') ||
    lower.includes('zucchini') ||
    lower.includes('courgette') ||
    lower.includes('cucumber') ||
    lower.includes('lettuce') ||
    lower.includes('spinach') ||
    lower.includes('kale') ||
    lower.includes('arugula') ||
    lower.includes('rocket') ||
    lower.includes('cabbage') ||
    lower.includes('broccoli') ||
    lower.includes('cauliflower') ||
    lower.includes('pepper') ||
    lower.includes('chilli') ||
    lower.includes('chili') ||
    lower.includes('celery') ||
    lower.includes('mushroom') ||
    lower.includes('pea') ||
    lower.includes('green bean') ||
    lower.includes('eggplant') ||
    lower.includes('aubergine') ||
    lower.includes('beet') ||
    lower.includes('radish') ||
    lower.includes('squash') ||
    lower.includes('pumpkin') ||
    lower.includes('relish') ||
    lower.includes('chive') ||
    lower.includes('rosemary') ||
    lower.includes('thyme') ||
    lower.includes('basil') ||
    lower.includes('parsley') ||
    lower.includes('cilantro') ||
    lower.includes('coriander') ||
    lower.includes('mint') ||
    lower.includes('oregano') ||
    lower.includes('herb') ||
    lower.includes('salt') ||
    lower.includes('spice') ||
    lower.includes('seasoning')
  ) {
    return 'vegetables';
  }

  // Category fallbacks
  if (category === 'Meat & Poultry') return 'proteins';
  if (category === 'Dairy & Eggs') return 'dairy';
  if (category === 'Bakery' || category === 'Pantry') return 'carbohydrates';
  if (category === 'Produce' || category === 'Spices & Condiments') return 'vegetables';

  return 'carbohydrates';
}

/**
 * Food-pyramid food-group icons (Fruit, Vegetables, Dairy, Fats & Oils, Carbohydrates, Proteins)
 * for ingredient rows across RecipePanel, IngredientsPage, and ShoppingListPage.
 */
export function getIngredientMiniIconSvg(name: string, category?: string): string {
  const group = classifyIngredientFoodGroup(name, category);
  const label = FOOD_GROUP_LABELS[group];

  switch (group) {
    case 'fruit':
      // Ruby apple icon representing Fruit
      return `<svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" role="img" aria-label="${label}">
        <title>${label}</title>
        <path d="M12 7.5c.3-1.4 1.1-2.5 2.4-3" stroke="#7A5230" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M12.2 6.8c1.4-1.3 3.2-1.5 4.3-.6-.6 1.6-2.3 2.1-4.3.6Z" fill="#5E9C42"/>
        <path d="M12 8.2c-1.8-1-4.8-.6-5.7 2.1-1 3.1.8 8.3 3.6 9 .9.2 1.5-.3 2.1-.3s1.2.5 2.1.3c2.8-.7 4.6-5.9 3.6-9-.9-2.7-3.9-3.1-5.7-2.1Z" fill="#DD4E52"/>
        <path d="M8.7 10.6c-.4.9-.5 2-.2 3.1" stroke="#F8B0B2" stroke-width="1.3" stroke-linecap="round"/>
      </svg>`;

    case 'vegetables':
      // Fresh leafy garden broccoli/greens icon representing Vegetables
      return `<svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" role="img" aria-label="${label}">
        <title>${label}</title>
        <path d="M10.4 13.8h3.2l-.5 5.4a1.1 1.1 0 0 1-2.2 0l-.5-5.4Z" fill="#8CC46A"/>
        <circle cx="8.4" cy="10.8" r="3.3" fill="#52963E"/>
        <circle cx="15.6" cy="10.8" r="3.3" fill="#52963E"/>
        <circle cx="12" cy="8.2" r="3.8" fill="#63AA4B"/>
        <path d="M10.6 7.5c.7-.6 1.8-.7 2.6-.3" stroke="#BCE4AA" stroke-width="1.2" stroke-linecap="round"/>
      </svg>`;

    case 'dairy':
      // Milk carton & cheese wedge representing Dairy
      return `<svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" role="img" aria-label="${label}">
        <title>${label}</title>
        <path d="M6.5 9.2 8.2 5.5h5.2l1.7 3.7v9.3a1 1 0 0 1-1 1H7.5a1 1 0 0 1-1-1V9.2Z" fill="#FAF6EE" stroke="#CFC4B4" stroke-width="1"/>
        <rect x="7" y="11" width="7.6" height="4" fill="#CBE0EE"/>
        <path d="M12.2 19.2h7.6v-4.1c0-.4-.3-.8-.7-.9l-4.2-1.4-2.7 3.2v3.2Z" fill="#F2C65A" stroke="#D39D2E" stroke-width="0.9" stroke-linejoin="round"/>
        <circle cx="15.4" cy="16.9" r="0.8" fill="#D39D2E"/>
        <circle cx="17.8" cy="17.6" r="0.6" fill="#D39D2E"/>
      </svg>`;

    case 'fats-and-oils':
      // Golden amber oil droplet representing Fats & Oils
      return `<svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" role="img" aria-label="${label}">
        <title>${label}</title>
        <path d="M12 3.8C9.8 7.2 6.5 11.2 6.5 14.5a5.5 5.5 0 0 0 11 0c0-3.3-3.3-7.3-5.5-10.7Z" fill="#E8A628" stroke="#C58214" stroke-width="1"/>
        <path d="M9.6 13.2a2.6 2.6 0 0 0 2.1 3.7" stroke="#FFF3C4" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`;

    case 'carbohydrates':
      // Golden wheat grain stalk representing Carbohydrates
      return `<svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" role="img" aria-label="${label}">
        <title>${label}</title>
        <path d="M6.5 19.5 16.8 6.8" stroke="#B67E32" stroke-width="1.4" stroke-linecap="round"/>
        <ellipse cx="15.8" cy="6.6" rx="1.6" ry="2.6" transform="rotate(38 15.8 6.6)" fill="#E6B25E"/>
        <ellipse cx="12.6" cy="8.2" rx="1.5" ry="2.5" transform="rotate(-12 12.6 8.2)" fill="#DBA048"/>
        <ellipse cx="15.6" cy="10.8" rx="1.5" ry="2.5" transform="rotate(75 15.6 10.8)" fill="#E6B25E"/>
        <ellipse cx="10.2" cy="11.2" rx="1.5" ry="2.5" transform="rotate(-12 10.2 11.2)" fill="#DBA048"/>
        <ellipse cx="13.2" cy="13.8" rx="1.5" ry="2.5" transform="rotate(75 13.2 13.8)" fill="#E6B25E"/>
        <ellipse cx="8" cy="14.2" rx="1.4" ry="2.3" transform="rotate(-12 8 14.2)" fill="#DBA048"/>
        <ellipse cx="10.8" cy="16.6" rx="1.4" ry="2.3" transform="rotate(75 10.8 16.6)" fill="#E6B25E"/>
      </svg>`;

    case 'proteins':
      // Savory protein cut icon representing Proteins
      return `<svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" role="img" aria-label="${label}">
        <title>${label}</title>
        <path d="M5.2 13.8c0-3.7 3.3-6.6 7.5-6.6 3.5 0 6.1 2 6.1 4.9 0 3.2-3.1 5.7-7.6 5.7-3.7 0-6-1.6-6-4Z" fill="#C95B44" stroke="#A1402D" stroke-width="0.9"/>
        <ellipse cx="10.2" cy="11.8" rx="2.1" ry="1.3" transform="rotate(-15 10.2 11.8)" fill="#F7DFD8"/>
        <path d="M13.6 12.6c1-.4 2.1-.3 2.9.2" stroke="#F0B7AA" stroke-width="1.2" stroke-linecap="round"/>
      </svg>`;
  }
}
