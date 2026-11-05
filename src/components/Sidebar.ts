import { appState, AppPage } from '../app/state';
import { getIconSvg } from '../utils/iconHelper';

export class Sidebar {
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('aside');
    this.container.className =
      'desktop-sidebar w-[225px] xl:w-[238px] shrink-0 flex-1 min-h-0 flex flex-col justify-between px-5 pt-6 pb-7 sidebar-glass rounded-tr-[32px] rounded-br-[32px] select-none relative overflow-hidden';
    this.render();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  render(): void {
    const state = appState.getState();
    const activePage = state.activePage;

    this.container.innerHTML = `
      <!-- Subtle lower-left warm bowl refraction glow inside frosted sidebar -->
      <div class="pointer-events-none absolute inset-x-0 bottom-0 h-56 opacity-85"
           style="background: radial-gradient(circle 170px at 38% 82%, rgba(236, 165, 76, 0.36) 0%, rgba(244, 198, 134, 0.14) 52%, transparent 80%);">
      </div>

      <div class="flex flex-col gap-6 relative z-10">
        <!-- Brand Section matching reference -->
        <div class="flex flex-col items-center text-center pt-1">
          <!-- Honey-champagne rounded square with chef hat -->
          <div class="w-[54px] h-[54px] rounded-[17px] flex items-center justify-center relative mb-2.5"
               style="background: linear-gradient(155deg, #FDF2DC 0%, #ECC37D 52%, #D7963B 100%);
                      border: 1px solid rgba(255, 255, 255, 0.92);
                      box-shadow: 0 10px 24px -6px rgba(185, 125, 45, 0.35), inset 0 1px 1px #FFFFFF;">
            <div class="text-[#784816]">
              ${getIconSvg('chef-hat', 'w-7 h-7')}
            </div>
          </div>

          <h1 class="text-[22px] font-serif font-medium tracking-tight text-[#221F1C] leading-snug">
            MealWeek
          </h1>
          <p class="text-[11.5px] text-[#6B6560] mt-0.5 tracking-wide font-normal">
            Plan. Cook. Enjoy.
          </p>
        </div>

        <!-- Navigation Menu -->
        <nav class="flex flex-col gap-1">
          ${this.renderNavItem('weekly', 'Weekly Plan', 'calendar', activePage === 'weekly')}
          ${this.renderNavItem('recipes', 'Recipes', 'book-open', activePage === 'recipes')}
          ${this.renderNavItem('ingredients', 'Ingredients', 'package', activePage === 'ingredients')}
          ${this.renderNavItem('shopping', 'Shopping List', 'shopping-cart', activePage === 'shopping')}
          ${this.renderNavItem('settings', 'Settings', 'settings', activePage === 'settings')}
        </nav>
      </div>

      <!-- Bottom Brand Statement & PWA install action -->
      <div class="flex flex-col items-center text-center gap-3 pb-1 relative z-10">
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

        <div class="flex flex-col items-center text-center">
          <div class="text-white/95 mb-1.5 drop-shadow-[0_1px_4px_rgba(120,75,25,0.28)]">
            ${getIconSvg('sprout', 'w-5 h-5')}
          </div>
          <p class="text-[12.5px] font-sans font-normal text-white/95 leading-[1.4] tracking-wide drop-shadow-[0_1px_4px_rgba(120,75,25,0.28)]">
            Good Food.<br />Good Mood.
          </p>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private renderNavItem(page: AppPage, label: string, icon: string, isActive: boolean): string {
    const activeClasses = isActive
      ? 'sidebar-nav-active text-[#221F1C] font-semibold'
      : 'text-[#4F4A46] hover:text-[#221F1C] hover:bg-white/35 font-medium';

    return `
      <button data-page="${page}" 
              class="w-full flex items-center gap-3 px-4 py-2.5 rounded-[16px] text-[13.5px] transition-all cursor-pointer ${activeClasses}">
        <span class="${isActive ? 'text-[#C88428]' : 'text-[#68625D]'}">
          ${getIconSvg(icon, 'w-[17px] h-[17px]')}
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
