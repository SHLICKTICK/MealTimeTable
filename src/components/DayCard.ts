import { DayPlan } from '../models/WeeklyPlan';
import { appState } from '../app/state';
import { getIconSvg } from '../utils/iconHelper';

const DAY_ACCENT_CLASSES = [
  'day-accent-monday',
  'day-accent-tuesday',
  'day-accent-wednesday',
  'day-accent-thursday',
  'day-accent-friday',
  'day-accent-saturday',
  'day-accent-sunday',
];

export class DayCard {
  private container: HTMLElement;
  private day: DayPlan;

  constructor(day: DayPlan) {
    this.day = day;
    this.container = document.createElement('div');
    this.render();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  update(day: DayPlan): void {
    this.day = day;
    this.render();
  }

  render(): void {
    const state = appState.getState();
    const isDayActive = state.selectedDayIndex === this.day.dayIndex;
    const isBreakfastActive = isDayActive && state.selectedMealType === 'breakfast';
    const isDinnerActive = isDayActive && state.selectedMealType === 'dinner';

    const accentClass = DAY_ACCENT_CLASSES[this.day.dayIndex % DAY_ACCENT_CLASSES.length];
    const activeCardClass = isDayActive ? 'glass-card-active' : '';

    this.container.className = `glass-card ${accentClass} ${activeCardClass} px-5 py-3 flex items-center justify-between gap-4 cursor-pointer select-none transition-all`;

    const bMeal = this.day.breakfast;
    const dMeal = this.day.dinner;

    const bStatusBadge =
      bMeal?.status === 'cooked'
        ? `<span class="inline-flex items-center gap-0.5 text-[9.5px] font-semibold text-[#3E703E] bg-[#EAF5EA] px-1.5 py-0.2 rounded-full border border-[#D5EAD5]">
             ${getIconSvg('check', 'w-2.5 h-2.5')} Cooked
           </span>`
        : bMeal?.status === 'cooking'
        ? `<span class="inline-flex items-center gap-0.5 text-[9.5px] font-semibold text-[#B87A24] bg-[#FDF4E7] px-1.5 py-0.2 rounded-full border border-[#F6DEBD]">
             Cooking
           </span>`
        : '';

    const dStatusBadge =
      dMeal?.status === 'cooked'
        ? `<span class="inline-flex items-center gap-0.5 text-[9.5px] font-semibold text-[#3E703E] bg-[#EAF5EA] px-1.5 py-0.2 rounded-full border border-[#D5EAD5]">
             ${getIconSvg('check', 'w-2.5 h-2.5')} Cooked
           </span>`
        : dMeal?.status === 'cooking'
        ? `<span class="inline-flex items-center gap-0.5 text-[9.5px] font-semibold text-[#B87A24] bg-[#FDF4E7] px-1.5 py-0.2 rounded-full border border-[#F6DEBD]">
             Cooking
           </span>`
        : '';

    this.container.innerHTML = `
      <!-- Left: Day & Date -->
      <div class="flex flex-col min-w-[90px] shrink-0 pl-1">
        <span class="font-serif text-lg md:text-[19px] font-semibold text-[#25221F] leading-tight">
          ${this.day.dayName}
        </span>
        <span class="text-xs text-[#77716D] font-sans font-medium mt-0.5">
          ${this.day.dateStr}
        </span>
      </div>

      <!-- Center-Left: Breakfast Section -->
      <div class="meal-slot-breakfast flex-1 flex items-center justify-between px-3 py-1.5 rounded-xl transition ${
        isBreakfastActive ? 'bg-white/60 shadow-xs' : 'hover:bg-white/30'
      }" data-day="${this.day.dayIndex}" data-meal="breakfast">
        <div class="flex flex-col pr-2">
          <div class="flex items-center gap-1.5 text-[11px] font-medium text-[#B87A38]">
            ${getIconSvg('sun', 'w-3 h-3 text-[#D9A441]')}
            <span>Breakfast</span>
            ${bStatusBadge}
          </div>
          <span class="text-sm md:text-[14.5px] font-semibold text-[#25221F] truncate mt-0.5 max-w-[150px] md:max-w-[200px]">
            ${bMeal ? bMeal.title : '<span class="text-[#77716D]/60 italic font-normal">Add breakfast</span>'}
          </span>
        </div>

        <!-- Thumbnail Image -->
        <div class="w-11 h-11 shrink-0 rounded-full overflow-hidden bg-[#F4E9E2] border border-white/90 shadow-sm relative">
          ${
            bMeal?.imageUrl
              ? `<img src="${bMeal.imageUrl}" alt="${bMeal.title}" class="w-full h-full object-cover transition-transform duration-300 hover:scale-105" loading="lazy" />`
              : `<div class="w-full h-full flex items-center justify-center text-[#B87A38]/50">${getIconSvg('sun', 'w-5 h-5')}</div>`
          }
          ${
            bMeal?.status === 'cooked'
              ? `<div class="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-600 rounded-full flex items-center justify-center text-white border border-white">
                   ${getIconSvg('check', 'w-2 h-2')}
                 </div>`
              : ''
          }
        </div>
      </div>

      <!-- Center-Right: Dinner Section -->
      <div class="meal-slot-dinner flex-1 flex items-center justify-between px-3 py-1.5 rounded-xl transition ${
        isDinnerActive ? 'bg-white/60 shadow-xs' : 'hover:bg-white/30'
      }" data-day="${this.day.dayIndex}" data-meal="dinner">
        <div class="flex flex-col pr-2">
          <div class="flex items-center gap-1.5 text-[11px] font-medium text-[#7A6B5D]">
            ${getIconSvg('moon', 'w-3 h-3 text-[#8C6D4C]')}
            <span>Dinner</span>
            ${dStatusBadge}
          </div>
          <span class="text-sm md:text-[14.5px] font-semibold text-[#25221F] truncate mt-0.5 max-w-[150px] md:max-w-[200px]">
            ${dMeal ? dMeal.title : '<span class="text-[#77716D]/60 italic font-normal">Add dinner</span>'}
          </span>
        </div>

        <!-- Thumbnail Image -->
        <div class="w-11 h-11 shrink-0 rounded-full overflow-hidden bg-[#F4E9E2] border border-white/90 shadow-sm relative">
          ${
            dMeal?.imageUrl
              ? `<img src="${dMeal.imageUrl}" alt="${dMeal.title}" class="w-full h-full object-cover transition-transform duration-300 hover:scale-105" loading="lazy" />`
              : `<div class="w-full h-full flex items-center justify-center text-[#7A6B5D]/50">${getIconSvg('moon', 'w-5 h-5')}</div>`
          }
          ${
            dMeal?.status === 'cooked'
              ? `<div class="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-600 rounded-full flex items-center justify-center text-white border border-white">
                   ${getIconSvg('check', 'w-2 h-2')}
                 </div>`
              : ''
          }
        </div>
      </div>

      <!-- Right: Navigation Chevron Button -->
      <div class="shrink-0 pl-1">
        <button class="btn-day-action w-7 h-7 rounded-full flex items-center justify-center bg-white/40 hover:bg-white/80 border border-white/70 shadow-2xs text-[#77716D] hover:text-[#25221F] transition cursor-pointer"
                title="Edit Day Plan" aria-label="Edit Day Plan">
          ${getIconSvg('chevron-right', 'w-3.5 h-3.5')}
        </button>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const breakfastSlot = this.container.querySelector('.meal-slot-breakfast');
    breakfastSlot?.addEventListener('click', (e) => {
      e.stopPropagation();
      appState.selectMeal(this.day.dayIndex, 'breakfast');
    });

    const dinnerSlot = this.container.querySelector('.meal-slot-dinner');
    dinnerSlot?.addEventListener('click', (e) => {
      e.stopPropagation();
      appState.selectMeal(this.day.dayIndex, 'dinner');
    });

    const actionBtn = this.container.querySelector('.btn-day-action');
    actionBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      appState.openModal('assign-meal', { dayIndex: this.day.dayIndex, mealType: 'dinner' });
    });

    this.container.addEventListener('click', () => {
      const state = appState.getState();
      appState.selectMeal(this.day.dayIndex, state.selectedMealType);
    });
  }
}
