import { appState } from '../app/state';
import { DayCard } from '../components/DayCard';
import { BudgetSummary } from '../components/BudgetSummary';

export class WeeklyPlanPage {
  private container: HTMLElement;
  private budgetSummary: BudgetSummary;
  private dayCardList: DayCard[] = [];

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'w-full flex-1 flex flex-col justify-between gap-2.5 select-none';
    this.budgetSummary = new BudgetSummary();
    this.render();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  render(): void {
    const state = appState.getState();
    const plan = state.currentPlan;

    this.container.innerHTML = '';

    // 7 horizontal day cards
    const daysContainer = document.createElement('div');
    daysContainer.className = 'flex flex-col gap-2.5 flex-1 justify-between';

    this.dayCardList = [];
    if (plan && plan.days) {
      plan.days.forEach((day) => {
        const card = new DayCard(day);
        this.dayCardList.push(card);
        daysContainer.appendChild(card.getElement());
      });
    }

    this.container.appendChild(daysContainer);
    this.container.appendChild(this.budgetSummary.getElement());
  }

  update(): void {
    this.budgetSummary.render();
    this.render();
  }
}
