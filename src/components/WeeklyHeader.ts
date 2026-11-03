import { appState } from '../app/state';
import { getIconSvg } from '../utils/iconHelper';
import { formatWeekSelectorLabel } from '../utils/dateUtils';

export class WeeklyHeader {
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'w-full flex items-center justify-between pb-3 pt-1 select-none';
    this.render();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  render(): void {
    const state = appState.getState();
    const weekLabel = formatWeekSelectorLabel(state.weekOffset);

    this.container.innerHTML = `
      <div class="flex flex-col">
        <h2 class="text-3xl md:text-[34px] font-serif font-medium text-[#25221F] tracking-tight leading-none">
          This Week’s Meal Plan
        </h2>
        <p class="text-xs md:text-sm text-[#77716D] mt-1.5 font-normal tracking-wide">
          Monday – Sunday
        </p>
      </div>

      <!-- Week Controls & Avatar matching reference exactly -->
      <div class="flex items-center gap-2.5">
        <button id="btn-prev-week" class="glass-circle-btn" title="Previous Week" aria-label="Previous Week">
          ${getIconSvg('chevron-left', 'w-4 h-4 text-[#25221F]')}
        </button>

        <button id="btn-week-selector" 
                class="glass-pill px-4 py-2 text-xs md:text-sm font-medium text-[#25221F] flex items-center gap-2 cursor-pointer hover:bg-white/80 transition shadow-sm">
          <span>${weekLabel}</span>
          ${getIconSvg('chevron-down', 'w-3.5 h-3.5 text-[#77716D]')}
        </button>

        <button id="btn-next-week" class="glass-circle-btn" title="Next Week" aria-label="Next Week">
          ${getIconSvg('chevron-right', 'w-4 h-4 text-[#25221F]')}
        </button>

        <button id="btn-user-profile" 
                class="glass-circle-btn ml-1 hover:bg-white/90" 
                title="Account Settings" 
                aria-label="User Profile">
          ${getIconSvg('user', 'w-4 h-4 text-[#25221F]')}
        </button>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const prevBtn = this.container.querySelector('#btn-prev-week');
    prevBtn?.addEventListener('click', () => {
      const state = appState.getState();
      appState.setWeekOffset(state.weekOffset - 1);
    });

    const nextBtn = this.container.querySelector('#btn-next-week');
    nextBtn?.addEventListener('click', () => {
      const state = appState.getState();
      appState.setWeekOffset(state.weekOffset + 1);
    });

    const weekBtn = this.container.querySelector('#btn-week-selector');
    weekBtn?.addEventListener('click', () => {
      appState.openModal('week-selector');
    });

    const userBtn = this.container.querySelector('#btn-user-profile');
    userBtn?.addEventListener('click', () => {
      appState.setPage('settings');
    });
  }
}
