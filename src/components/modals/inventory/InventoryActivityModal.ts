import { BaseModal } from '../BaseModal';
import { IngredientInventory } from '../../../models/IngredientInventory';
import { getIconSvg } from '../../../utils/iconHelper';
import { renderTransactionItems } from './transactionMarkup';

export interface InventoryActivityModalData {
  ingredient?: IngredientInventory;
}

export class InventoryActivityModal extends BaseModal<InventoryActivityModalData> {
  async render(overlay: HTMLElement, data?: InventoryActivityModalData): Promise<void> {
    const specificIngredient = data?.ingredient;
    const transactions = await this.deps.inventory.getAllTransactions(specificIngredient?.id);
    const signal = this.beginRender(overlay);
    const title = specificIngredient
      ? `${specificIngredient.name} History`
      : 'Ingredient Activity History';

    overlay.innerHTML = `
      <div class="glass-panel w-full max-w-2xl p-6 flex flex-col gap-4 bg-white/95 rounded-3xl shadow-xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-[#25221F]/10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/60 border border-white flex items-center justify-center text-[#8C5C26]">
              ${getIconSvg('history', 'w-5 h-5')}
            </div>
            <div>
              <h3 class="text-xl font-serif font-bold text-[#25221F]">${title}</h3>
              <p class="text-xs text-[#77716D]">${transactions.length} recorded inventory events & usage transactions</p>
            </div>
          </div>
          <button id="modal-close-btn" class="glass-circle-btn">
            ${getIconSvg('x', 'w-4 h-4')}
          </button>
        </div>

        <!-- Filter tabs for transactions -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
          ${['All', 'Meal Usage', 'Purchase', 'Manual Adjustment', 'Reversal']
            .map(
              (type) => `
            <button data-tx-type="${type}" 
                    class="btn-tx-filter px-3 py-1 rounded-full text-xs font-medium glass-card text-[#77716D] hover:text-[#25221F] cursor-pointer">
              ${type}
            </button>
          `
            )
            .join('')}
        </div>

        <!-- Transaction List -->
        <div id="tx-list-container" class="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
          ${renderTransactionItems(transactions)}
        </div>
      </div>
    `;

    this.bindCloseButton(overlay, signal);

    const txBtns = overlay.querySelectorAll<HTMLButtonElement>('.btn-tx-filter');
    txBtns.forEach((btn) => {
      btn.addEventListener(
        'click',
        () => {
          const type = btn.getAttribute('data-tx-type');
          txBtns.forEach((b) => b.classList.remove('bg-[#25221F]', 'text-white'));
          btn.classList.add('bg-[#25221F]', 'text-white');

          const filtered =
            !type || type === 'All' ? transactions : transactions.filter((t) => t.type === type);
          const container = overlay.querySelector('#tx-list-container');
          if (container) {
            container.innerHTML = renderTransactionItems(filtered);
          }
        },
        { signal }
      );
    });

    const allBtn = overlay.querySelector<HTMLButtonElement>('[data-tx-type="All"]');
    allBtn?.classList.add('bg-[#25221F]', 'text-white');
  }
}
