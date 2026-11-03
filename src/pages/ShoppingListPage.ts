import { appState } from '../app/state';
import { ingredientService, ShoppingItem } from '../services/ingredientService';
import { getIconSvg } from '../utils/iconHelper';

export class ShoppingListPage {
  private container: HTMLElement;
  private items: ShoppingItem[] = [];
  private loading: boolean = true;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'w-full flex-1 flex flex-col gap-4 select-none overflow-y-auto pr-1';
    this.loadItems();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  async loadItems(): Promise<void> {
    this.loading = true;
    const state = appState.getState();
    if (state.currentPlan) {
      this.items = await ingredientService.getShoppingListForWeek(state.currentPlan);
    }
    this.loading = false;
    this.render();
  }

  render(): void {
    const state = appState.getState();
    const plan = state.currentPlan;
    const weekLabel = plan ? plan.days[0].dateStr + ' – ' + plan.days[6].dateStr : 'This Week';

    const totalCount = this.items.length;
    const purchasedCount = this.items.filter((i) => i.purchased).length;
    const progressPercent = totalCount > 0 ? Math.round((purchasedCount / totalCount) * 100) : 0;

    // Group items by category
    const categoriesMap = new Map<string, ShoppingItem[]>();
    for (const item of this.items) {
      const cat = item.category || 'Other';
      if (!categoriesMap.has(cat)) categoriesMap.set(cat, []);
      categoriesMap.get(cat)!.push(item);
    }

    this.container.innerHTML = `
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#25221F]/10">
        <div>
          <h2 class="text-3xl font-serif font-medium text-[#25221F]">Shopping List</h2>
          <p class="text-xs text-[#77716D] mt-1">Aggregated ingredients for ${weekLabel} (${totalCount} distinct items)</p>
        </div>

        <div class="flex items-center gap-2.5">
          <button id="btn-copy-shopping" 
                  class="px-3 py-2 rounded-xl glass-card text-xs font-medium text-[#25221F] hover:bg-white/80 transition flex items-center gap-1.5 cursor-pointer">
            ${getIconSvg('download', 'w-3.5 h-3.5')}
            Copy List
          </button>
          <button id="btn-clear-completed" 
                  class="px-3 py-2 rounded-xl glass-card text-xs font-medium text-[#77716D] hover:text-rose-600 hover:bg-white/80 transition cursor-pointer">
            Clear Checked
          </button>
        </div>
      </div>

      <!-- Progress Meter -->
      <div class="glass-card p-4 rounded-2xl flex flex-col gap-2 shadow-xs">
        <div class="flex items-center justify-between text-xs font-medium">
          <span class="text-[#25221F]">${purchasedCount} of ${totalCount} items gathered</span>
          <span class="text-[#8C5C26] font-semibold">${progressPercent}% Completed</span>
        </div>
        <div class="w-full h-2 rounded-full bg-black/5 overflow-hidden">
          <div class="h-full bg-[#D9A441] transition-all duration-300 rounded-full" style="width: ${progressPercent}%;"></div>
        </div>
      </div>

      <!-- Categories & Items -->
      ${
        this.loading
          ? `
        <div class="py-20 text-center text-[#77716D] font-serif">Calculating weekly shopping inventory...</div>
      `
          : totalCount === 0
          ? `
        <div class="py-20 text-center text-[#77716D]">
          <p class="text-sm font-serif">No meals planned for this week yet.</p>
        </div>
      `
          : `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
          ${Array.from(categoriesMap.entries())
            .map(
              ([cat, catItems]) => `
            <div class="glass-card p-4 rounded-2xl flex flex-col gap-3 shadow-xs">
              <h4 class="text-xs font-semibold uppercase tracking-wider text-[#8C5C26] border-b border-[#25221F]/8 pb-2">
                ${cat} (${catItems.length})
              </h4>

              <div class="flex flex-col divide-y divide-[#25221F]/5">
                ${catItems
                  .map(
                    (item) => `
                  <label class="flex items-center justify-between py-2 text-xs cursor-pointer hover:bg-white/40 px-2 rounded-lg transition group">
                    <div class="flex items-center gap-3">
                      <input type="checkbox" 
                             class="item-checkbox w-4 h-4 rounded text-[#D9A441] border-[#25221F]/20 focus:ring-0 cursor-pointer" 
                             data-id="${item.id}"
                             ${item.purchased ? 'checked' : ''} />
                      <div class="flex flex-col">
                        <span class="${item.purchased ? 'line-through text-[#77716D]/60' : 'text-[#25221F] font-medium'}">
                          ${item.name}
                        </span>
                        <span class="text-[10px] text-[#77716D]/75">
                          ${item.sourceMeals.slice(0, 2).join(', ')}${item.sourceMeals.length > 2 ? ` +${item.sourceMeals.length - 2} more` : ''}
                        </span>
                      </div>
                    </div>

                    <span class="font-semibold tabular-nums text-right ${item.purchased ? 'text-[#77716D]/50' : 'text-[#25221F]'}">
                      ${item.displayQuantity}
                    </span>
                  </label>
                `
                  )
                  .join('')}
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      `
      }
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const checkboxes = this.container.querySelectorAll<HTMLInputElement>('.item-checkbox');
    checkboxes.forEach((cb) => {
      cb.addEventListener('change', async () => {
        const itemId = cb.getAttribute('data-id');
        const plan = appState.getState().currentPlan;
        if (itemId && plan) {
          await ingredientService.toggleItemPurchased(plan.id, itemId, cb.checked);
          await this.loadItems();
        }
      });
    });

    const clearBtn = this.container.querySelector('#btn-clear-completed');
    clearBtn?.addEventListener('click', async () => {
      const plan = appState.getState().currentPlan;
      if (plan) {
        await ingredientService.clearPurchased(plan.id);
        await this.loadItems();
      }
    });

    const copyBtn = this.container.querySelector('#btn-copy-shopping');
    copyBtn?.addEventListener('click', () => {
      let text = 'MealWeek Shopping List:\n';
      this.items.forEach((item) => {
        text += `[${item.purchased ? 'x' : ' '}] ${item.name}: ${item.displayQuantity}\n`;
      });
      navigator.clipboard.writeText(text);
      alert('Shopping list copied to clipboard!');
    });
  }
}
