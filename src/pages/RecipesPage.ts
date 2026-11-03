import { recipeService } from '../services/recipeService';
import { appState } from '../app/state';
import { Recipe } from '../models/Recipe';
import { getIconSvg } from '../utils/iconHelper';

export class RecipesPage {
  private container: HTMLElement;
  private recipes: Recipe[] = [];
  private filterCategory: string = 'All';
  private searchQuery: string = '';

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'w-full flex-1 flex flex-col gap-5 select-none overflow-y-auto pr-1';
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

    this.container.innerHTML = `
      <!-- Header with Title and Create Action -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#25221F]/10">
        <div>
          <h2 class="text-3xl font-serif font-medium text-[#25221F]">Recipe Library</h2>
          <p class="text-xs text-[#77716D] mt-1">Manage dishes, ingredients, and assign meals across your weeks</p>
        </div>

        <div class="flex items-center gap-3">
          <!-- Search input -->
          <div class="relative w-48 md:w-60">
            <input id="recipe-search-input" 
                   type="text" 
                   placeholder="Search recipes or ingredients..." 
                   value="${this.searchQuery}"
                   class="w-full pl-3 pr-8 py-2 text-xs rounded-xl glass-card focus:outline-none focus:ring-1 focus:ring-[#D9A441] text-[#25221F]" />
          </div>

          <!-- New Recipe Button -->
          <button id="btn-create-recipe" 
                  class="px-4 py-2 rounded-xl bg-[#25221F] text-white text-xs font-medium flex items-center gap-2 hover:bg-[#3D3833] transition shadow-sm cursor-pointer whitespace-nowrap">
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
                  class="btn-cat-filter px-4 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                    this.filterCategory === cat
                      ? 'bg-[#25221F] text-white shadow-xs'
                      : 'glass-card text-[#77716D] hover:text-[#25221F]'
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
                .map(
                  (recipe) => `
          <div class="recipe-item-card glass-card rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-md transition cursor-pointer group" data-id="${recipe.id}">
            <div>
              <div class="w-full h-44 overflow-hidden relative bg-[#F4E9E2]">
                <img src="${recipe.imageUrl}" alt="${recipe.title}" 
                     class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                
                <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/80 backdrop-blur-md text-[#25221F] shadow-2xs">
                  ${recipe.category}
                </span>

                <span class="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/80 backdrop-blur-md text-[#77716D] shadow-2xs">
                  ${recipe.ingredients.length} ing.
                </span>
              </div>

              <div class="p-4 flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <h4 class="text-lg font-serif font-semibold text-[#25221F] truncate">${recipe.title}</h4>
                  <span class="text-xs text-[#77716D] font-medium">Serves ${recipe.servings}</span>
                </div>
                <p class="text-xs text-[#77716D] line-clamp-2 leading-relaxed">
                  ${recipe.description || 'Delicious home-cooked meal.'}
                </p>
              </div>
            </div>

            <!-- Card Bottom Actions -->
            <div class="p-4 pt-0 flex items-center justify-between gap-2 border-t border-[#25221F]/5 mt-2">
              <button class="btn-card-details text-xs font-medium text-[#8C5C26] hover:underline cursor-pointer" data-id="${recipe.id}">
                View Recipe &rarr;
              </button>

              <div class="flex items-center gap-1.5">
                <button class="btn-card-edit p-1.5 rounded-lg hover:bg-white/60 text-[#77716D] hover:text-[#25221F] cursor-pointer" title="Edit Recipe" data-id="${recipe.id}">
                  ${getIconSvg('edit', 'w-3.5 h-3.5')}
                </button>
                <button class="btn-card-delete p-1.5 rounded-lg hover:bg-white/60 text-[#77716D] hover:text-rose-600 cursor-pointer" title="Delete Recipe" data-id="${recipe.id}">
                  ${getIconSvg('trash', 'w-3.5 h-3.5')}
                </button>
              </div>
            </div>
          </div>
        `
                )
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
