import { appState } from '../app/state';
import { getIconSvg } from '../utils/iconHelper';

export class BudgetSummary {
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.className =
      'w-full rounded-[20px] bg-white/54 backdrop-blur-xl border border-white/85 px-6 py-3 mt-1 flex items-center justify-between select-none shadow-[0_6px_24px_-4px_rgba(90,60,30,0.05),inset_0_1px_0_rgba(255,255,255,0.95)]';
    this.render();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  render(): void {
    const state = appState.getState();
    const plan = state.currentPlan;

    let plannedDinners = 0;
    if (plan) {
      plan.days.forEach((d) => {
        if (d.dinner) plannedDinners++;
      });
    }

    const budget = plan ? plan.estimatedBudgetZAR : 1250.0;
    const mealsCount = plannedDinners || 7;
    const avgPerDay = mealsCount > 0 ? budget / 7 : 0;
    const formattedBudget = `R${budget.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formattedAvg = `R${avgPerDay.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    this.container.innerHTML = `
      <!-- Column 1: Weekly Meal Budget (Est.) -->
      <div class="flex items-center gap-3.5 flex-1">
        <div class="shrink-0 flex items-center justify-center">
          ${getIconSvg('chart-bar-filled', 'w-6 h-6')}
        </div>
        <div class="flex flex-col">
          <span class="text-[11.5px] text-[#6E6863] font-normal tracking-wide">
            Weekly Meal Budget (Est.)
          </span>
          <span class="text-[19px] md:text-[21px] font-medium text-[#221F1C] font-sans tabular-nums tracking-tight leading-snug">
            ${formattedBudget}
          </span>
        </div>
      </div>

      <!-- Hairline divider -->
      <div class="h-8 w-px bg-[#25221F]/10 mx-4 shrink-0"></div>

      <!-- Column 2: Total Meals -->
      <div class="flex items-center gap-3.5 flex-1 pl-2">
        <div class="shrink-0 flex items-center justify-center text-[#3F3B37]">
          ${getIconSvg('utensils', 'w-[22px] h-[22px]')}
        </div>
        <div class="flex flex-col">
          <span class="text-[11.5px] text-[#6E6863] font-normal tracking-wide">
            Meals
          </span>
          <span class="text-[19px] md:text-[21px] font-medium text-[#221F1C] font-sans tabular-nums tracking-tight leading-snug">
            ${mealsCount}
          </span>
        </div>
      </div>

      <!-- Hairline divider -->
      <div class="h-8 w-px bg-[#25221F]/10 mx-4 shrink-0"></div>

      <!-- Column 3: Avg. per Day -->
      <div class="flex items-center gap-3.5 flex-1 pl-2">
        <div class="shrink-0 flex items-center justify-center">
          ${getIconSvg('leaf-filled', 'w-6 h-6')}
        </div>
        <div class="flex flex-col">
          <span class="text-[11.5px] text-[#6E6863] font-normal tracking-wide">
            Avg. per Day
          </span>
          <span class="text-[19px] md:text-[21px] font-medium text-[#221F1C] font-sans tabular-nums tracking-tight leading-snug">
            ${formattedAvg}
          </span>
        </div>
      </div>
    `;
  }
}
