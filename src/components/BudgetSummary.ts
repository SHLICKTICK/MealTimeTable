import { appState } from '../app/state';
import { getIconSvg } from '../utils/iconHelper';

export class BudgetSummary {
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.className =
      'w-full glass-card px-6 py-4 mt-1 flex items-center justify-between select-none shadow-sm';
    this.render();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  render(): void {
    const state = appState.getState();
    const plan = state.currentPlan;

    let plannedDinners = 0;
    let plannedBreakfasts = 0;
    if (plan) {
      plan.days.forEach((d) => {
        if (d.dinner) plannedDinners++;
        if (d.breakfast) plannedBreakfasts++;
      });
    }

    const budget = plan ? plan.estimatedBudgetZAR : 1250.0;
    const mealsCount = plannedDinners || 7;
    const avgPerDay = mealsCount > 0 ? (budget / 7) : 0;
    const formattedBudget = `R${budget.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formattedAvg = `R${avgPerDay.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    this.container.innerHTML = `
      <!-- Column 1: Weekly Meal Budget (Est.) -->
      <div class="flex items-center gap-3.5 flex-1">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-[#D9A441] bg-[#FBF5ED] border border-[#F3E2CE] shadow-2xs">
          ${getIconSvg('chart-bar', 'w-5 h-5')}
        </div>
        <div class="flex flex-col">
          <span class="text-xs text-[#77716D] font-medium tracking-wide">
            Weekly Meal Budget (Est.)
          </span>
          <span class="text-xl md:text-2xl font-bold text-[#25221F] font-sans tracking-tight">
            ${formattedBudget}
          </span>
        </div>
      </div>

      <!-- Hairline divider -->
      <div class="h-8 w-px bg-[#25221F]/10 mx-4"></div>

      <!-- Column 2: Total Meals -->
      <div class="flex items-center gap-3.5 flex-1 pl-2">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-[#25221F] bg-white/50 border border-white/80 shadow-2xs">
          ${getIconSvg('utensils', 'w-5 h-5 text-[#77716D]')}
        </div>
        <div class="flex flex-col">
          <span class="text-xs text-[#77716D] font-medium tracking-wide">
            Meals
          </span>
          <span class="text-xl md:text-2xl font-bold text-[#25221F] font-sans tracking-tight">
            ${mealsCount}
          </span>
        </div>
      </div>

      <!-- Hairline divider -->
      <div class="h-8 w-px bg-[#25221F]/10 mx-4"></div>

      <!-- Column 3: Avg. per Day -->
      <div class="flex items-center gap-3.5 flex-1 pl-2">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-[#558B55] bg-[#F2F7F2] border border-[#D5EAD5] shadow-2xs">
          ${getIconSvg('sprout', 'w-5 h-5')}
        </div>
        <div class="flex flex-col">
          <span class="text-xs text-[#77716D] font-medium tracking-wide">
            Avg. per Day
          </span>
          <span class="text-xl md:text-2xl font-bold text-[#25221F] font-sans tracking-tight">
            ${formattedAvg}
          </span>
        </div>
      </div>
    `;
  }
}
