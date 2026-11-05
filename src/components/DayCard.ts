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

    this.container.className = `day-card-capsule ${accentClass} ${activeCardClass} pl-4 pr-2.5 py-2 flex items-center justify-between gap-3 cursor-pointer select-none transition-all`;

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
      <div class="flex flex-col w-[108px] xl:w-[122px] shrink-0 pl-1.5">
        <span class="font-serif text-[17px] xl:text-[18.5px] font-medium text-[#221F1C] leading-tight">
          ${this.day.dayName}
        </span>
        <span class="text-[11.5px] text-[#7A746E] font-sans font-normal mt-0.5">
          ${this.day.dateStr}
        </span>
      </div>

      <!-- Right: Inner Frosted White Meal Capsule (Breakfast + Divider + Dinner + Chevron) -->
      <div class="day-inner-glass flex-1 min-w-0 flex items-center px-3.5 py-1.5 gap-2">
        <!-- Breakfast Section -->
        <div class="meal-slot-breakfast flex-1 min-w-0 flex items-center justify-between gap-2 px-2.5 py-1 rounded-xl transition ${
          isBreakfastActive ? 'bg-white/65 shadow-2xs' : 'hover:bg-white/40'
        }" data-day="${this.day.dayIndex}" data-meal="breakfast">
          <div class="flex flex-col min-w-0 pr-1">
            <div class="flex items-center gap-1.5 text-[11px] font-medium text-[#B87A28]">
              ${getIconSvg('sun', 'w-3 h-3 text-[#D99B38] shrink-0')}
              <span>Breakfast</span>
              ${bStatusBadge}
            </div>
            <span class="text-[13.5px] xl:text-[14.5px] font-medium text-[#221F1C] truncate mt-0.5">
              ${bMeal ? bMeal.title : '<span class="text-[#77716D]/60 italic font-normal">Add breakfast</span>'}
            </span>
          </div>

          <!-- Circular Plate Thumbnail -->
          <div class="w-12 h-12 xl:w-[52px] xl:h-[52px] shrink-0 rounded-full overflow-hidden bg-white border-2 border-white shadow-[0_4px_12px_rgba(60,40,20,0.12)] relative">
            ${
              bMeal?.imageUrl
                ? `<img src="${bMeal.imageUrl}" alt="${bMeal.title}" class="w-full h-full object-cover transition-transform duration-300 hover:scale-105" loading="lazy" />`
                : `<div class="w-full h-full flex items-center justify-center text-[#B87A38]/50">${getIconSvg('sun', 'w-5 h-5')}</div>`
            }
            ${
              bMeal?.status === 'cooked'
                ? `<div class="absolute bottom-0 right-0 w-4 h-4 bg-emerald-600 rounded-full flex items-center justify-center text-white border border-white">
                     ${getIconSvg('check', 'w-2.5 h-2.5')}
                   </div>`
                : ''
            }
          </div>
        </div>

        <!-- Subtle Vertical Hairline Divider -->
        <div class="w-px h-9 bg-[#25221F]/10 shrink-0"></div>

        <!-- Dinner Section -->
        <div class="meal-slot-dinner flex-1 min-w-0 flex items-center justify-between gap-2 px-2.5 py-1 rounded-xl transition ${
          isDinnerActive ? 'bg-white/65 shadow-2xs' : 'hover:bg-white/40'
        }" data-day="${this.day.dayIndex}" data-meal="dinner">
          <div class="flex flex-col min-w-0 pr-1">
            <div class="flex items-center gap-1.5 text-[11px] font-medium text-[#7A726B]">
              ${getIconSvg('moon', 'w-3 h-3 text-[#8C7A6B] shrink-0')}
              <span>Dinner</span>
              ${dStatusBadge}
            </div>
            <span class="text-[13.5px] xl:text-[14.5px] font-medium text-[#221F1C] truncate mt-0.5">
              ${dMeal ? dMeal.title : '<span class="text-[#77716D]/60 italic font-normal">Add dinner</span>'}
            </span>
          </div>

          <!-- Circular Plate Thumbnail -->
          <div class="w-12 h-12 xl:w-[52px] xl:h-[52px] shrink-0 rounded-full overflow-hidden bg-white border-2 border-white shadow-[0_4px_12px_rgba(60,40,20,0.12)] relative">
            ${
              dMeal?.imageUrl
                ? `<img src="${dMeal.imageUrl}" alt="${dMeal.title}" class="w-full h-full object-cover transition-transform duration-300 hover:scale-105" loading="lazy" />`
                : `<div class="w-full h-full flex items-center justify-center text-[#7A726B]/50">${getIconSvg('moon', 'w-5 h-5')}</div>`
            }
            ${
              dMeal?.status === 'cooked'
                ? `<div class="absolute bottom-0 right-0 w-4 h-4 bg-emerald-600 rounded-full flex items-center justify-center text-white border border-white">
                     ${getIconSvg('check', 'w-2.5 h-2.5')}
                   </div>`
                : ''
            }
          </div>
        </div>

        <!-- Right: Navigation Chevron Button -->
        <div class="shrink-0 pl-0.5 pr-0.5">
          <button class="btn-day-action w-7 h-7 rounded-full flex items-center justify-center bg-white/75 hover:bg-white border border-white/95 shadow-2xs text-[#4A4542] hover:text-[#221F1C] transition cursor-pointer"
                  title="Edit Day Plan" aria-label="Edit Day Plan">
            ${getIconSvg('chevron-right', 'w-3.5 h-3.5')}
          </button>
        </div>
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
