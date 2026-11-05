import { appState } from '../app/state';
import { getIconSvg } from '../utils/iconHelper';
import { formatWeekSelectorLabel } from '../utils/dateUtils';

export class WeeklyHeader {
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'w-full flex items-center justify-between gap-6 pb-3.5 pt-0.5 select-none shrink-0';
    this.render();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  render(): void {
    const state = appState.getState();
    const weekLabel = formatWeekSelectorLabel(state.weekOffset);

    this.container.innerHTML = `
      <!-- Left Title & Center-Right Week Controls (aligned above Day Cards column) -->
      <div class="flex-1 min-w-0 flex items-center justify-between gap-4">
        <div class="flex flex-col">
          <h2 class="text-[27px] md:text-[32px] xl:text-[36px] font-serif font-normal text-[#221F1C] tracking-[-0.015em] leading-[1.08]">
            This Week’s Meal Plan
          </h2>
          <p class="text-[12.5px] md:text-[13.5px] text-[#6B6560] mt-1 font-normal tracking-wide">
            Monday – Sunday
          </p>
        </div>

        <!-- Week Controls -->
        <div class="flex items-center gap-2 shrink-0">
          <button id="btn-prev-week" class="glass-circle-btn" title="Previous Week" aria-label="Previous Week">
            ${getIconSvg('chevron-left', 'w-4 h-4 text-[#221F1C]')}
          </button>

          <button id="btn-week-selector" 
                  class="glass-pill px-4 py-2 text-xs md:text-[13px] font-medium text-[#221F1C] flex items-center gap-2 cursor-pointer hover:bg-white/80 transition shadow-sm">
            <span>${weekLabel}</span>
            ${getIconSvg('chevron-down', 'w-3.5 h-3.5 text-[#6B6560]')}
          </button>

          <button id="btn-next-week" class="glass-circle-btn" title="Next Week" aria-label="Next Week">
            ${getIconSvg('chevron-right', 'w-4 h-4 text-[#221F1C]')}
          </button>

          <!-- Compact profile button on viewports below xl -->
          <button class="btn-user-profile-trigger xl:hidden w-9 h-9 rounded-full flex items-center justify-center bg-[#C8C3BC]/45 hover:bg-white/80 backdrop-blur-md border border-white/75 shadow-xs text-[#221F1C] transition cursor-pointer ml-1" 
                  title="Account Settings" 
                  aria-label="User Profile">
            ${getIconSvg('user', 'w-4 h-4 text-[#221F1C]')}
          </button>
        </div>
      </div>

      <!-- Far-Right Profile Avatar (aligned above Recipe Panel over botanical background) -->
      <div class="hidden xl:flex w-[390px] xl:w-[410px] shrink-0 justify-end items-center">
        <button id="btn-user-profile" 
                class="btn-user-profile-trigger w-9 h-9 rounded-full flex items-center justify-center bg-[#C8C3BC]/45 hover:bg-white/80 backdrop-blur-md border border-white/75 shadow-xs text-[#221F1C] transition cursor-pointer" 
                title="Account Settings" 
                aria-label="User Profile">
          ${getIconSvg('user', 'w-4 h-4 text-[#221F1C]')}
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

    const userBtns = this.container.querySelectorAll('.btn-user-profile-trigger');
    userBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        appState.setPage('settings');
      });
    });
  }
}
