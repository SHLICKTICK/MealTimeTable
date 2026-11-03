import { appState } from '../app/state';
import { WeeklyHeader } from '../components/WeeklyHeader';
import { DayCard } from '../components/DayCard';
import { BudgetSummary } from '../components/BudgetSummary';

export class WeeklyPlanPage {
  private container: HTMLElement;
  private header: WeeklyHeader;
  private budgetSummary: BudgetSummary;
  private dayCardList: DayCard[] = [];

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'w-full flex-1 flex flex-col justify-between gap-3 select-none';
    this.header = new WeeklyHeader();
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
    this.container.appendChild(this.header.getElement());

    // 7 horizontal day cards
    const daysContainer = document.createElement('div');
    daysContainer.className = 'flex flex-col gap-2.5 flex-1';

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
    this.header.render();
    this.budgetSummary.render();
    this.render();
  }
}
