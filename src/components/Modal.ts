import { appState } from '../app/state';
import { recipeService, MEAL_IMAGES } from '../services/recipeService';
import { mealPlanService } from '../services/mealPlanService';
import { Recipe } from '../models/Recipe';
import { Ingredient } from '../models/Ingredient';
import { DAY_NAMES, getWeekDates } from '../utils/dateUtils';
import { getIconSvg } from '../utils/iconHelper';

export class Modal {
  private overlay: HTMLElement;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.className =
      'fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay hidden select-none';
    this.render();
  }

  getElement(): HTMLElement {
    return this.overlay;
  }

  async render(): Promise<void> {
    const state = appState.getState();
    const modalData = state.activeModal;

    if (!modalData || !modalData.type) {
      this.overlay.classList.add('hidden');
      this.overlay.innerHTML = '';
      return;
    }

    this.overlay.classList.remove('hidden');

    switch (modalData.type) {
      case 'assign-meal':
        await this.renderAssignMeal(modalData.data);
        break;
      case 'edit-recipe':
      case 'create-recipe':
        await this.renderRecipeForm(modalData.data?.recipe);
        break;
      case 'week-selector':
        this.renderWeekSelector();
        break;
      case 'ios-pwa-guide':
        this.renderIosGuide();
        break;
    }

    this.bindCommonEvents();
  }

  private async renderAssignMeal(data?: { dayIndex?: number; mealType?: 'breakfast' | 'dinner' }): Promise<void> {
    const dayIndex = data?.dayIndex ?? appState.getState().selectedDayIndex;
    const mealType = data?.mealType ?? appState.getState().selectedMealType;
    const dayName = DAY_NAMES[dayIndex] || 'Monday';
    const recipes = await recipeService.getAllRecipes();

    // Filter relevant recipes first
    const relevantCategory = mealType === 'breakfast' ? 'Breakfast' : 'Dinner';
    const sortedRecipes = [...recipes].sort((a, b) => {
      if (a.category === relevantCategory && b.category !== relevantCategory) return -1;
      if (b.category === relevantCategory && a.category !== relevantCategory) return 1;
      return a.title.localeCompare(b.title);
    });

    this.overlay.innerHTML = `
      <div class="glass-panel w-full max-w-lg p-6 flex flex-col gap-4 bg-white/95 rounded-3xl shadow-xl animate-fade-in max-h-[90vh]">
        <div class="flex items-center justify-between pb-2 border-b border-[#25221F]/10">
          <div>
            <h3 class="text-xl font-serif font-bold text-[#25221F]">Plan ${dayName} ${mealType === 'breakfast' ? 'Breakfast' : 'Dinner'}</h3>
            <p class="text-xs text-[#77716D]">Choose a recipe from your collection</p>
          </div>
          <button id="modal-close-btn" class="glass-circle-btn">
            ${getIconSvg('x', 'w-4 h-4')}
          </button>
        </div>

        <!-- Recipe choices list -->
        <div class="flex flex-col gap-2 overflow-y-auto max-h-[380px] pr-1">
          ${sortedRecipes
            .map(
              (r) => `
            <div class="assign-recipe-option flex items-center justify-between p-3 rounded-2xl glass-card hover:bg-white/90 border border-white/80 cursor-pointer transition group" data-id="${r.id}">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl overflow-hidden bg-[#F4E9E2] shrink-0 border border-white">
                  <img src="${r.imageUrl}" alt="${r.title}" class="w-full h-full object-cover" />
                </div>
                <div class="flex flex-col">
                  <span class="text-sm font-semibold text-[#25221F]">${r.title}</span>
                  <span class="text-xs text-[#77716D]">${r.category} · Serves ${r.servings} · ${r.ingredients.length} ingredients</span>
                </div>
              </div>
              <button class="px-3 py-1.5 rounded-xl bg-[#25221F] text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition">
                Select
              </button>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;

    const options = this.overlay.querySelectorAll<HTMLElement>('.assign-recipe-option');
    options.forEach((opt) => {
      opt.addEventListener('click', async () => {
        const recipeId = opt.getAttribute('data-id');
        const state = appState.getState();
        if (recipeId && state.currentPlan) {
          await mealPlanService.assignMeal(state.currentPlan.id, dayIndex, mealType, recipeId);
          await appState.setWeekOffset(state.weekOffset);
          appState.closeModal();
        }
      });
    });
  }

  private async renderRecipeForm(recipe?: Recipe): Promise<void> {
    const isEdit = !!recipe;
    const title = isEdit ? 'Edit Recipe' : 'Create New Recipe';
    const rTitle = recipe?.title || '';
    const rDesc = recipe?.description || '';
    const rCat = recipe?.category || 'Dinner';
    const rServings = recipe?.servings || 4;
    const rImg = recipe?.imageUrl || MEAL_IMAGES.chicken_and_rice;
    const ingredients = recipe?.ingredients || [
      { id: 'ing-1', name: '', quantity: 100, unit: 'g', category: 'Produce' },
    ];

    this.overlay.innerHTML = `
      <div class="glass-panel w-full max-w-2xl p-6 flex flex-col gap-4 bg-white/95 rounded-3xl shadow-xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-2 border-b border-[#25221F]/10">
          <div>
            <h3 class="text-xl font-serif font-bold text-[#25221F]">${title}</h3>
            <p class="text-xs text-[#77716D]">Specify recipe details, portions, and ingredient quantities</p>
          </div>
          <button id="modal-close-btn" class="glass-circle-btn">
            ${getIconSvg('x', 'w-4 h-4')}
          </button>
        </div>

        <form id="recipe-editor-form" class="flex flex-col gap-4 text-xs">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-[#25221F] mb-1">Recipe Name *</label>
              <input id="input-recipe-title" type="text" required value="${rTitle}" placeholder="e.g. Herb Roasted Chicken" 
                     class="w-full px-3 py-2 rounded-xl glass-card border focus:outline-none focus:ring-1 focus:ring-[#D9A441]" />
            </div>

            <div>
              <label class="block font-semibold text-[#25221F] mb-1">Meal Category</label>
              <select id="select-recipe-category" class="w-full px-3 py-2 rounded-xl glass-card border focus:outline-none">
                <option value="Dinner" ${rCat === 'Dinner' ? 'selected' : ''}>Dinner</option>
                <option value="Breakfast" ${rCat === 'Breakfast' ? 'selected' : ''}>Breakfast</option>
                <option value="Lunch" ${rCat === 'Lunch' ? 'selected' : ''}>Lunch</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-[#25221F] mb-1">Serving Size (People)</label>
              <input id="input-recipe-servings" type="number" min="1" max="20" value="${rServings}" 
                     class="w-full px-3 py-2 rounded-xl glass-card border focus:outline-none" />
            </div>

            <div>
              <label class="block font-semibold text-[#25221F] mb-1">Photo Selection</label>
              <select id="select-recipe-image" class="w-full px-3 py-2 rounded-xl glass-card border focus:outline-none">
                ${Object.entries(MEAL_IMAGES)
                  .map(
                    ([k, url]) => `
                  <option value="${url}" ${url === rImg ? 'selected' : ''}>${k.replace(/_/g, ' ').toUpperCase()}</option>
                `
                  )
                  .join('')}
              </select>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-[#25221F] mb-1">Description</label>
            <textarea id="input-recipe-desc" rows="2" placeholder="Brief summary of the dish..." 
                      class="w-full px-3 py-2 rounded-xl glass-card border focus:outline-none">${rDesc}</textarea>
          </div>

          <!-- Ingredients Dynamic Editor -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="font-semibold text-[#25221F]">Ingredients List</label>
              <button type="button" id="btn-add-ing-row" 
                      class="px-2.5 py-1 rounded-lg bg-white/70 hover:bg-white border text-[11px] font-medium text-[#8C5C26] cursor-pointer flex items-center gap-1">
                ${getIconSvg('plus', 'w-3 h-3')} Add Ingredient
              </button>
            </div>

            <div id="ingredients-rows-container" class="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
              ${ingredients
                .map(
                  (ing, idx) => `
                <div class="ing-row flex items-center gap-2" data-idx="${idx}">
                  <input type="text" placeholder="Ingredient name (e.g. Carrots)" value="${ing.name}" 
                         class="ing-name flex-1 px-3 py-1.5 rounded-xl glass-card border focus:outline-none" required />
                  <input type="number" step="any" placeholder="Qty" value="${ing.quantity}" 
                         class="ing-qty w-20 px-3 py-1.5 rounded-xl glass-card border focus:outline-none" required />
                  <input type="text" placeholder="Unit (g, ml, medium)" value="${ing.unit}" 
                         class="ing-unit w-24 px-3 py-1.5 rounded-xl glass-card border focus:outline-none" required />
                  <button type="button" class="btn-remove-ing p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer">
                    ${getIconSvg('x', 'w-4 h-4')}
                  </button>
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-[#25221F]/10">
            <button type="button" id="btn-cancel-recipe" class="px-4 py-2 rounded-xl glass-card font-medium text-[#77716D] cursor-pointer">
              Cancel
            </button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-[#25221F] text-white font-medium hover:bg-[#3D3833] cursor-pointer shadow-sm">
              Save Recipe
            </button>
          </div>
        </form>
      </div>
    `;

    // Row management
    const container = this.overlay.querySelector('#ingredients-rows-container')!;
    const addRowBtn = this.overlay.querySelector('#btn-add-ing-row');
    addRowBtn?.addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'ing-row flex items-center gap-2';
      row.innerHTML = `
        <input type="text" placeholder="Ingredient name" class="ing-name flex-1 px-3 py-1.5 rounded-xl glass-card border focus:outline-none" required />
        <input type="number" step="any" placeholder="Qty" value="100" class="ing-qty w-20 px-3 py-1.5 rounded-xl glass-card border focus:outline-none" required />
        <input type="text" placeholder="Unit" value="g" class="ing-unit w-24 px-3 py-1.5 rounded-xl glass-card border focus:outline-none" required />
        <button type="button" class="btn-remove-ing p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer">
          ${getIconSvg('x', 'w-4 h-4')}
        </button>
      `;
      row.querySelector('.btn-remove-ing')?.addEventListener('click', () => row.remove());
      container.appendChild(row);
    });

    this.overlay.querySelectorAll('.btn-remove-ing').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        (e.target as HTMLElement).closest('.ing-row')?.remove();
      });
    });

    // Form submit
    const form = this.overlay.querySelector<HTMLFormElement>('#recipe-editor-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const titleInput = this.overlay.querySelector<HTMLInputElement>('#input-recipe-title');
      const catSelect = this.overlay.querySelector<HTMLSelectElement>('#select-recipe-category');
      const servingsInput = this.overlay.querySelector<HTMLInputElement>('#input-recipe-servings');
      const imgSelect = this.overlay.querySelector<HTMLSelectElement>('#select-recipe-image');
      const descInput = this.overlay.querySelector<HTMLTextAreaElement>('#input-recipe-desc');

      const ingRows = this.overlay.querySelectorAll('.ing-row');
      const parsedIngredients: Ingredient[] = [];
      ingRows.forEach((row, i) => {
        const name = (row.querySelector('.ing-name') as HTMLInputElement).value;
        const qty = parseFloat((row.querySelector('.ing-qty') as HTMLInputElement).value) || 1;
        const unit = (row.querySelector('.ing-unit') as HTMLInputElement).value || 'portion';
        if (name) {
          parsedIngredients.push({
            id: `ing-${Date.now()}-${i}`,
            name: name.trim(),
            quantity: qty,
            unit: unit.trim(),
            category: 'Pantry',
          });
        }
      });

      const updatedRecipe: Recipe = {
        id: recipe?.id || `rec-${Date.now()}`,
        title: titleInput?.value.trim() || 'Untitled Recipe',
        category: (catSelect?.value as any) || 'Dinner',
        servings: parseInt(servingsInput?.value || '4', 10),
        imageUrl: imgSelect?.value || MEAL_IMAGES.chicken_and_rice,
        description: descInput?.value.trim() || '',
        ingredients: parsedIngredients,
      };

      await recipeService.saveRecipe(updatedRecipe);
      appState.openRecipeDetail(updatedRecipe);
      appState.closeModal();
    });
  }

  private renderWeekSelector(): void {
    const curOffset = appState.getState().weekOffset;

    this.overlay.innerHTML = `
      <div class="glass-panel w-full max-w-sm p-6 flex flex-col gap-4 bg-white/95 rounded-3xl shadow-xl animate-fade-in">
        <div class="flex items-center justify-between pb-2 border-b border-[#25221F]/10">
          <h3 class="text-lg font-serif font-bold text-[#25221F]">Select Timetable Week</h3>
          <button id="modal-close-btn" class="glass-circle-btn">
            ${getIconSvg('x', 'w-4 h-4')}
          </button>
        </div>

        <div class="flex flex-col gap-2">
          ${[-2, -1, 0, 1, 2, 3]
            .map((offset) => {
              const { dayDates } = getWeekDates(offset);
              const label = offset === 0 ? 'This Week (Current)' : offset === 1 ? 'Next Week' : offset === -1 ? 'Last Week' : `Week ${offset > 0 ? `+${offset}` : offset}`;
              const dateRange = `${dayDates[0].dateStr} – ${dayDates[6].dateStr}`;
              const isSelected = curOffset === offset;

              return `
              <button class="week-opt-btn flex items-center justify-between p-3 rounded-2xl glass-card transition cursor-pointer ${
                isSelected ? 'border-[#D9A441] bg-[#FBF5ED]' : 'hover:bg-white'
              }" data-offset="${offset}">
                <div class="flex flex-col text-left">
                  <span class="text-xs font-semibold ${isSelected ? 'text-[#8C5C26]' : 'text-[#25221F]'}">${label}</span>
                  <span class="text-[11px] text-[#77716D]">${dateRange}</span>
                </div>
                ${isSelected ? `<span class="text-[#8C5C26]">${getIconSvg('check', 'w-4 h-4')}</span>` : ''}
              </button>
            `;
            })
            .join('')}
        </div>
      </div>
    `;

    const weekButtons = this.overlay.querySelectorAll<HTMLButtonElement>('.week-opt-btn');
    weekButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const offset = parseInt(btn.getAttribute('data-offset') || '0', 10);
        appState.setWeekOffset(offset);
        appState.closeModal();
      });
    });
  }

  private renderIosGuide(): void {
    this.overlay.innerHTML = `
      <div class="glass-panel w-full max-w-sm p-6 flex flex-col gap-4 bg-white/95 rounded-3xl shadow-xl animate-fade-in text-center">
        <div class="w-12 h-12 rounded-2xl bg-[#FBF5ED] border border-[#F3E2CE] flex items-center justify-center text-[#D9A441] mx-auto">
          ${getIconSvg('download', 'w-6 h-6')}
        </div>
        <h3 class="text-lg font-serif font-bold text-[#25221F]">Install on iPhone / iPad</h3>
        <p class="text-xs text-[#77716D] leading-relaxed">
          1. Tap the <strong>Share</strong> button in Safari's bottom toolbar.<br />
          2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
          3. Tap <strong>Add</strong> in the top-right corner.
        </p>
        <button id="modal-close-btn" class="w-full py-2.5 rounded-xl bg-[#25221F] text-white text-xs font-medium cursor-pointer">
          Done
        </button>
      </div>
    `;
  }

  private bindCommonEvents(): void {
    const closeBtn = this.overlay.querySelector('#modal-close-btn');
    closeBtn?.addEventListener('click', () => {
      appState.closeModal();
    });

    const cancelBtn = this.overlay.querySelector('#btn-cancel-recipe');
    cancelBtn?.addEventListener('click', () => {
      appState.closeModal();
    });

    // Close on backdrop click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        appState.closeModal();
      }
    });
  }
}
