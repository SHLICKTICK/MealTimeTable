import { appState } from '../app/state';
import { recipeService } from '../services/recipeService';
import { mealPlanService } from '../services/mealPlanService';
import { getIconSvg } from '../utils/iconHelper';

export class SettingsPage {
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'w-full flex flex-col gap-5 pb-16';
    this.render();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  render(): void {
    const state = appState.getState();

    this.container.innerHTML = `
      <!-- Header -->
      <div class="pb-3 border-b border-[#25221F]/8">
        <h2 class="text-[28px] md:text-[32px] font-serif font-normal text-[#221F1C] tracking-[-0.015em] leading-tight">Settings & Preferences</h2>
        <p class="text-xs text-[#6B6560] mt-1">Configure your household, currency, and offline PWA settings</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl pb-6">
        <!-- PWA & Offline Status Card -->
        <div class="rounded-[22px] bg-white/58 backdrop-blur-md border border-white/85 p-5 flex flex-col justify-between shadow-[0_6px_22px_-6px_rgba(85,58,30,0.06),inset_0_1px_0_#FFFFFF]">
          <div>
            <div class="flex items-center gap-3 mb-3.5">
              <div class="shrink-0 flex items-center justify-center text-[#C87D32]">
                ${getIconSvg('download', 'w-5 h-5')}
              </div>
              <div>
                <h4 class="text-sm font-semibold text-[#221F1C]">Progressive Web App (PWA)</h4>
                <p class="text-xs text-[#6B6560]">Install MealWeek to your desktop or mobile home screen</p>
              </div>
            </div>

            <div class="space-y-2 text-xs py-2">
              <div class="flex items-center justify-between py-1 border-b border-[#25221F]/6">
                <span class="text-[#6B6560]">Status</span>
                <span class="font-medium text-emerald-700 flex items-center gap-1.5">
                  ${getIconSvg('check-circle', 'w-3.5 h-3.5 text-emerald-600')}
                  ${state.isInstalledPwa ? 'Installed / Standalone' : 'Ready to Install'}
                </span>
              </div>
              <div class="flex items-center justify-between py-1 border-b border-[#25221F]/6">
                <span class="text-[#6B6560]">Offline Access</span>
                <span class="font-medium text-[#221F1C]">Enabled (IndexedDB & Service Worker)</span>
              </div>
              <div class="flex items-center justify-between py-1 border-b border-[#25221F]/6">
                <span class="text-[#6B6560]">Network</span>
                <span class="font-medium ${state.isOnline ? 'text-emerald-700' : 'text-amber-700'}">
                  ${state.isOnline ? 'Online' : 'Offline Mode Active'}
                </span>
              </div>
            </div>
          </div>

          <div class="pt-4">
            ${
              state.isInstalledPwa
                ? `<div class="text-xs text-[#6B6560] bg-white/60 px-4 py-2.5 rounded-full border border-white/85 text-center">
                     MealWeek is installed as a standalone desktop app.
                   </div>`
                : `<button id="btn-settings-install-pwa" 
                           class="w-full py-2.5 px-4 rounded-full text-white text-xs font-medium flex items-center justify-center gap-2 hover:opacity-95 transition shadow-[0_6px_16px_-4px_rgba(25,22,19,0.3)] cursor-pointer"
                           style="background: linear-gradient(180deg, #2D2A27 0%, #191715 100%);">
                     ${getIconSvg('download', 'w-4 h-4')}
                     Install MealWeek App
                   </button>`
            }
          </div>
        </div>

        <!-- Household Servings Preference -->
        <div class="rounded-[22px] bg-white/58 backdrop-blur-md border border-white/85 p-5 flex flex-col justify-between shadow-[0_6px_22px_-6px_rgba(85,58,30,0.06),inset_0_1px_0_#FFFFFF]">
          <div>
            <div class="flex items-center gap-3 mb-3.5">
              <div class="shrink-0 flex items-center justify-center text-[#3F3B37]">
                ${getIconSvg('utensils', 'w-5 h-5')}
              </div>
              <div>
                <h4 class="text-sm font-semibold text-[#221F1C]">Household Size</h4>
                <p class="text-xs text-[#6B6560]">Default servings scaled across weekly recipe plans</p>
              </div>
            </div>

            <div class="py-2">
              <label class="text-xs text-[#6B6560] block mb-2.5">Default Recipe Portions</label>
              <div class="flex items-center gap-1.5">
                ${[1, 2, 4, 6, 8]
                  .map(
                    (s) => `
                  <button class="btn-serving-opt flex-1 py-2 rounded-full text-xs cursor-pointer transition ${
                    state.recipeDetailServings === s
                      ? 'sidebar-nav-active text-[#221F1C] font-semibold'
                      : 'bg-white/55 text-[#6B6560] hover:text-[#221F1C] hover:bg-white/80 font-medium border border-white/80'
                  }" data-servings="${s}">
                    ${s} ${s === 1 ? 'Person' : 'People'}
                  </button>
                `
                  )
                  .join('')}
              </div>
            </div>
          </div>

          <div class="text-[11px] text-[#6B6560] pt-3">
            Changing this will automatically adapt default ingredient measurements across all recipes.
          </div>
        </div>

        <!-- Currency & Costing System -->
        <div class="rounded-[22px] bg-white/58 backdrop-blur-md border border-white/85 p-5 flex flex-col justify-between shadow-[0_6px_22px_-6px_rgba(85,58,30,0.06),inset_0_1px_0_#FFFFFF]">
          <div>
            <div class="flex items-center gap-3 mb-3.5">
              <div class="shrink-0 flex items-center justify-center">
                ${getIconSvg('chart-bar-filled', 'w-5 h-5')}
              </div>
              <div>
                <h4 class="text-sm font-semibold text-[#221F1C]">Currency & Costing</h4>
                <p class="text-xs text-[#6B6560]">Weekly grocery estimates and recipe costing</p>
              </div>
            </div>

            <div class="py-2 space-y-2 text-xs">
              <div class="flex items-center justify-between py-1 border-b border-[#25221F]/6">
                <span class="text-[#6B6560]">Base Currency</span>
                <span class="font-medium text-[#221F1C]">South African Rand (ZAR - R)</span>
              </div>
              <div class="flex items-center justify-between py-1">
                <span class="text-[#6B6560]">Estimated Budget</span>
                <span class="font-medium text-[#221F1C] tabular-nums">R1,250.00 / week</span>
              </div>
            </div>
          </div>

          <div class="text-[11px] text-[#6B6560] pt-3">
            Meal costing architecture calculates real-time ingredient and recipe breakdowns.
          </div>
        </div>

        <!-- Sample Data Reset -->
        <div class="rounded-[22px] bg-white/58 backdrop-blur-md border border-white/85 p-5 flex flex-col justify-between shadow-[0_6px_22px_-6px_rgba(85,58,30,0.06),inset_0_1px_0_#FFFFFF]">
          <div>
            <div class="flex items-center gap-3 mb-3.5">
              <div class="shrink-0 flex items-center justify-center text-rose-600">
                ${getIconSvg('trash', 'w-5 h-5')}
              </div>
              <div>
                <h4 class="text-sm font-semibold text-[#221F1C]">Data Management</h4>
                <p class="text-xs text-[#6B6560]">Reset sample dishes, ingredients, and timetable</p>
              </div>
            </div>

            <p class="text-xs text-[#6B6560] leading-relaxed">
              Restore the original 14 sample meals (Monday–Sunday) and default recipe ingredients if changes were made.
            </p>
          </div>

          <div class="pt-4">
            <button id="btn-reset-sample-data" 
                    class="w-full py-2.5 px-4 rounded-full border border-rose-200/90 text-rose-700 bg-rose-50/70 hover:bg-rose-100/80 text-xs font-medium transition cursor-pointer">
              Reset to Sample Seed Data
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const installBtn = this.container.querySelector('#btn-settings-install-pwa');
    installBtn?.addEventListener('click', () => {
      appState.installPwa();
    });

    const servingButtons = this.container.querySelectorAll<HTMLButtonElement>('.btn-serving-opt');
    servingButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const servings = parseInt(btn.getAttribute('data-servings') || '4', 10);
        appState.setRecipeDetailServings(servings);
        this.render();
      });
    });

    const resetBtn = this.container.querySelector('#btn-reset-sample-data');
    resetBtn?.addEventListener('click', async () => {
      if (confirm('Reset all recipes and weekly timetable to the initial reference state?')) {
        await recipeService.resetToDefaults();
        await mealPlanService.resetWeek(0);
        await appState.init();
        appState.showToast('Reset complete! Sample meals restored.', 'success');
        appState.setPage('weekly');
      }
    });
  }
}
