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

/**
 * Miniature culinary food icons for ingredient rows matching the reference detail panel.
 */
export function getIngredientMiniIconSvg(name: string, category?: string): string {
  const lower = name.toLowerCase();

  // Chicken / Poultry / Meat
  if (lower.includes('chicken') || lower.includes('turkey') || lower.includes('poultry')) {
    return `<svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
      <ellipse cx="12.5" cy="12" rx="7.5" ry="5.2" transform="rotate(-14 12.5 12)" fill="#D98B48"/>
      <ellipse cx="12" cy="11.4" rx="6.5" ry="4.2" transform="rotate(-14 12 11.4)" fill="#EAA45E"/>
      <path d="M8.5 10.2c1.8-.8 4.2-.8 6.2 0" stroke="#A65D22" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M9.5 13c1.6-.6 3.5-.6 5 0" stroke="#A65D22" stroke-width="1.2" stroke-linecap="round"/>
    </svg>`;
  }

  if (lower.includes('beef') || lower.includes('steak') || lower.includes('meat') || lower.includes('lamb') || lower.includes('pork') || lower.includes('bacon')) {
    return `<svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
      <path d="M5 13.5c0-3.8 3.6-6.5 8-6.5 3.6 0 6 2 6 4.8 0 3.2-3.2 5.7-7.8 5.7-3.8 0-6.2-1.6-6.2-4Z" fill="#B84B3E"/>
      <ellipse cx="10.5" cy="11.5" rx="2.2" ry="1.3" fill="#F2D7D0"/>
    </svg>`;
  }

  // Rice / Oats / Grains
  if (lower.includes('rice') || lower.includes('oat') || lower.includes('quinoa') || lower.includes('grain') || lower.includes('pap') || lower.includes('maize')) {
    return `<svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
      <path d="M6.5 12.5c0-3.2 2.5-5.2 5.5-5.2s5.5 2 5.5 5.2H6.5Z" fill="#FAF7F2"/>
      <path d="M4.5 12.5h15c-.4 3.8-3.4 6.2-7.5 6.2s-7.1-2.4-7.5-6.2Z" fill="#E6E1DA" stroke="#C9C2B8" stroke-width="1"/>
      <circle cx="10" cy="10.3" r="0.8" fill="#DFD8CE"/>
      <circle cx="13.5" cy="10.6" r="0.8" fill="#DFD8CE"/>
    </svg>`;
  }

  // Carrots
  if (lower.includes('carrot')) {
    return `<svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
      <path d="M16.5 6.5c1-1.4 2.3-2 3.2-1.8M16 7c1.6-.4 2.8.2 3.2 1" stroke="#5B9A3D" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M16.8 7.2c1.2 1.2.8 3.2-.8 4.8l-7.2 6.8c-1 1-2.4.8-3-.1-.7-.8-.5-2.1.6-3l6.8-7.4c1.3-1.4 2.6-2.1 3.6-1.1Z" fill="#EE7B28"/>
      <path d="M12.2 11.5l1.5 1.2M9.8 14l1.3 1" stroke="#C85B12" stroke-width="1.1" stroke-linecap="round"/>
    </svg>`;
  }

  // Onion / Garlic
  if (lower.includes('onion') || lower.includes('garlic') || lower.includes('shallot')) {
    return `<svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
      <path d="M12 4.5c.6 1.5 1.2 2.2 2 2.7 1.8 1.1 3 2.9 3 5.2 0 3.2-2.2 5.6-5 5.6s-5-2.4-5-5.6c0-2.3 1.2-4.1 3-5.2.8-.5 1.4-1.2 2-2.7Z" fill="#D89A4E"/>
      <path d="M12 5.2c-.9 2-1.4 4.4-1.4 7.2 0 2.5.5 4.4 1.4 5.4M12 5.2c.9 2 1.4 4.4 1.4 7.2 0 2.5-.5 4.4-1.4 5.4" stroke="#B6762C" stroke-width="1" stroke-linecap="round"/>
    </svg>`;
  }

  // Cooking Oil / Liquid Bottle
  if (lower.includes('oil') || lower.includes('vinegar') || lower.includes('syrup') || lower.includes('honey') || lower.includes('sauce')) {
    return `<svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
      <rect x="10.2" y="3.5" width="3.6" height="2.4" rx="0.8" fill="#8C6239"/>
      <path d="M10.5 6h3l1.8 3.2c.5.9.7 1.8.7 2.8v6.2c0 1.2-1 2.2-2.2 2.2h-3.6c-1.2 0-2.2-1-2.2-2.2V12c0-1 .2-1.9.7-2.8L10.5 6Z" fill="#E9B83B"/>
      <rect x="9.5" y="12.5" width="5" height="4" rx="0.8" fill="#FFF8E6" opacity="0.85"/>
    </svg>`;
  }

  // Salt / Pepper / Spices
  if (lower.includes('salt') || lower.includes('pepper') || lower.includes('spice') || lower.includes('seasoning') || lower.includes('sugar') || lower.includes('flour')) {
    return `<svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
      <path d="M9.5 6.5c0-1.1 1.1-2 2.5-2s2.5.9 2.5 2H9.5Z" fill="#B8B2AA"/>
      <path d="M8.8 7h6.4l.8 10.5c.1 1.1-.8 2-1.9 2H9.9c-1.1 0-2-.9-1.9-2L8.8 7Z" fill="#F4F1EC" stroke="#CBC5BC" stroke-width="1"/>
      <rect x="9.3" y="12" width="5.4" height="5.5" rx="0.8" fill="#FFFFFF"/>
    </svg>`;
  }

  // Eggs
  if (lower.includes('egg')) {
    return `<svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
      <path d="M12 4.5c3.2 0 5.5 4.2 5.5 8.2 0 3.6-2.4 6.3-5.5 6.3s-5.5-2.7-5.5-6.3c0-4 2.3-8.2 5.5-8.2Z" fill="#F7E5CE" stroke="#DFC4A2" stroke-width="1"/>
    </svg>`;
  }

  // Dairy: Milk, Yogurt, Cream, Cheese, Butter
  if (lower.includes('milk') || lower.includes('yogurt') || lower.includes('cream') || lower.includes('cheese') || lower.includes('butter') || lower.includes('feta')) {
    return `<svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
      <rect x="6" y="8" width="12" height="10" rx="2.5" fill="#FFFDF9" stroke="#DFD5C7" stroke-width="1"/>
      <path d="M7 10.5h10v5a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-5Z" fill="#F4E6C8"/>
    </svg>`;
  }

  // Berries / Fruit / Tomato
  if (lower.includes('berr') || lower.includes('tomato') || lower.includes('apple') || lower.includes('fruit') || lower.includes('lemon')) {
    return `<svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
      <circle cx="10.5" cy="13.5" r="4.2" fill="#D64550"/>
      <circle cx="14.8" cy="12" r="3.4" fill="#4B66A6"/>
      <path d="M12 7.5c.8-1 2-1.4 3-1.2" stroke="#5A963C" stroke-width="1.4" stroke-linecap="round"/>
    </svg>`;
  }

  // Leafy Greens / Herbs / Spinach / Cucumber / Broccoli
  if (
    lower.includes('spinach') ||
    lower.includes('lettuce') ||
    lower.includes('green') ||
    lower.includes('herb') ||
    lower.includes('basil') ||
    lower.includes('parsley') ||
    lower.includes('chive') ||
    lower.includes('cucumber') ||
    lower.includes('broccoli') ||
    category === 'Produce'
  ) {
    return `<svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
      <path d="M18.5 5.5C12.2 5.5 7 8.8 5.8 14.5c-.3 1.7.4 3 1.7 3.6 1.5.7 3.7.4 5.7-.7 4-2.3 5.6-7.1 5.3-11.9Z" fill="#63A342"/>
      <path d="M6 18.5c2.8-3 6.5-6 10.6-8.8" stroke="#DDF0D2" stroke-width="1.3" stroke-linecap="round"/>
    </svg>`;
  }

  // Pasta / Bread / Bakery
  if (lower.includes('pasta') || lower.includes('spaghetti') || lower.includes('bread') || lower.includes('bun') || lower.includes('muffin') || lower.includes('toast')) {
    return `<svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
      <rect x="5.5" y="8.5" width="13" height="8.5" rx="3" fill="#E3B169"/>
      <path d="M7.5 11.5h9M7.5 14h6.5" stroke="#B67E32" stroke-width="1.2" stroke-linecap="round"/>
    </svg>`;
  }

  // Default warm culinary ingredient icon
  return `<svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="6.5" fill="#EFE4D4" stroke="#D7C3A8" stroke-width="1"/>
    <circle cx="12" cy="12" r="3" fill="#D9A441"/>
  </svg>`;
}
