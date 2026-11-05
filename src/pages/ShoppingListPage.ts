import { appState } from '../app/state';
import { ingredientService, ShoppingItem } from '../services/ingredientService';
import { inventoryService } from '../services/inventoryService';
import { getIconSvg, getIngredientMiniIconSvg } from '../utils/iconHelper';
import { formatSmartQuantity } from '../utils/unitConversion';
import { calculateIngredientCost, formatZAR } from '../utils/pricingUtils';

export class ShoppingListPage {
  private container: HTMLElement;
  private items: ShoppingItem[] = [];
  private loading: boolean = true;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'w-full flex flex-col gap-4 pb-16';
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
    const inventoryList = inventoryService.getLoadedIngredients();

    const itemsToBuy = this.items.filter((i) => !i.isSufficientInStock);
    const inStockItems = this.items.filter((i) => i.isSufficientInStock);

    const totalToBuyCount = itemsToBuy.length;
    const purchasedCount = itemsToBuy.filter((i) => i.purchased).length;
    const progressPercent = totalToBuyCount > 0 ? Math.round((purchasedCount / totalToBuyCount) * 100) : 100;

    // Calculate total estimated shopping list spend based on ingredient pricing
    let totalEstimatedSpend = 0;
    itemsToBuy.forEach((item) => {
      const match = inventoryList.find(
        (inv) =>
          inv.name.toLowerCase() === item.name.toLowerCase() ||
          inv.name.toLowerCase().includes(item.name.toLowerCase()) ||
          item.name.toLowerCase().includes(inv.name.toLowerCase())
      );
      const cost = calculateIngredientCost(item.quantityToBuy, item.unit, match?.price, match?.priceUnit);
      totalEstimatedSpend += cost;
    });

    // Group items by category
    const categoriesMap = new Map<string, ShoppingItem[]>();
    for (const item of this.items) {
      const cat = item.category || 'Other';
      if (!categoriesMap.has(cat)) categoriesMap.set(cat, []);
      categoriesMap.get(cat)!.push(item);
    }

    this.container.innerHTML = `
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#25221F]/8">
        <div>
          <h2 class="text-[28px] md:text-[32px] font-serif font-normal text-[#221F1C] tracking-[-0.015em] leading-tight">Shopping List</h2>
          <p class="text-xs text-[#6B6560] mt-1">Smart grocery list calculated from planned meals minus current pantry inventory for ${weekLabel}</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button id="btn-add-all-purchased" 
                  class="px-4 py-2 rounded-full text-white text-xs font-medium flex items-center gap-1.5 hover:opacity-95 transition shadow-[0_6px_16px_-4px_rgba(25,22,19,0.3)] cursor-pointer whitespace-nowrap"
                  style="background: linear-gradient(180deg, #2D2A27 0%, #191715 100%);">
            ${getIconSvg('plus', 'w-3.5 h-3.5')}
            Restock All Purchased
          </button>
          <button id="btn-copy-shopping" 
                  class="px-3.5 py-2 rounded-full glass-pill text-xs font-medium text-[#221F1C] hover:bg-white/80 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
            ${getIconSvg('download', 'w-3.5 h-3.5')}
            Copy List
          </button>
          <button id="btn-clear-completed" 
                  class="px-3.5 py-2 rounded-full glass-pill text-xs font-medium text-[#6B6560] hover:text-rose-600 hover:bg-white/80 transition cursor-pointer whitespace-nowrap">
            Clear Checked
          </button>
        </div>
      </div>

      <!-- Inventory Comparison & Spend Estimation Banner -->
      <div class="rounded-[22px] bg-white/58 backdrop-blur-md border border-white/85 p-4 flex flex-col gap-2.5 shadow-[0_6px_22px_-6px_rgba(85,58,30,0.06),inset_0_1px_0_#FFFFFF]">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-medium">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-[#221F1C] font-semibold tabular-nums">${purchasedCount} of ${totalToBuyCount} items to buy gathered</span>
            <span class="text-[#6B6560] tabular-nums">· (${inStockItems.length} items covered by pantry stock)</span>
          </div>
          <div class="flex items-center gap-3">
            ${
              totalEstimatedSpend > 0
                ? `
              <span class="text-xs font-medium text-[#8C5C26] bg-[#FAF5EE]/90 px-3 py-1 rounded-full border border-[#F3E2CE] tabular-nums">
                Est. Spend: <strong class="font-semibold">${formatZAR(totalEstimatedSpend)}</strong>
              </span>
            `
                : ''
            }
            <span class="text-[#8C5C26] font-semibold tabular-nums">${progressPercent}% Completed</span>
          </div>
        </div>
        <div class="w-full h-2 rounded-full bg-black/5 overflow-hidden">
          <div class="h-full bg-[#D9A441] transition-all duration-300 rounded-full" style="width: ${progressPercent}%;"></div>
        </div>
      </div>

      <!-- Categories & Items -->
      ${
        this.loading
          ? `
        <div class="py-20 text-center text-[#77716D] font-serif text-sm">Comparing planned meals with pantry inventory...</div>
      `
          : this.items.length === 0
          ? `
        <div class="py-20 text-center text-[#77716D]">
          <p class="text-sm font-serif">No meals planned for this week yet.</p>
        </div>
      `
          : `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
          ${Array.from(categoriesMap.entries())
            .map(([cat, catItems]) => {
              const toBuyInCat = catItems.filter((i) => !i.isSufficientInStock);
              const stockedInCat = catItems.filter((i) => i.isSufficientInStock);

              return `
            <div class="rounded-[22px] bg-white/58 backdrop-blur-md border border-white/85 p-4 flex flex-col gap-3 shadow-[0_6px_22px_-6px_rgba(85,58,30,0.06),inset_0_1px_0_#FFFFFF]">
              <div class="flex items-center justify-between border-b border-[#25221F]/8 pb-2">
                <h4 class="text-xs font-semibold tracking-wide text-[#8C5C26]">
                  ${cat} · ${catItems.length}
                </h4>
                <span class="text-[11px] text-[#6B6560] tabular-nums">${toBuyInCat.length} to buy</span>
              </div>

              <div class="flex flex-col divide-y divide-[#25221F]/5">
                ${catItems
                  .map((item) => {
                    const isSufficient = item.isSufficientInStock;

                    const match = inventoryList.find(
                      (inv) =>
                        inv.name.toLowerCase() === item.name.toLowerCase() ||
                        inv.name.toLowerCase().includes(item.name.toLowerCase()) ||
                        item.name.toLowerCase().includes(inv.name.toLowerCase())
                    );
                    const itemCost = !isSufficient ? calculateIngredientCost(item.quantityToBuy, item.unit, match?.price, match?.priceUnit) : 0;

                    return `
                  <div class="flex items-center justify-between py-2.5 text-xs hover:bg-white/45 px-2 rounded-xl transition group">
                    <div class="flex items-center gap-2.5 min-w-0">
                      ${
                        isSufficient
                          ? `<span class="w-4 h-4 rounded-full bg-[#EAF5EA] text-[#4A7C4A] border border-[#D5EAD5] flex items-center justify-center shrink-0">
                               ${getIconSvg('check', 'w-2.5 h-2.5')}
                             </span>`
                          : `<input type="checkbox" 
                                   class="item-checkbox w-4 h-4 rounded text-[#D9A441] border-[#25221F]/20 focus:ring-0 cursor-pointer shrink-0" 
                                   data-id="${item.id}"
                                   ${item.purchased ? 'checked' : ''} />`
                      }

                      ${getIngredientMiniIconSvg(item.name, item.category)}

                      <div class="flex flex-col min-w-0">
                        <div class="flex items-center gap-1.5">
                          <span class="${item.purchased ? 'line-through text-[#6B6560]/60' : 'text-[#221F1C] font-medium'} truncate">
                            ${item.name}
                          </span>
                          ${
                            item.addedToInventory
                              ? `<span class="text-[10px] font-medium text-emerald-700 bg-emerald-50/90 px-2 py-0.2 rounded-full border border-emerald-200 shrink-0">In Pantry</span>`
                              : ''
                          }
                        </div>

                        <span class="text-[10.5px] text-[#6B6560]/85 truncate">
                          ${
                            isSufficient
                              ? `Sufficient: Have ${formatSmartQuantity(item.quantityInStock, item.unit)} in pantry (Week needs ${formatSmartQuantity(item.quantityRequired, item.unit)})`
                              : `Need ${formatSmartQuantity(item.quantityRequired, item.unit)} · Have ${formatSmartQuantity(item.quantityInStock, item.unit)} in pantry`
                          }
                        </span>
                      </div>
                    </div>

                    <div class="flex items-center gap-2.5 shrink-0 pl-2">
                      <div class="flex flex-col items-end">
                        <span class="font-semibold tabular-nums text-right ${
                          isSufficient
                            ? 'text-[#4A7C4A] text-[11.5px]'
                            : item.purchased
                            ? 'text-[#6B6560]/50'
                            : 'text-[#221F1C]'
                        }">
                          ${item.displayQuantity}
                        </span>
                        ${
                          itemCost > 0
                            ? `
                          <span class="text-[10.5px] text-[#8C5C26] font-medium tabular-nums">
                            ~${formatZAR(itemCost)}
                          </span>
                        `
                            : ''
                        }
                      </div>

                      ${
                        !isSufficient && item.purchased && !item.addedToInventory
                          ? `
                        <button class="btn-add-item-to-stock px-2.5 py-0.5 rounded-full bg-[#EAF5EA] text-[#3E703E] hover:bg-[#D5EAD5] text-[10px] font-semibold transition border border-[#D5EAD5] cursor-pointer whitespace-nowrap"
                                data-id="${item.id}" title="Add purchased quantity into pantry inventory">
                          + Stock
                        </button>
                      `
                          : ''
                      }
                    </div>
                  </div>
                `;
                  })
                  .join('')}
              </div>
            </div>
          `;
            })
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

    // Individual Add to Stock button
    const stockButtons = this.container.querySelectorAll<HTMLButtonElement>('.btn-add-item-to-stock');
    stockButtons.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const itemId = btn.getAttribute('data-id');
        const plan = appState.getState().currentPlan;
        const item = this.items.find((i) => i.id === itemId);
        if (item && plan) {
          const success = await ingredientService.addPurchasedToInventory(plan.id, item);
          if (success) {
            appState.showToast(`Restocked ${item.name} into pantry inventory!`, 'success');
            await this.loadItems();
          }
        }
      });
    });

    // Restock all purchased
    const addAllBtn = this.container.querySelector('#btn-add-all-purchased');
    addAllBtn?.addEventListener('click', async () => {
      const plan = appState.getState().currentPlan;
      if (!plan) return;

      const purchasedUnstocked = this.items.filter((i) => i.purchased && !i.addedToInventory);
      if (purchasedUnstocked.length === 0) {
        appState.showToast('No newly purchased items to add to inventory.', 'info');
        return;
      }

      for (const item of purchasedUnstocked) {
        await ingredientService.addPurchasedToInventory(plan.id, item);
      }

      appState.showToast(`Restocked ${purchasedUnstocked.length} purchased items into pantry!`, 'success');
      await this.loadItems();
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
      let text = 'MealWeek Smart Shopping List:\n';
      this.items
        .filter((i) => !i.isSufficientInStock)
        .forEach((item) => {
          text += `[${item.purchased ? 'x' : ' '}] ${item.name}: ${item.displayQuantity}\n`;
        });
      navigator.clipboard.writeText(text);
      appState.showToast('Shopping list copied to clipboard!', 'info');
    });
  }
}
