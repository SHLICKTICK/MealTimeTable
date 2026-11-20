import { BaseModal } from '../BaseModal';
import { DAY_NAMES } from '../../../utils/dateUtils';
import { getIconSvg } from '../../../utils/iconHelper';

export interface AssignMealModalData {
  dayIndex?: number;
  mealType?: 'breakfast' | 'dinner';
}

export class AssignMealModal extends BaseModal<AssignMealModalData> {
  async render(overlay: HTMLElement, data?: AssignMealModalData): Promise<void> {
    const stateSnapshot = this.deps.state.getState();
    const dayIndex = data?.dayIndex ?? stateSnapshot.selectedDayIndex;
    const mealType = data?.mealType ?? stateSnapshot.selectedMealType;
    const dayName = DAY_NAMES[dayIndex] || 'Monday';
    const mealLabel = mealType === 'breakfast' ? 'Breakfast' : 'Dinner';
    const recipes = await this.deps.recipes.getAllRecipes();
    const signal = this.beginRender(overlay);

    const existingMeal = stateSnapshot.currentPlan?.days[dayIndex]?.[mealType] || null;
    const existingRecipe = existingMeal
      ? recipes.find((r) => r.id === existingMeal.recipeId) || null
      : null;

    const relevantCategory = mealType === 'breakfast' ? 'Breakfast' : 'Dinner';
    const sortedRecipes = [...recipes].sort((a, b) => {
      if (existingMeal) {
        if (a.id === existingMeal.recipeId && b.id !== existingMeal.recipeId) return -1;
        if (b.id === existingMeal.recipeId && a.id !== existingMeal.recipeId) return 1;
      }
      if (a.category === relevantCategory && b.category !== relevantCategory) return -1;
      if (b.category === relevantCategory && a.category !== relevantCategory) return 1;
      return a.title.localeCompare(b.title);
    });

    let chosenServings = existingMeal?.servings || stateSnapshot.defaultServings || 4;

    overlay.innerHTML = `
      <div class="glass-panel w-full max-w-lg p-6 flex flex-col gap-4 bg-white/95 rounded-3xl shadow-xl animate-fade-in max-h-[90vh]">
        <div class="flex items-center justify-between pb-2 border-b border-[#25221F]/10">
          <div>
            <h3 class="text-xl font-serif font-bold text-[#25221F]">${existingMeal ? 'Edit' : 'Plan'} ${dayName} ${mealLabel}</h3>
            <p class="text-xs text-[#77716D]">${
              existingMeal
                ? 'Adjust servings for this slot, swap the dish, or edit the base recipe'
                : 'Choose a recipe from your collection'
            }</p>
          </div>
          <button id="modal-close-btn" class="glass-circle-btn">
            ${getIconSvg('x', 'w-4 h-4')}
          </button>
        </div>

        ${
          existingMeal && existingRecipe
            ? `
          <div class="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-[#FAF2E6]/75 border border-[#E9D1B4]/80">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-10 h-10 rounded-xl overflow-hidden bg-[#F4E9E2] shrink-0 border border-white">
                <img src="${existingRecipe.imageUrl}" alt="${existingRecipe.title}" class="w-full h-full object-cover" />
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-[10px] font-semibold uppercase tracking-wider text-[#8C5C26]">Current Dish</span>
                <span class="text-xs font-semibold text-[#25221F] truncate">${existingRecipe.title}</span>
              </div>
            </div>
            <button type="button" id="btn-edit-base-recipe"
                    class="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FFFDF9] border border-[#E9D1B4] text-[#8C5C26] text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer shrink-0">
              ${getIconSvg('edit', 'w-3 h-3')}
              Edit Base Recipe
            </button>
          </div>
        `
            : ''
        }

        <div class="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#FBF7F2] border border-[#25221F]/8">
          <div class="flex flex-col">
            <span class="text-xs font-semibold text-[#25221F]">Servings for this meal</span>
            <span class="text-[11px] text-[#77716D]">${
              existingMeal
                ? `Applies only to ${dayName} ${mealLabel}`
                : `Defaults to your household size (${stateSnapshot.defaultServings || 4})`
            }</span>
          </div>
          <div class="flex items-center gap-2 bg-white px-2.5 py-1 rounded-full border border-[#25221F]/10 shadow-xs">
            <button type="button" id="btn-assign-servings-dec" class="w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold text-[#25221F] hover:bg-[#F2ECE4] cursor-pointer">-</button>
            <span id="assign-servings-label" class="text-xs font-semibold text-[#25221F] min-w-[60px] text-center tabular-nums">${chosenServings} ${chosenServings === 1 ? 'person' : 'people'}</span>
            <button type="button" id="btn-assign-servings-inc" class="w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold text-[#25221F] hover:bg-[#F2ECE4] cursor-pointer">+</button>
          </div>
        </div>

        <div class="flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-1">
          ${sortedRecipes
            .map((r) => {
              const isCurrent = existingMeal?.recipeId === r.id;
              return `
            <div class="assign-recipe-option flex items-center justify-between p-3 rounded-2xl glass-card hover:bg-white/90 border ${
                isCurrent ? 'border-[#D9A441] bg-[#FBF5ED]/80' : 'border-white/80'
              } cursor-pointer transition group" data-id="${r.id}">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-12 h-12 rounded-xl overflow-hidden bg-[#F4E9E2] shrink-0 border border-white">
                  <img src="${r.imageUrl}" alt="${r.title}" class="w-full h-full object-cover" />
                </div>
                <div class="flex flex-col min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-[#25221F] truncate">${r.title}</span>
                    ${
                      isCurrent
                        ? `<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF2E6] text-[#8C5C26] border border-[#E9D1B4] shrink-0">Current</span>`
                        : ''
                    }
                  </div>
                  <span class="text-xs text-[#77716D]">${r.category} · Base ${r.servings}p · ${r.ingredients.length} ingredients</span>
                </div>
              </div>
              <button type="button" class="px-3 py-1.5 rounded-xl bg-[#25221F] text-white text-xs font-medium ${
                isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              } transition shrink-0">
                ${isCurrent ? 'Keep' : 'Select'}
              </button>
            </div>
          `;
            })
            .join('')}
        </div>

        ${
          existingMeal
            ? `
          <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-[#25221F]/10">
            <button type="button" id="btn-cancel-slot-edit" class="px-4 py-2 rounded-xl glass-card text-xs font-medium text-[#77716D] cursor-pointer">
              Cancel
            </button>
            <button type="button" id="btn-save-slot-servings" class="px-5 py-2 rounded-xl bg-[#25221F] text-white text-xs font-medium hover:bg-[#3D3833] cursor-pointer shadow-sm">
              Save Meal
            </button>
          </div>
        `
            : ''
        }
      </div>
    `;

    this.bindCloseButton(overlay, signal);

    const servingsLabel = overlay.querySelector('#assign-servings-label');
    const updateChosenServings = (next: number) => {
      chosenServings = Math.max(1, Math.min(20, next));
      if (servingsLabel) {
        servingsLabel.textContent = `${chosenServings} ${chosenServings === 1 ? 'person' : 'people'}`;
      }
    };

    overlay.querySelector('#btn-assign-servings-dec')?.addEventListener(
      'click',
      () => {
        updateChosenServings(chosenServings - 1);
      },
      { signal }
    );
    overlay.querySelector('#btn-assign-servings-inc')?.addEventListener(
      'click',
      () => {
        updateChosenServings(chosenServings + 1);
      },
      { signal }
    );

    overlay.querySelector('#btn-edit-base-recipe')?.addEventListener(
      'click',
      () => {
        if (existingRecipe) {
          this.deps.state.openModal('edit-recipe', { recipe: existingRecipe });
        }
      },
      { signal }
    );

    overlay.querySelector('#btn-cancel-slot-edit')?.addEventListener(
      'click',
      () => {
        this.deps.state.closeModal();
      },
      { signal }
    );

    overlay.querySelector('#btn-save-slot-servings')?.addEventListener(
      'click',
      async () => {
        const state = this.deps.state.getState();
        if (state.currentPlan && existingMeal) {
          await this.deps.mealPlans.updateMealServings(
            state.currentPlan.id,
            dayIndex,
            mealType,
            chosenServings
          );
          await this.deps.state.setWeekOffset(state.weekOffset);
          await this.deps.state.selectMeal(dayIndex, mealType);
          this.deps.state.closeModal();
          this.deps.state.showToast(
            `Updated ${dayName} ${mealLabel} to ${chosenServings} servings`,
            'success'
          );
        }
      },
      { signal }
    );

    const options = overlay.querySelectorAll<HTMLElement>('.assign-recipe-option');
    options.forEach((opt) => {
      opt.addEventListener(
        'click',
        async () => {
          const recipeId = opt.getAttribute('data-id');
          const state = this.deps.state.getState();
          if (recipeId && state.currentPlan) {
            if (existingMeal && recipeId === existingMeal.recipeId) {
              await this.deps.mealPlans.updateMealServings(
                state.currentPlan.id,
                dayIndex,
                mealType,
                chosenServings
              );
            } else {
              await this.deps.mealPlans.assignMeal(
                state.currentPlan.id,
                dayIndex,
                mealType,
                recipeId,
                chosenServings
              );
            }
            await this.deps.state.setWeekOffset(state.weekOffset);
            await this.deps.state.selectMeal(dayIndex, mealType);
            this.deps.state.closeModal();
          }
        },
        { signal }
      );
    });
  }
}
