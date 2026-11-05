import { appState } from '../app/state';
import { getIconSvg, getIngredientMiniIconSvg } from '../utils/iconHelper';
import { scaleIngredientsList } from '../utils/ingredientScaling';
import { mealPlanService } from '../services/mealPlanService';
import { inventoryService } from '../services/inventoryService';
import { DAY_NAMES } from '../utils/dateUtils';
import { MealCookingStatus } from '../models/PlannedMeal';
import {
  calculateRecipeCostBreakdown,
  formatZAR,
} from '../utils/pricingUtils';

export class RecipePanel {
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('aside');
    this.container.className =
      'recipe-panel-desktop w-[390px] xl:w-[410px] shrink-0 h-full flex flex-col justify-between rounded-[28px] bg-white/46 backdrop-blur-2xl border border-white/85 p-4 overflow-y-auto select-none shadow-[0_14px_40px_-8px_rgba(85,58,30,0.08),inset_0_1px_0_rgba(255,255,255,0.92)] transition-all relative';
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
          <div class="w-16 h-16 rounded-2xl bg-white/50 border border-white/80 flex items-center justify-center text-[#8C5C26]/70 mb-4">
            ${getIconSvg('utensils', 'w-8 h-8')}
          </div>
          <h3 class="text-lg font-serif font-medium text-[#221F1C] mb-1">No Meal Selected</h3>
          <p class="text-xs text-[#6B6560] max-w-[220px]">
            Select any breakfast or dinner slot from the weekly timetable to view ingredients and details.
          </p>
          <button id="btn-add-meal-empty" 
                  class="mt-4 px-5 py-2.5 rounded-full bg-[#221F1C] text-white text-xs font-medium hover:opacity-90 transition cursor-pointer shadow-sm">
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

    // Compact cooking action pill aligned beside Monday • Dinner tag
    let cookActionBadge = '';
    if (plannedMeal) {
      if (mealStatus === 'cooked') {
        cookActionBadge = `
          <div class="flex items-center gap-1.5">
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#EAF5EA] text-[#3E703E] border border-[#D5EAD5] shadow-2xs">
              ${getIconSvg('check-circle', 'w-3 h-3 text-[#4A7C4A]')}
              Cooked
            </span>
            <button id="btn-undo-cooked" 
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/75 hover:bg-white text-[#6B6560] hover:text-[#221F1C] border border-white/90 shadow-2xs transition cursor-pointer"
                    title="Undo cooking and restore deducted inventory">
              ${getIconSvg('rotate-ccw', 'w-3 h-3')}
              Undo
            </button>
          </div>
        `;
      } else {
        cookActionBadge = `
          <button id="btn-mark-cooked" 
                  class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#FAF2E6]/90 hover:bg-[#F5E6D0] text-[#8C5C26] border border-[#E9D1B4] shadow-2xs transition cursor-pointer"
                  title="Mark meal as cooked and deduct ingredients from pantry">
            ${getIconSvg('check-circle', 'w-3 h-3 text-[#B87A28]')}
            Mark as Cooked
          </button>
        `;
      }
    }

    this.container.innerHTML = `
      <div class="flex flex-col gap-3.5 flex-1">
        <!-- Top Media Card with Floating Close Button -->
        <div class="relative w-full h-[225px] xl:h-[240px] rounded-[20px] overflow-hidden shadow-sm border border-white/90 bg-[#F4E9E2] shrink-0">
          <img src="${recipe.imageUrl}" alt="${recipe.title}" 
               class="w-full h-full object-cover" />
          
          <!-- Close button in top-right corner matching reference -->
          <button id="btn-close-recipe" 
                  class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/75 hover:bg-white backdrop-blur-md border border-white flex items-center justify-center text-[#221F1C] shadow-sm transition cursor-pointer"
                  title="Close panel" aria-label="Close panel">
            ${getIconSvg('x', 'w-4 h-4')}
          </button>
        </div>

        <!-- Meta Category Pill & Compact Cooking Action -->
        <div class="flex items-center justify-between gap-2 pt-0.5">
          <span class="inline-flex items-center px-3.5 py-1 rounded-full text-[11.5px] font-medium text-[#221F1C] bg-white/72 border border-white/90 shadow-[0_2px_8px_rgba(80,55,30,0.04)]">
            ${categoryTag}
          </span>
          ${cookActionBadge}
        </div>

        <!-- Recipe Title & Description -->
        <div class="flex flex-col gap-1 -mt-0.5">
          <h3 class="text-[26px] xl:text-[29px] font-serif font-normal text-[#221F1C] leading-[1.12] tracking-[-0.015em]">
            ${recipe.title}
          </h3>
          <p class="text-[12.5px] text-[#6B6560] leading-relaxed font-normal">
            ${recipe.description || 'A simple and delicious family dinner.'}
          </p>
        </div>

        <!-- Bright Frosted Inner Ingredients Card -->
        <div class="rounded-[22px] bg-white/62 backdrop-blur-md border border-white/90 p-4 flex flex-col gap-2 shadow-[0_6px_20px_-6px_rgba(85,58,30,0.05),inset_0_1px_0_#FFFFFF]">
          <div class="flex items-center justify-between pb-1.5 border-b border-[#25221F]/6">
            <div class="flex items-center gap-2 text-[13.5px] font-medium text-[#221F1C]">
              <span class="text-[#221F1C]">${getIconSvg('utensils', 'w-4 h-4')}</span>
              <span>Ingredients (Serves ${currentServings})</span>
            </div>

            <!-- Dynamic Serving Stepper -->
            <div class="flex items-center gap-1 bg-white/75 px-2 py-0.5 rounded-full border border-white/95 shadow-2xs">
              <button id="btn-servings-dec" 
                      class="w-4 h-4 flex items-center justify-center text-[#6B6560] hover:text-[#221F1C] cursor-pointer"
                      title="Decrease servings" aria-label="Decrease servings">
                ${getIconSvg('minus', 'w-2.5 h-2.5')}
              </button>
              <span class="text-[11.5px] font-semibold text-[#221F1C] w-4 text-center tabular-nums">${currentServings}</span>
              <button id="btn-servings-inc" 
                      class="w-4 h-4 flex items-center justify-center text-[#6B6560] hover:text-[#221F1C] cursor-pointer"
                      title="Increase servings" aria-label="Increase servings">
                ${getIconSvg('plus', 'w-2.5 h-2.5')}
              </button>
            </div>
          </div>

          <!-- Scaled Ingredients Rows with Miniature Culinary Icons -->
          <div class="flex flex-col divide-y divide-[#25221F]/5 max-h-[245px] overflow-y-auto pr-0.5">
            ${scaledIngredients
              .map(
                (ing) => `
              <div class="flex items-center justify-between py-2 text-[12.5px]">
                <span class="text-[#221F1C] font-normal flex items-center gap-2.5 min-w-0 pr-2">
                  ${getIngredientMiniIconSvg(ing.name, ing.category)}
                  <span class="truncate">${ing.name}</span>
                </span>
                <span class="text-[#221F1C] font-normal tabular-nums shrink-0">
                  ${ing.formattedQuantity}
                </span>
              </div>
            `
              )
              .join('')}
          </div>

          ${
            costBreakdown.totalCost > 0
              ? `
            <div class="flex items-center justify-between pt-2 mt-0.5 border-t border-[#25221F]/6 text-[11px] text-[#7A746E]">
              <span>Estimated Cost</span>
              <span class="font-semibold text-[#8C5C26] tabular-nums">
                ${formatZAR(costBreakdown.totalCost)} · ${formatZAR(costBreakdown.totalCost / (currentServings || 1))} / serving
              </span>
            </div>
          `
              : ''
          }
        </div>
      </div>

      <!-- Bottom Signature Pill Footer matching reference -->
      <div class="flex items-center gap-2.5 pt-3 mt-auto shrink-0">
        <button id="btn-edit-meal" 
                class="flex-1 py-3 px-5 rounded-full text-white text-[13px] font-medium flex items-center justify-center gap-2 hover:opacity-95 transition shadow-[0_8px_20px_-4px_rgba(25,22,19,0.35)] cursor-pointer"
                style="background: linear-gradient(180deg, #2D2A27 0%, #191715 100%);">
          ${getIconSvg('edit', 'w-3.5 h-3.5')}
          Edit Meal
        </button>

        <button id="btn-remove-meal" 
                class="w-11 h-11 rounded-full bg-white/75 hover:bg-white border border-white/95 flex items-center justify-center text-[#3D3935] hover:text-rose-600 shadow-sm transition cursor-pointer shrink-0"
                title="Remove Meal from Day" aria-label="Remove Meal from Day">
          ${getIconSvg('trash', 'w-4 h-4')}
        </button>
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
