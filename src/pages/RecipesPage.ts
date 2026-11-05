import { recipeService } from '../services/recipeService';
import { inventoryService } from '../services/inventoryService';
import { appState } from '../app/state';
import { Recipe } from '../models/Recipe';
import { getIconSvg } from '../utils/iconHelper';
import { calculateRecipeCostBreakdown, formatZAR } from '../utils/pricingUtils';

export class RecipesPage {
  private container: HTMLElement;
  private recipes: Recipe[] = [];
  private filterCategory: string = 'All';
  private searchQuery: string = '';

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'w-full flex flex-col gap-5 pb-16';
    this.loadRecipes();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  async loadRecipes(): Promise<void> {
    this.recipes = await recipeService.getAllRecipes();
    this.render();
  }

  render(): void {
    const filtered = this.recipes.filter((r) => {
      const matchCat = this.filterCategory === 'All' || r.category === this.filterCategory;
      const matchSearch =
        !this.searchQuery ||
        r.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });

    const inventoryList = inventoryService.getLoadedIngredients();

    this.container.innerHTML = `
      <!-- Header with Title and Create Action -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#25221F]/8">
        <div>
          <h2 class="text-[28px] md:text-[32px] font-serif font-normal text-[#221F1C] tracking-[-0.015em] leading-tight">Recipe Library</h2>
          <p class="text-xs text-[#6B6560] mt-1">Manage dishes, ingredients, portions, and dynamic ingredient-based costing</p>
        </div>

        <div class="flex items-center gap-3">
          <!-- Search input -->
          <div class="relative w-48 md:w-60">
            <input id="recipe-search-input" 
                   type="text" 
                   placeholder="Search recipes or ingredients..." 
                   value="${this.searchQuery}"
                   class="w-full pl-3.5 pr-8 py-2 text-xs rounded-full bg-white/65 border border-white/90 focus:outline-none focus:ring-1 focus:ring-[#D9A441] text-[#221F1C] shadow-2xs" />
          </div>

          <!-- New Recipe Button -->
          <button id="btn-create-recipe" 
                  class="px-5 py-2 rounded-full text-white text-xs font-medium flex items-center gap-2 hover:opacity-95 transition shadow-[0_6px_16px_-4px_rgba(25,22,19,0.3)] cursor-pointer whitespace-nowrap"
                  style="background: linear-gradient(180deg, #2D2A27 0%, #191715 100%);">
            ${getIconSvg('plus', 'w-3.5 h-3.5')}
            New Recipe
          </button>
        </div>
      </div>

      <!-- Category Filter Tabs -->
      <div class="flex items-center gap-2">
        ${['All', 'Breakfast', 'Dinner']
          .map(
            (cat) => `
          <button data-cat="${cat}" 
                  class="btn-cat-filter px-4 py-1.5 rounded-full text-xs transition cursor-pointer ${
                    this.filterCategory === cat
                      ? 'sidebar-nav-active text-[#221F1C] font-semibold'
                      : 'glass-pill text-[#6B6560] hover:text-[#221F1C] font-medium'
                  }">
            ${cat}
          </button>
        `
          )
          .join('')}
      </div>

      <!-- Recipes Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
        ${
          filtered.length === 0
            ? `
          <div class="col-span-full py-16 text-center text-[#77716D]">
            <p class="text-sm font-serif">No recipes found matching "${this.searchQuery}"</p>
          </div>
        `
            : filtered
                .map((recipe) => {
                  const cost = calculateRecipeCostBreakdown(recipe.ingredients, inventoryList);
                  const costStr = cost.totalCost > 0 ? formatZAR(cost.totalCost) : null;
                  const perServingStr = cost.totalCost > 0 ? formatZAR(cost.totalCost / (recipe.servings || 1)) : null;

                  return `
          <div class="recipe-item-card rounded-[22px] bg-white/56 hover:bg-white/70 backdrop-blur-lg border border-white/85 shadow-[0_6px_22px_-6px_rgba(85,58,30,0.06),inset_0_1px_0_#FFFFFF] overflow-hidden flex flex-col justify-between transition cursor-pointer group" data-id="${recipe.id}">
            <div>
              <div class="w-full h-44 overflow-hidden relative bg-[#F4E9E2]">
                <img src="${recipe.imageUrl}" alt="${recipe.title}" 
                     class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                
                <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/85 backdrop-blur-md text-[#221F1C] shadow-2xs">
                  ${recipe.category}
                </span>

                <span class="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/85 backdrop-blur-md text-[#6B6560] shadow-2xs">
                  ${recipe.ingredients.length} ing.
                </span>

                ${
                  costStr
                    ? `
                  <span class="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FAF6F0]/90 backdrop-blur-md text-[#8C5C26] border border-[#EFE4D6] shadow-2xs tabular-nums">
                    Est. ${costStr}
                  </span>
                `
                    : ''
                }
              </div>

              <div class="p-4 flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <h4 class="text-lg font-serif font-medium text-[#221F1C] truncate">${recipe.title}</h4>
                  <span class="text-xs text-[#6B6560] font-normal">Serves ${recipe.servings}</span>
                </div>
                <p class="text-xs text-[#6B6560] line-clamp-2 leading-relaxed">
                  ${recipe.description || 'Delicious home-cooked meal.'}
                </p>
                ${
                  perServingStr
                    ? `
                  <div class="flex items-center gap-1.5 text-[11px] text-[#8C5C26] font-medium pt-0.5">
                    <span>${getIconSvg('chart-bar-filled', 'w-3.5 h-3.5')}</span>
                    <span>${perServingStr} per serving</span>
                  </div>
                `
                    : ''
                }
              </div>
            </div>

            <!-- Card Bottom Actions -->
            <div class="p-4 pt-2 flex items-center justify-between gap-2 border-t border-[#25221F]/6 mt-1">
              <button class="btn-card-details text-xs font-medium text-[#8C5C26] hover:underline cursor-pointer" data-id="${recipe.id}">
                View Recipe &rarr;
              </button>

              <div class="flex items-center gap-1.5">
                <button class="btn-card-edit p-1.5 rounded-full hover:bg-white/80 text-[#6B6560] hover:text-[#221F1C] cursor-pointer transition" title="Edit Recipe" data-id="${recipe.id}">
                  ${getIconSvg('edit', 'w-3.5 h-3.5')}
                </button>
                <button class="btn-card-delete p-1.5 rounded-full hover:bg-white/80 text-[#6B6560] hover:text-rose-600 cursor-pointer transition" title="Delete Recipe" data-id="${recipe.id}">
                  ${getIconSvg('trash', 'w-3.5 h-3.5')}
                </button>
              </div>
            </div>
          </div>
        `;
                })
                .join('')
        }
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const searchInput = this.container.querySelector<HTMLInputElement>('#recipe-search-input');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value;
      this.render();
    });

    const createBtn = this.container.querySelector('#btn-create-recipe');
    createBtn?.addEventListener('click', () => {
      appState.openModal('create-recipe');
    });

    const catButtons = this.container.querySelectorAll<HTMLButtonElement>('.btn-cat-filter');
    catButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.filterCategory = btn.getAttribute('data-cat') || 'All';
        this.render();
      });
    });

    const detailButtons = this.container.querySelectorAll<HTMLButtonElement>('.btn-card-details');
    detailButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const recipe = this.recipes.find((r) => r.id === id);
        if (recipe) {
          appState.openRecipeDetail(recipe);
        }
      });
    });

    const editButtons = this.container.querySelectorAll<HTMLButtonElement>('.btn-card-edit');
    editButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const recipe = this.recipes.find((r) => r.id === id);
        if (recipe) {
          appState.openModal('edit-recipe', { recipe });
        }
      });
    });

    const deleteButtons = this.container.querySelectorAll<HTMLButtonElement>('.btn-card-delete');
    deleteButtons.forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id && confirm('Are you sure you want to delete this recipe?')) {
          await recipeService.deleteRecipe(id);
          await this.loadRecipes();
        }
      });
    });

    const cards = this.container.querySelectorAll<HTMLElement>('.recipe-item-card');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        const recipe = this.recipes.find((r) => r.id === id);
        if (recipe) {
          appState.openRecipeDetail(recipe);
        }
      });
    });
  }
}
