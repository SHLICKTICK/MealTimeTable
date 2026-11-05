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
      <div class="pb-2 border-b border-[#25221F]/10">
        <h2 class="text-3xl font-serif font-medium text-[#25221F]">Settings & Preferences</h2>
        <p class="text-xs text-[#77716D] mt-1">Configure your household, currency, and offline PWA settings</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl pb-6">
        <!-- PWA & Offline Status Card -->
        <div class="glass-card p-5 rounded-2xl flex flex-col justify-between shadow-xs">
          <div>
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-xl bg-[#FBF5ED] border border-[#F3E2CE] flex items-center justify-center text-[#D9A441]">
                ${getIconSvg('download', 'w-5 h-5')}
              </div>
              <div>
                <h4 class="text-sm font-semibold text-[#25221F]">Progressive Web App (PWA)</h4>
                <p class="text-xs text-[#77716D]">Install MealWeek to your desktop or mobile home screen</p>
              </div>
            </div>

            <div class="space-y-2 text-xs py-2">
              <div class="flex items-center justify-between py-1 border-b border-[#25221F]/5">
                <span class="text-[#77716D]">Status</span>
                <span class="font-medium text-emerald-600 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  ${state.isInstalledPwa ? 'Installed / Standalone' : 'Ready to Install'}
                </span>
              </div>
              <div class="flex items-center justify-between py-1 border-b border-[#25221F]/5">
                <span class="text-[#77716D]">Offline Access</span>
                <span class="font-medium text-[#25221F]">Enabled (IndexedDB & Service Worker)</span>
              </div>
              <div class="flex items-center justify-between py-1 border-b border-[#25221F]/5">
                <span class="text-[#77716D]">Network</span>
                <span class="font-medium ${state.isOnline ? 'text-emerald-600' : 'text-amber-600'}">
                  ${state.isOnline ? 'Online' : 'Offline Mode Active'}
                </span>
              </div>
            </div>
          </div>

          <div class="pt-4">
            ${
              state.isInstalledPwa
                ? `<div class="text-xs text-[#77716D] bg-white/50 p-3 rounded-xl border border-white/80">
                     MealWeek is installed as a standalone desktop app.
                   </div>`
                : `<button id="btn-settings-install-pwa" 
                           class="w-full py-2.5 px-4 rounded-xl bg-[#25221F] text-white text-xs font-medium flex items-center justify-center gap-2 hover:bg-[#3D3833] transition shadow-sm cursor-pointer">
                     ${getIconSvg('download', 'w-4 h-4')}
                     Install MealWeek App
                   </button>`
            }
          </div>
        </div>

        <!-- Household Servings Preference -->
        <div class="glass-card p-5 rounded-2xl flex flex-col justify-between shadow-xs">
          <div>
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-xl bg-white/60 border border-white/80 flex items-center justify-center text-[#8C5C26]">
                ${getIconSvg('utensils', 'w-5 h-5')}
              </div>
              <div>
                <h4 class="text-sm font-semibold text-[#25221F]">Household Size</h4>
                <p class="text-xs text-[#77716D]">Default servings scaled across weekly recipe plans</p>
              </div>
            </div>

            <div class="py-2">
              <label class="text-xs text-[#77716D] block mb-2">Default Recipe Portions</label>
              <div class="flex items-center gap-2">
                ${[1, 2, 4, 6, 8]
                  .map(
                    (s) => `
                  <button class="btn-serving-opt flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                    state.recipeDetailServings === s
                      ? 'bg-[#25221F] text-white shadow-xs'
                      : 'bg-white/60 text-[#25221F] hover:bg-white'
                  }" data-servings="${s}">
                    ${s} ${s === 1 ? 'Person' : 'People'}
                  </button>
                `
                  )
                  .join('')}
              </div>
            </div>
          </div>

          <div class="text-[11px] text-[#77716D] pt-3">
            Changing this will automatically adapt default ingredient measurements across all recipes.
          </div>
        </div>

        <!-- Currency & Costing System -->
        <div class="glass-card p-5 rounded-2xl flex flex-col justify-between shadow-xs">
          <div>
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-xl bg-[#FBF5ED] border border-[#F3E2CE] flex items-center justify-center text-[#D9A441]">
                ${getIconSvg('chart-bar', 'w-5 h-5')}
              </div>
              <div>
                <h4 class="text-sm font-semibold text-[#25221F]">Currency & Costing</h4>
                <p class="text-xs text-[#77716D]">Weekly grocery estimates and recipe costing</p>
              </div>
            </div>

            <div class="py-2 space-y-2 text-xs">
              <div class="flex items-center justify-between">
                <span class="text-[#77716D]">Base Currency</span>
                <span class="font-semibold text-[#25221F]">South African Rand (ZAR - R)</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[#77716D]">Estimated Budget</span>
                <span class="font-semibold text-[#25221F]">R1,250.00 / week</span>
              </div>
            </div>
          </div>

          <div class="text-[11px] text-[#77716D] pt-3">
            Meal costing architecture (Version 2) calculates real-time ingredient and recipe breakdowns.
          </div>
        </div>

        <!-- Sample Data Reset -->
        <div class="glass-card p-5 rounded-2xl flex flex-col justify-between shadow-xs">
          <div>
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                ${getIconSvg('trash', 'w-5 h-5')}
              </div>
              <div>
                <h4 class="text-sm font-semibold text-[#25221F]">Data Management</h4>
                <p class="text-xs text-[#77716D]">Reset sample dishes, ingredients, and timetable</p>
              </div>
            </div>

            <p class="text-xs text-[#77716D] leading-relaxed">
              Restore the original 14 sample meals (Monday–Sunday) and default recipe ingredients if changes were made.
            </p>
          </div>

          <div class="pt-4">
            <button id="btn-reset-sample-data" 
                    class="w-full py-2.5 px-4 rounded-xl border border-rose-200 text-rose-700 bg-rose-50/60 hover:bg-rose-100/70 text-xs font-medium transition cursor-pointer">
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
        alert('Reset complete! Sample meals restored.');
        appState.setPage('weekly');
      }
    });
  }
}
