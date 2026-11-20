import { BaseModal } from '../BaseModal';
import {
  IngredientInventory,
  calculateStockStatus,
} from '../../../models/IngredientInventory';
import { getIconSvg, getIngredientMiniIconSvg } from '../../../utils/iconHelper';
import { formatSmartQuantity } from '../../../utils/unitConversion';
import {
  formatZAR,
  getItemStockValue,
  formatPriceRate,
} from '../../../utils/pricingUtils';
import { renderTransactionItems } from './transactionMarkup';

export interface IngredientDetailModalData {
  ingredient?: IngredientInventory;
}

export class IngredientDetailModal extends BaseModal<IngredientDetailModalData> {
  async render(overlay: HTMLElement, data?: IngredientDetailModalData): Promise<void> {
    const ingredient = data?.ingredient;
    if (!ingredient) {
      this.deps.state.closeModal();
      return;
    }

    const latest = (await this.deps.inventory.getIngredientById(ingredient.id)) || ingredient;
    const transactions = await this.deps.inventory.getAllTransactions(latest.id);
    const signal = this.beginRender(overlay);
    const recentTx = transactions.slice(0, 3);

    const status = calculateStockStatus(latest.quantity, latest.minStockLevel);
    let statusBadge = '';
    if (status === 'In Stock') {
      statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#EAF5EA] text-[#3E703E] border border-[#D5EAD5]">
        ${getIconSvg('check', 'w-3 h-3 text-[#4A7C4A]')}
        In Stock
      </span>`;
    } else if (status === 'Low Stock') {
      statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FDF4E7] text-[#B87A24] border border-[#F6DEBD]">
        ${getIconSvg('alert-triangle', 'w-3 h-3 text-[#C2822B]')}
        Low Stock
      </span>`;
    } else {
      statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        ${getIconSvg('x', 'w-3 h-3 text-rose-600')}
        Out of Stock
      </span>`;
    }

    const stockValue = getItemStockValue(latest);
    const unitPriceStr = formatPriceRate(latest.price, latest.priceUnit, true);
    const activityIso = latest.lastActivityAt || latest.lastUsedAt || latest.updatedAt;
    const activityDateStr = activityIso
      ? new Date(activityIso).toLocaleString('en-ZA', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'No activity recorded';
    const activitySummary =
      latest.lastActivitySummary || (latest.lastUsedAt ? 'Used in meal' : 'Initial pantry stock');
    const activityType = latest.lastActivityType || (latest.lastUsedAt ? 'Meal Usage' : 'Purchase');

    const lastUsedStr = latest.lastUsedAt
      ? new Date(latest.lastUsedAt).toLocaleString('en-ZA', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Not used in a cooked meal yet';

    const updatedStr = latest.updatedAt
      ? new Date(latest.updatedAt).toLocaleString('en-ZA', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

    overlay.innerHTML = `
      <div class="glass-panel w-full max-w-xl p-6 flex flex-col gap-4 bg-white/95 rounded-3xl shadow-xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-start justify-between gap-3 pb-3 border-b border-[#25221F]/10">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-11 h-11 rounded-2xl bg-[#FAF6F0] border border-[#EFE4D6] flex items-center justify-center shrink-0">
              ${getIngredientMiniIconSvg(latest.name, latest.category)}
            </div>
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-xl font-serif font-bold text-[#25221F] truncate">${latest.name}</h3>
                ${statusBadge}
              </div>
              <p class="text-xs text-[#77716D] mt-0.5">${latest.category} · Stored in ${latest.location}</p>
            </div>
          </div>
          <button id="modal-close-btn" class="glass-circle-btn shrink-0">
            ${getIconSvg('x', 'w-4 h-4')}
          </button>
        </div>

        <!-- Primary Metrics Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div class="p-3 rounded-2xl bg-[#FAF6F0]/80 border border-[#EFE4D6]/80 flex flex-col gap-0.5">
            <span class="text-[10.5px] text-[#77716D] font-medium">Current Stock</span>
            <span class="text-sm font-bold text-[#25221F] tabular-nums">${formatSmartQuantity(latest.quantity, latest.unit)}</span>
          </div>
          <div class="p-3 rounded-2xl bg-[#FAF6F0]/80 border border-[#EFE4D6]/80 flex flex-col gap-0.5">
            <span class="text-[10.5px] text-[#77716D] font-medium">Minimum Alert</span>
            <span class="text-sm font-semibold text-[#25221F] tabular-nums">${formatSmartQuantity(latest.minStockLevel, latest.unit)}</span>
          </div>
          <div class="p-3 rounded-2xl bg-[#FAF6F0]/80 border border-[#EFE4D6]/80 flex flex-col gap-0.5">
            <span class="text-[10.5px] text-[#77716D] font-medium">Unit Price</span>
            <span class="text-sm font-semibold text-[#25221F] tabular-nums">${unitPriceStr}</span>
          </div>
          <div class="p-3 rounded-2xl bg-[#FAF2E6] border border-[#E9D1B4]/80 flex flex-col gap-0.5">
            <span class="text-[10.5px] text-[#8C5C26] font-medium">Stock Value</span>
            <span class="text-sm font-bold text-[#8C5C26] tabular-nums">${formatZAR(stockValue)}</span>
          </div>
        </div>

        <!-- Last Activity Highlight -->
        <div class="p-3.5 rounded-2xl bg-white/80 border border-[#25221F]/8 flex flex-col gap-2">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-semibold text-[#25221F] flex items-center gap-1.5">
              ${getIconSvg('history', 'w-3.5 h-3.5 text-[#8C5C26]')}
              Last Activity
            </span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF2E6] text-[#8C5C26] border border-[#E9D1B4]/80">
              ${activityType}
            </span>
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <span class="font-medium text-[#25221F]">${activitySummary}</span>
            <span class="text-[11px] text-[#77716D] tabular-nums">${activityDateStr}</span>
          </div>
        </div>

        <!-- Full Metadata Details -->
        <div class="p-3.5 rounded-2xl bg-[#FBF8F4] border border-[#25221F]/8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div class="flex flex-col gap-0.5">
            <span class="text-[10.5px] text-[#77716D]">Storage Location</span>
            <span class="font-medium text-[#25221F]">${latest.location}</span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-[10.5px] text-[#77716D]">Food Category</span>
            <span class="font-medium text-[#25221F]">${latest.category}</span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-[10.5px] text-[#77716D]">Last Cooked Usage</span>
            <span class="font-medium text-[#25221F]">${lastUsedStr}</span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-[10.5px] text-[#77716D]">Last Updated</span>
            <span class="font-medium text-[#25221F] tabular-nums">${updatedStr}</span>
          </div>
          <div class="sm:col-span-2 flex flex-col gap-0.5 pt-1 border-t border-[#25221F]/6">
            <span class="text-[10.5px] text-[#77716D]">Notes / Brand</span>
            <span class="font-medium text-[#25221F]">${latest.notes ? latest.notes : '<span class="text-[#77716D]/60 italic font-normal">No notes added</span>'}</span>
          </div>
        </div>

        <!-- Recent Activity Timeline Preview -->
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#25221F]">Recent History (${transactions.length})</span>
            <button type="button" id="btn-detail-full-history" class="text-[11px] font-semibold text-[#8C5C26] hover:underline cursor-pointer">
              View All Activity &rarr;
            </button>
          </div>
          <div class="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-0.5">
            ${
              recentTx.length === 0
                ? `<div class="py-4 text-center text-xs text-[#77716D] italic">No recorded transactions yet.</div>`
                : renderTransactionItems(recentTx)
            }
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-between gap-2.5 pt-3 border-t border-[#25221F]/10">
          <button type="button" id="btn-detail-close" class="px-4 py-2 rounded-xl glass-card text-xs font-medium text-[#77716D] cursor-pointer">
            Close
          </button>
          <button type="button" id="btn-detail-edit" class="px-5 py-2 rounded-xl bg-[#25221F] text-white text-xs font-medium hover:bg-[#3D3833] cursor-pointer shadow-sm flex items-center gap-1.5">
            ${getIconSvg('edit', 'w-3.5 h-3.5')}
            Edit Ingredient
          </button>
        </div>
      </div>
    `;

    this.bindCloseButton(overlay, signal);

    overlay.querySelector('#btn-detail-close')?.addEventListener(
      'click',
      () => {
        this.deps.state.closeModal();
      },
      { signal }
    );

    overlay.querySelector('#btn-detail-edit')?.addEventListener(
      'click',
      () => {
        this.deps.state.openModal('edit-inventory', { ingredient: latest });
      },
      { signal }
    );

    overlay.querySelector('#btn-detail-full-history')?.addEventListener(
      'click',
      () => {
        this.deps.state.openModal('inventory-activity', { ingredient: latest });
      },
      { signal }
    );
  }
}
