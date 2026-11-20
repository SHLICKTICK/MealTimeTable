import { BaseModal } from '../BaseModal';
import { getWeekDates } from '../../../utils/dateUtils';
import { getIconSvg } from '../../../utils/iconHelper';

export class WeekSelectorModal extends BaseModal<void> {
  render(overlay: HTMLElement): void {
    const signal = this.beginRender(overlay);
    const curOffset = this.deps.state.getState().weekOffset;

    overlay.innerHTML = `
      <div class="glass-panel w-full max-w-sm p-6 flex flex-col gap-4 bg-white/95 rounded-3xl shadow-xl animate-fade-in">
        <div class="flex items-center justify-between pb-2 border-b border-[#25221F]/10">
          <h3 class="text-lg font-serif font-bold text-[#25221F]">Select Timetable Week</h3>
          <button id="modal-close-btn" class="glass-circle-btn">
            ${getIconSvg('x', 'w-4 h-4')}
          </button>
        </div>

        <div class="flex flex-col gap-2">
          ${[-2, -1, 0, 1, 2, 3]
            .map((offset) => {
              const { dayDates } = getWeekDates(offset);
              const label =
                offset === 0
                  ? 'This Week (Current)'
                  : offset === 1
                  ? 'Next Week'
                  : offset === -1
                  ? 'Last Week'
                  : `Week ${offset > 0 ? `+${offset}` : offset}`;
              const dateRange = `${dayDates[0].dateStr} – ${dayDates[6].dateStr}`;
              const isSelected = curOffset === offset;

              return `
              <button class="week-opt-btn flex items-center justify-between p-3 rounded-2xl glass-card transition cursor-pointer ${
                isSelected ? 'border-[#D9A441] bg-[#FBF5ED]' : 'hover:bg-white'
              }" data-offset="${offset}">
                <div class="flex flex-col text-left">
                  <span class="text-xs font-semibold ${isSelected ? 'text-[#8C5C26]' : 'text-[#25221F]'}">${label}</span>
                  <span class="text-[11px] text-[#77716D]">${dateRange}</span>
                </div>
                ${isSelected ? `<span class="text-[#8C5C26]">${getIconSvg('check', 'w-4 h-4')}</span>` : ''}
              </button>
            `;
            })
            .join('')}
        </div>
      </div>
    `;

    this.bindCloseButton(overlay, signal);

    const weekButtons = overlay.querySelectorAll<HTMLButtonElement>('.week-opt-btn');
    weekButtons.forEach((btn) => {
      btn.addEventListener(
        'click',
        () => {
          const offset = parseInt(btn.getAttribute('data-offset') || '0', 10);
          this.deps.state.setWeekOffset(offset);
          this.deps.state.closeModal();
        },
        { signal }
      );
    });
  }
}
