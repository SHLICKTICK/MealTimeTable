import { appState, AppPage } from '../app/state';
import { getIconSvg } from '../utils/iconHelper';

export class Sidebar {
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('aside');
    this.container.className =
      'desktop-sidebar w-[230px] shrink-0 h-full flex flex-col justify-between p-5 glass-panel select-none';
    this.render();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  render(): void {
    const state = appState.getState();
    const activePage = state.activePage;

    this.container.innerHTML = `
      <div class="flex flex-col gap-8">
        <!-- Brand Section matching reference exactly -->
        <div class="flex flex-col items-center text-center pt-2">
          <!-- Champagne rounded square with chef hat -->
          <div class="w-14 h-14 rounded-2xl flex items-center justify-center relative shadow-sm mb-3"
               style="background: linear-gradient(145deg, #FDF4E7 0%, #E9D1B4 60%, #D8B788 100%);
                      border: 1px solid rgba(255, 255, 255, 0.9);
                      box-shadow: 0 8px 20px -4px rgba(180, 130, 80, 0.25), inset 0 1px 1px #FFFFFF;">
            <div class="text-[#8C5C26]">
              ${getIconSvg('chef-hat', 'w-8 h-8')}
            </div>
          </div>

          <h1 class="text-xl font-bold tracking-tight text-[#25221F] font-sans">
            MealWeek
          </h1>
          <p class="text-xs text-[#77716D] mt-0.5 tracking-wide">
            Plan. Cook. Enjoy.
          </p>
        </div>

        <!-- Navigation Menu -->
        <nav class="flex flex-col gap-2">
          ${this.renderNavItem('weekly', 'Weekly Plan', 'calendar', activePage === 'weekly')}
          ${this.renderNavItem('recipes', 'Recipes', 'book-open', activePage === 'recipes')}
          ${this.renderNavItem('ingredients', 'Ingredients', 'package', activePage === 'ingredients')}
          ${this.renderNavItem('shopping', 'Shopping List', 'shopping-cart', activePage === 'shopping')}
          ${this.renderNavItem('settings', 'Settings', 'settings', activePage === 'settings')}
        </nav>
      </div>

      <!-- Bottom Brand Statement & PWA install action -->
      <div class="flex flex-col items-center text-center gap-3 pb-2">
        ${
          !state.isInstalledPwa && state.canInstallPwa
            ? `
          <button id="pwa-sidebar-install" 
                  class="w-full py-2 px-3 rounded-xl bg-[#25221F] text-white text-xs font-medium flex items-center justify-center gap-2 hover:bg-[#3D3833] transition shadow-sm cursor-pointer">
            ${getIconSvg('download', 'w-3.5 h-3.5')}
            Install App
          </button>
        `
            : ''
        }

        <div class="flex flex-col items-center text-center opacity-85">
          <div class="text-[#8C5C26] mb-1">
            ${getIconSvg('sprout', 'w-5 h-5')}
          </div>
          <p class="text-xs font-serif italic text-[#77716D] leading-relaxed">
            Good Food.<br />Good Mood.
          </p>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private renderNavItem(page: AppPage, label: string, icon: string, isActive: boolean): string {
    const activeClasses = isActive
      ? 'glass-pill text-[#25221F] font-semibold shadow-sm'
      : 'text-[#77716D] hover:text-[#25221F] hover:bg-white/30 font-medium';

    return `
      <button data-page="${page}" 
              class="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm transition-all cursor-pointer ${activeClasses}">
        <span class="${isActive ? 'text-[#8C5C26]' : 'text-[#77716D]'}">
          ${getIconSvg(icon, 'w-4 h-4')}
        </span>
        <span class="truncate">${label}</span>
      </button>
    `;
  }

  private bindEvents(): void {
    const navButtons = this.container.querySelectorAll<HTMLButtonElement>('button[data-page]');
    navButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const page = btn.getAttribute('data-page') as AppPage;
        if (page) {
          appState.setPage(page);
        }
      });
    });

    const installBtn = this.container.querySelector('#pwa-sidebar-install');
    if (installBtn) {
      installBtn.addEventListener('click', () => {
        appState.installPwa();
      });
    }
  }
}
