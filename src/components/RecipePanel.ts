import { appState } from '../app/state';
import { getIconSvg } from '../utils/iconHelper';
import { scaleIngredientsList } from '../utils/ingredientScaling';
import { mealPlanService } from '../services/mealPlanService';
import { inventoryService } from '../services/inventoryService';
import { DAY_NAMES } from '../utils/dateUtils';
import { MealCookingStatus } from '../models/PlannedMeal';
import {
  calculateRecipeCostBreakdown,
  calculateIngredientCost,
  formatZAR,
} from '../utils/pricingUtils';

export class RecipePanel {
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('aside');
    this.container.className =
      'recipe-panel-desktop w-[390px] xl:w-[410px] shrink-0 h-full flex flex-col glass-panel p-5 overflow-y-auto select-none shadow-md transition-all relative';
    this.render();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  render(): void {
    const state = appState.getState();
    const recipe = state.selectedRecipe;
    const dayIndex = state.selectedDayIndex;
    const mealType = state.selectedMealType;
    const dayName = DAY_NAMES[dayIndex] || 'Monday';
    const mealLabel = mealType === 'breakfast' ? 'Breakfast' : 'Dinner';
    const categoryTag = `${dayName} • ${mealLabel}`;

    const currentDay = state.currentPlan?.days[dayIndex];
    const plannedMeal = currentDay ? currentDay[mealType] : null;
    const mealStatus: MealCookingStatus = plannedMeal?.status || 'planned';

    if (!recipe) {
      this.container.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center text-center p-6 text-[#77716D]">
          <div class="w-16 h-16 rounded-2xl bg-white/40 border border-white/60 flex items-center justify-center text-[#8C5C26]/60 mb-4">
            ${getIconSvg('utensils', 'w-8 h-8')}
          </div>
          <h3 class="text-lg font-serif font-medium text-[#25221F] mb-1">No Meal Selected</h3>
          <p class="text-xs text-[#77716D] max-w-[220px]">
            Select any breakfast or dinner slot from the weekly timetable to view ingredients and details.
          </p>
          <button id="btn-add-meal-empty" 
                  class="mt-4 px-4 py-2 rounded-xl bg-[#25221F] text-white text-xs font-medium hover:bg-[#3D3833] transition cursor-pointer">
            Assign Meal
          </button>
        </div>
      `;

      this.container.querySelector('#btn-add-meal-empty')?.addEventListener('click', () => {
        appState.openModal('assign-meal', { dayIndex, mealType });
      });
      return;
    }

    const currentServings = state.recipeDetailServings || recipe.servings || 4;
    const scaledIngredients = scaleIngredientsList(recipe.ingredients, recipe.servings, currentServings);
    const inventoryList = inventoryService.getLoadedIngredients();
    const costBreakdown = calculateRecipeCostBreakdown(scaledIngredients, inventoryList);

    // Status styling
    let statusPill = '';
    if (mealStatus === 'cooked') {
      statusPill = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF5EA] text-[#3E703E] border border-[#D5EAD5] shadow-2xs">
        ${getIconSvg('check-circle', 'w-3.5 h-3.5 text-[#4A7C4A]')}
        Cooked
      </span>`;
    } else if (mealStatus === 'cooking') {
      statusPill = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FDF4E7] text-[#B87A24] border border-[#F6DEBD] shadow-2xs animate-pulse">
        ${getIconSvg('flame', 'w-3.5 h-3.5 text-[#C2822B]')}
        Cooking Now
      </span>`;
    } else if (mealStatus === 'skipped') {
      statusPill = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
        Skipped
      </span>`;
    } else {
      statusPill = `<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-[#77716D] bg-white/60 border border-white/80 shadow-2xs">
        Planned
      </span>`;
    }

    this.container.innerHTML = `
      <div class="flex flex-col gap-4">
        <!-- Top Media Card with Close Button -->
        <div class="relative w-full h-[220px] rounded-2xl overflow-hidden shadow-sm border border-white/90 bg-[#F4E9E2]">
          <img src="${recipe.imageUrl}" alt="${recipe.title}" 
               class="w-full h-full object-cover" />
          
          <!-- Close button in top-right corner matching reference -->
          <button id="btn-close-recipe" 
                  class="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/70 hover:bg-white backdrop-blur-md border border-white flex items-center justify-center text-[#25221F] shadow-sm transition cursor-pointer"
                  title="Close panel" aria-label="Close panel">
            ${getIconSvg('x', 'w-4 h-4')}
          </button>
        </div>

        <!-- Meta Category Pill & Meal Cooking Status -->
        <div class="flex items-center justify-between pt-0.5">
          <span class="inline-block px-3 py-1 rounded-full text-xs font-medium text-[#25221F] bg-white/60 border border-white/80 shadow-2xs">
            ${categoryTag}
          </span>
          <div class="flex items-center gap-1.5">
            ${statusPill}
            <select id="select-meal-status-quick" 
                    class="text-[11px] bg-white/50 border border-white/80 rounded-lg px-1.5 py-0.5 text-[#77716D] hover:text-[#25221F] focus:outline-none cursor-pointer"
                    title="Change meal status">
              <option value="planned" ${mealStatus === 'planned' ? 'selected' : ''}>Set: Planned</option>
              <option value="cooking" ${mealStatus === 'cooking' ? 'selected' : ''}>Set: Cooking</option>
              <option value="cooked" ${mealStatus === 'cooked' ? 'selected' : ''}>Set: Cooked</option>
              <option value="skipped" ${mealStatus === 'skipped' ? 'selected' : ''}>Set: Skipped</option>
            </select>
          </div>
        </div>

        <!-- Recipe Title & Description -->
        <div class="flex flex-col gap-1 -mt-1">
          <h3 class="text-2xl md:text-[27px] font-serif font-semibold text-[#25221F] leading-tight">
            ${recipe.title}
          </h3>
          <p class="text-xs text-[#77716D] leading-relaxed">
            ${recipe.description || 'A simple and delicious family meal.'}
          </p>
        </div>

        <!-- Real-Time Recipe Cost Card -->
        <div class="glass-card px-3.5 py-2.5 rounded-2xl flex items-center justify-between bg-gradient-to-r from-white/90 to-[#FAF6F0] border border-[#EFE4D6] shadow-2xs">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-[#FBF5ED] border border-[#F3E2CE] flex items-center justify-center text-[#8C5C26] shrink-0">
              ${getIconSvg('chart-bar', 'w-4 h-4')}
            </div>
            <div class="flex flex-col">
              <span class="text-[10.5px] text-[#77716D] font-medium">Estimated Meal Cost</span>
              <span class="text-base font-bold text-[#8C5C26] tabular-nums">${formatZAR(costBreakdown.totalCost)}</span>
            </div>
          </div>
          <div class="text-right">
            <span class="text-[10px] text-[#77716D] block">Per Serving</span>
            <span class="text-xs font-semibold text-[#25221F] tabular-nums">${formatZAR(costBreakdown.totalCost / (currentServings || 1))}</span>
          </div>
        </div>

        <!-- Ingredients Section with Dynamic Servings Stepper -->
        <div class="glass-card p-4 rounded-2xl flex flex-col gap-3 mt-0.5">
          <div class="flex items-center justify-between pb-1 border-b border-[#25221F]/8">
            <div class="flex items-center gap-2 text-sm font-semibold text-[#25221F]">
              <span class="text-[#8C5C26]">${getIconSvg('utensils', 'w-4 h-4')}</span>
              <span>Ingredients (Serves ${currentServings})</span>
            </div>

            <!-- Dynamic Serving Stepper -->
            <div class="flex items-center gap-1.5 bg-white/60 px-2 py-0.5 rounded-lg border border-white/80 shadow-2xs">
              <button id="btn-servings-dec" 
                      class="w-5 h-5 flex items-center justify-center text-[#77716D] hover:text-[#25221F] cursor-pointer"
                      title="Decrease servings" aria-label="Decrease servings">
                ${getIconSvg('minus', 'w-3 h-3')}
              </button>
              <span class="text-xs font-semibold text-[#25221F] w-4 text-center tabular-nums">${currentServings}</span>
              <button id="btn-servings-inc" 
                      class="w-5 h-5 flex items-center justify-center text-[#77716D] hover:text-[#25221F] cursor-pointer"
                      title="Increase servings" aria-label="Increase servings">
                ${getIconSvg('plus', 'w-3 h-3')}
              </button>
            </div>
          </div>

          <!-- Scaled Ingredients Table with Individual Costs -->
          <div class="flex flex-col divide-y divide-[#25221F]/5 max-h-[220px] overflow-y-auto pr-1">
            ${scaledIngredients
              .map((ing) => {
                // Match with breakdown item
                const breakdownItem = costBreakdown.items.find(
                  (b) => b.name.toLowerCase() === ing.name.toLowerCase()
                );
                const cost = breakdownItem ? breakdownItem.cost : 0;

                return `
              <div class="flex items-center justify-between py-2 text-xs">
                <span class="text-[#25221F] font-medium flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#D9A441]/70 inline-block"></span>
                  ${ing.name}
                </span>
                <div class="flex items-center gap-2 text-right">
                  <span class="text-[#25221F] font-semibold tabular-nums">
                    ${ing.formattedQuantity}
                  </span>
                  ${
                    cost > 0
                      ? `
                    <span class="text-[10.5px] font-medium text-[#8C5C26] bg-[#FAF5EE] px-1.5 py-0.5 rounded-md border border-[#F3E2CE] tabular-nums" title="Cost based on pantry price">
                      ${formatZAR(cost)}
                    </span>
                  `
                      : ''
                  }
                </div>
              </div>
            `;
              })
              .join('')}
          </div>
        </div>

        <!-- Meal Completion Primary Action -->
        <div class="flex flex-col gap-2 pt-1">
          ${
            mealStatus === 'cooked'
              ? `
            <div class="flex items-center gap-2">
              <div class="flex-1 py-2.5 px-3 rounded-2xl bg-[#EAF5EA] text-[#3E703E] text-xs font-semibold flex items-center justify-center gap-2 border border-[#D5EAD5]">
                ${getIconSvg('check-circle', 'w-4 h-4 text-[#4A7C4A]')}
                Cooked & Ingredients Deducted
              </div>
              <button id="btn-undo-cooked" 
                      class="py-2.5 px-3 rounded-2xl glass-card text-xs font-medium text-[#77716D] hover:text-[#25221F] hover:bg-white/90 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      title="Undo cooking and restore deducted inventory">
                ${getIconSvg('rotate-ccw', 'w-3.5 h-3.5')}
                Undo
              </button>
            </div>
          `
              : `
            <button id="btn-mark-cooked" 
                    class="w-full py-3 px-4 rounded-2xl bg-[#8C5C26] hover:bg-[#73491E] text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer">
              ${getIconSvg('check-circle', 'w-4 h-4 text-amber-200')}
              Mark as Cooked & Deduct Stock
            </button>
          `
          }
        </div>

        <!-- Bottom Action Buttons matching reference -->
        <div class="flex items-center gap-2.5 pt-1 mt-auto">
          <button id="btn-edit-meal" 
                  class="flex-1 py-2.5 px-4 rounded-2xl bg-[#25221F] text-white text-xs font-medium flex items-center justify-center gap-2 hover:bg-[#3D3833] transition shadow-sm cursor-pointer">
            ${getIconSvg('edit', 'w-3.5 h-3.5')}
            Edit Meal
          </button>

          <button id="btn-remove-meal" 
                  class="w-11 h-11 rounded-2xl glass-card flex items-center justify-center text-[#77716D] hover:text-rose-600 hover:bg-white/80 transition cursor-pointer"
                  title="Remove Meal from Day" aria-label="Remove Meal from Day">
            ${getIconSvg('trash', 'w-4 h-4')}
          </button>
        </div>
      </div>
    `;

    this.bindEvents(recipe, plannedMeal);
  }

  private bindEvents(recipe: any, plannedMeal: any): void {
    const state = appState.getState();
    const dayIndex = state.selectedDayIndex;
    const mealType = state.selectedMealType;
    const currentServings = state.recipeDetailServings || recipe.servings || 4;

    const closeBtn = this.container.querySelector('#btn-close-recipe');
    closeBtn?.addEventListener('click', () => {
      appState.closeRecipePanel();
    });

    const decBtn = this.container.querySelector('#btn-servings-dec');
    decBtn?.addEventListener('click', () => {
      const cur = state.recipeDetailServings || 4;
      if (cur > 1) {
        appState.setRecipeDetailServings(cur - 1);
      }
    });

    const incBtn = this.container.querySelector('#btn-servings-inc');
    incBtn?.addEventListener('click', () => {
      const cur = state.recipeDetailServings || 4;
      appState.setRecipeDetailServings(cur + 1);
    });

    // Mark as cooked button
    const markCookedBtn = this.container.querySelector('#btn-mark-cooked');
    markCookedBtn?.addEventListener('click', () => {
      if (plannedMeal) {
        appState.openModal('meal-completion', {
          plannedMeal,
          recipe,
          servings: currentServings,
          dayIndex,
          mealType,
        });
      }
    });

    // Undo cooked button
    const undoCookedBtn = this.container.querySelector('#btn-undo-cooked');
    undoCookedBtn?.addEventListener('click', async () => {
      if (plannedMeal && plannedMeal.completionId) {
        const reversed = await inventoryService.undoMealCompletion(plannedMeal.completionId);
        if (reversed && state.currentPlan) {
          await mealPlanService.updateMealStatus(state.currentPlan.id, dayIndex, mealType, 'planned');
          appState.showToast(`Restored ingredients for ${recipe.title}`, 'info');
          await appState.setWeekOffset(state.weekOffset);
        }
      }
    });

    // Quick status dropdown
    const statusSelect = this.container.querySelector<HTMLSelectElement>('#select-meal-status-quick');
    statusSelect?.addEventListener('change', async (e) => {
      const newStatus = (e.target as HTMLSelectElement).value as MealCookingStatus;
      if (newStatus === 'cooked') {
        // Open completion modal
        if (plannedMeal) {
          appState.openModal('meal-completion', {
            plannedMeal,
            recipe,
            servings: currentServings,
            dayIndex,
            mealType,
          });
        }
      } else if (state.currentPlan) {
        await mealPlanService.updateMealStatus(state.currentPlan.id, dayIndex, mealType, newStatus);
        appState.showToast(`Updated status to ${newStatus}`, 'info');
        await appState.setWeekOffset(state.weekOffset);
      }
    });

    const editBtn = this.container.querySelector('#btn-edit-meal');
    editBtn?.addEventListener('click', () => {
      appState.openModal('edit-recipe', { recipe });
    });

    const removeBtn = this.container.querySelector('#btn-remove-meal');
    removeBtn?.addEventListener('click', async () => {
      if (state.currentPlan) {
        await mealPlanService.removeMeal(state.currentPlan.id, state.selectedDayIndex, state.selectedMealType);
        await appState.setWeekOffset(state.weekOffset);
      }
    });
  }
}
