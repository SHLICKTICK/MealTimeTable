import { BaseModal } from '../BaseModal';
import { MasterIngredient, MasterPriceUnit } from '../../../models/MasterIngredient';
import { getIconSvg, getIngredientMiniIconSvg, FoodGroup } from '../../../utils/iconHelper';
import { formatZAR } from '../../../utils/pricingUtils';

export interface PriceCatalogRenderState {
  filterGroup: FoodGroup | 'all';
  searchQuery: string;
  showAddForm: boolean;
}

export class PriceCatalogModal extends BaseModal<PriceCatalogRenderState> {
  async render(
    overlay: HTMLElement,
    data: PriceCatalogRenderState = { filterGroup: 'all', searchQuery: '', showAddForm: false }
  ): Promise<void> {
    const filterGroup = data.filterGroup ?? 'all';
    const searchQuery = data.searchQuery ?? '';
    const showAddForm = data.showAddForm ?? false;

    const allItems = await this.deps.catalog.getAllCatalogItems();
    const signal = this.beginRender(overlay);
    const sorted = [...allItems].sort((a, b) => a.name.localeCompare(b.name));

    const filtered = sorted.filter((item) => {
      const matchesGroup = filterGroup === 'all' || item.foodGroup === filterGroup;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.aliases.some((a) => a.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q);
      return matchesGroup && matchesSearch;
    });

    const groups: Array<{ id: FoodGroup | 'all'; label: string }> = [
      { id: 'all', label: 'All Groups' },
      { id: 'proteins', label: 'Proteins' },
      { id: 'carbohydrates', label: 'Carbs' },
      { id: 'dairy', label: 'Dairy' },
      { id: 'fats-and-oils', label: 'Fats & Oils' },
      { id: 'vegetables', label: 'Vegetables' },
      { id: 'fruit', label: 'Fruit' },
    ];

    overlay.innerHTML = `
      <div class="glass-panel w-full max-w-4xl p-6 flex flex-col gap-4 bg-white/95 rounded-3xl shadow-xl animate-fade-in max-h-[92vh]">
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-[#25221F]/10 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-[#FAF6F0] border border-[#EFE4D6] flex items-center justify-center">
              ${getIconSvg('chart-bar-filled', 'w-5 h-5')}
            </div>
            <div>
              <h3 class="text-xl font-serif font-bold text-[#25221F]">Master Ingredient Price Catalog</h3>
              <p class="text-xs text-[#77716D]">Reference prices per kg / L / unit used whenever an ingredient isn't priced in your pantry</p>
            </div>
          </div>
          <button id="modal-close-btn" class="glass-circle-btn">
            ${getIconSvg('x', 'w-4 h-4')}
          </button>
        </div>

        <!-- Toolbar: Search + Add New Button -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <input id="catalog-search-input" type="text" placeholder="Search catalog (e.g. chicken, rice, olive oil, egg)..."
                 value="${searchQuery}"
                 class="flex-1 px-3.5 py-2 text-xs rounded-full bg-white border border-[#25221F]/12 focus:outline-none focus:ring-1 focus:ring-[#D9A441] text-[#221F1C]" />

          <button id="btn-toggle-add-catalog" type="button"
                  class="px-4 py-2 rounded-full text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition ${
                    showAddForm ? 'bg-[#FAF6F0] text-[#8C5C26] border border-[#E9D1B4]' : 'bg-[#25221F] text-white hover:bg-[#3D3833]'
                  }">
            ${getIconSvg('plus', 'w-3.5 h-3.5')}
            ${showAddForm ? 'Hide Add Form' : 'Add Reference Item'}
          </button>
        </div>

        <!-- Optional Add Reference Item Inline Form -->
        ${
          showAddForm
            ? `
          <form id="form-add-catalog-item" class="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#EFE4D6] grid grid-cols-1 sm:grid-cols-6 gap-2.5 items-end text-xs shrink-0">
            <div class="sm:col-span-2">
              <label class="block font-semibold text-[#25221F] mb-1">Ingredient Name *</label>
              <input id="new-cat-name" type="text" required placeholder="e.g. Halloumi cheese"
                     class="w-full px-3 py-1.5 rounded-xl bg-white border border-[#E0D3C3] focus:outline-none focus:ring-1 focus:ring-[#D9A441]" />
            </div>
            <div>
              <label class="block font-semibold text-[#25221F] mb-1">Price (R) *</label>
              <input id="new-cat-price" type="number" step="any" min="0" required placeholder="185"
                     class="w-full px-3 py-1.5 rounded-xl bg-white border border-[#E0D3C3] focus:outline-none tabular-nums" />
            </div>
            <div>
              <label class="block font-semibold text-[#25221F] mb-1">Basis</label>
              <select id="new-cat-unit" class="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#E0D3C3] focus:outline-none">
                <option value="kg" selected>per kg</option>
                <option value="L">per L</option>
                <option value="piece">per piece</option>
                <option value="can">per can</option>
                <option value="pack">per pack</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-[#25221F] mb-1">g / piece (opt.)</label>
              <input id="new-cat-grams" type="number" step="any" min="0" placeholder="e.g. 200"
                     class="w-full px-3 py-1.5 rounded-xl bg-white border border-[#E0D3C3] focus:outline-none tabular-nums" />
            </div>
            <div>
              <button type="submit" class="w-full py-1.5 px-3 rounded-xl bg-[#25221F] text-white font-semibold hover:bg-[#3D3833] cursor-pointer">
                Add Item
              </button>
            </div>
          </form>
        `
            : ''
        }

        <!-- Food Group Filter Pills -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0">
          ${groups
            .map(
              (g) => `
            <button type="button" data-cat-group="${g.id}"
                    class="btn-cat-group-filter px-3 py-1 rounded-full text-[11px] font-medium cursor-pointer transition whitespace-nowrap ${
                      filterGroup === g.id
                        ? 'bg-[#25221F] text-white font-semibold'
                        : 'bg-white border border-[#25221F]/10 text-[#6B6560] hover:text-[#221F1C]'
                    }">
              ${g.label}
            </button>
          `
            )
            .join('')}
        </div>

        <!-- Catalog Items Table -->
        <div class="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-[#25221F]/10 bg-white/80">
          <table class="w-full text-left border-collapse text-xs">
            <thead class="sticky top-0 bg-[#FAF6F0]/95 backdrop-blur-md z-10 border-b border-[#25221F]/10 text-[#6B6560]">
              <tr>
                <th class="py-2.5 px-3.5">Ingredient</th>
                <th class="py-2.5 px-3">Ref. Price (ZAR)</th>
                <th class="py-2.5 px-2.5">Basis</th>
                <th class="py-2.5 px-2.5" title="Average weight in grams per countable unit (eggs, onions, slices)">g / unit</th>
                <th class="py-2.5 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#25221F]/6">
              ${
                filtered.length === 0
                  ? `<tr><td colspan="5" class="py-10 text-center text-[#77716D] font-serif">No catalog ingredients match "${searchQuery}".</td></tr>`
                  : filtered
                      .map(
                        (item: MasterIngredient) => `
                <tr class="catalog-row hover:bg-[#FAF6F0]/50 transition" data-id="${item.id}">
                  <td class="py-2 px-3.5">
                    <div class="flex items-center gap-2.5">
                      ${getIngredientMiniIconSvg(item.name, item.category)}
                      <div class="flex flex-col min-w-0">
                        <span class="font-semibold text-[#221F1C] truncate">${item.name}</span>
                        <span class="text-[10.5px] text-[#77716D] truncate">
                          ${item.category}${item.aliases.length > 0 ? ` · ${item.aliases.slice(0, 3).join(', ')}` : ''}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td class="py-2 px-3">
                    <div class="relative w-28">
                      <span class="absolute left-2.5 top-1.5 text-[#77716D] text-[11px]">R</span>
                      <input type="number" step="any" min="0" value="${item.referencePriceZAR}"
                             class="cat-price-input w-full pl-6 pr-2 py-1 rounded-lg bg-white border border-[#25221F]/15 focus:outline-none focus:ring-1 focus:ring-[#D9A441] font-semibold text-[#221F1C] tabular-nums" />
                    </div>
                  </td>
                  <td class="py-2 px-2.5">
                    <select class="cat-unit-select px-2 py-1 rounded-lg bg-white border border-[#25221F]/15 focus:outline-none text-[#221F1C]">
                      ${(['kg', 'g', 'L', 'ml', 'piece', 'can', 'pack'] as MasterPriceUnit[])
                        .map((u) => `<option value="${u}" ${item.priceUnit === u ? 'selected' : ''}>/ ${u}</option>`)
                        .join('')}
                    </select>
                  </td>
                  <td class="py-2 px-2.5">
                    <input type="number" step="any" min="0" placeholder="—"
                           value="${item.avgGramsPerUnit ?? ''}"
                           class="cat-grams-input w-20 px-2 py-1 rounded-lg bg-white border border-[#25221F]/15 focus:outline-none text-[#6B6560] tabular-nums" />
                  </td>
                  <td class="py-2 px-3.5 text-right">
                    <button type="button" class="btn-save-cat-row px-3 py-1 rounded-lg bg-[#25221F]/8 hover:bg-[#25221F] text-[#221F1C] hover:text-white text-[11px] font-semibold cursor-pointer transition"
                            data-id="${item.id}">
                      Save
                    </button>
                  </td>
                </tr>
              `
                      )
                      .join('')
              }
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between pt-2 border-t border-[#25221F]/10 text-xs shrink-0">
          <span class="text-[#77716D] tabular-nums">Showing ${filtered.length} of ${allItems.length} reference ingredients</span>
          <div class="flex items-center gap-2.5">
            <button type="button" id="btn-reset-catalog-defaults" class="px-3.5 py-1.5 rounded-full border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-medium cursor-pointer transition">
              Reset Defaults
            </button>
            <button type="button" id="btn-done-catalog" class="px-5 py-1.5 rounded-full bg-[#25221F] text-white font-medium hover:bg-[#3D3833] cursor-pointer transition">
              Done
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindCloseButton(overlay, signal);

    const searchEl = overlay.querySelector<HTMLInputElement>('#catalog-search-input');
    searchEl?.addEventListener(
      'input',
      async (e) => {
        const val = (e.target as HTMLInputElement).value;
        const pos = (e.target as HTMLInputElement).selectionStart ?? val.length;
        await this.render(overlay, { filterGroup, searchQuery: val, showAddForm });
        const refocused = overlay.querySelector<HTMLInputElement>('#catalog-search-input');
        if (refocused) {
          refocused.focus();
          refocused.setSelectionRange(pos, pos);
        }
      },
      { signal }
    );

    overlay.querySelectorAll<HTMLButtonElement>('.btn-cat-group-filter').forEach((btn) => {
      btn.addEventListener(
        'click',
        async () => {
          const nextGroup = (btn.getAttribute('data-cat-group') as FoodGroup | 'all') || 'all';
          await this.render(overlay, { filterGroup: nextGroup, searchQuery, showAddForm });
        },
        { signal }
      );
    });

    overlay.querySelector('#btn-toggle-add-catalog')?.addEventListener(
      'click',
      async () => {
        await this.render(overlay, { filterGroup, searchQuery, showAddForm: !showAddForm });
      },
      { signal }
    );

    overlay
      .querySelector<HTMLFormElement>('#form-add-catalog-item')
      ?.addEventListener(
        'submit',
        async (e) => {
          e.preventDefault();
          const name = (overlay.querySelector('#new-cat-name') as HTMLInputElement)?.value.trim();
          const price = parseFloat(
            (overlay.querySelector('#new-cat-price') as HTMLInputElement)?.value || '0'
          );
          const priceUnit = ((overlay.querySelector('#new-cat-unit') as HTMLSelectElement)?.value ||
            'kg') as MasterPriceUnit;
          const gramsRaw = parseFloat(
            (overlay.querySelector('#new-cat-grams') as HTMLInputElement)?.value || '0'
          );
          if (!name || price <= 0) {
            this.deps.state.showToast('Enter a valid name and positive reference price', 'warning');
            return;
          }
          await this.deps.catalog.addCatalogItem({
            name,
            referencePriceZAR: price,
            priceUnit,
            avgGramsPerUnit: gramsRaw > 0 ? gramsRaw : undefined,
          });
          await this.deps.state.refreshBudget();
          this.deps.state.showToast(
            `Added "${name}" (${formatZAR(price)}/${priceUnit}) to Master Catalog`,
            'success'
          );
          await this.render(overlay, { filterGroup, searchQuery, showAddForm: false });
        },
        { signal }
      );

    overlay.querySelectorAll<HTMLButtonElement>('.btn-save-cat-row').forEach((btn) => {
      btn.addEventListener(
        'click',
        async () => {
          const id = btn.getAttribute('data-id');
          const row = btn.closest('.catalog-row');
          if (!id || !row) return;
          const price = parseFloat(
            (row.querySelector('.cat-price-input') as HTMLInputElement)?.value || '0'
          );
          const priceUnit = ((row.querySelector('.cat-unit-select') as HTMLSelectElement)?.value ||
            'kg') as MasterPriceUnit;
          const gramsVal = (row.querySelector('.cat-grams-input') as HTMLInputElement)?.value;
          const avgGrams = gramsVal ? parseFloat(gramsVal) : undefined;

          const updated = await this.deps.catalog.updateCatalogItem(id, {
            referencePriceZAR: Math.max(0, price),
            priceUnit,
            avgGramsPerUnit: avgGrams && avgGrams > 0 ? avgGrams : undefined,
          });
          if (updated) {
            await this.deps.state.refreshBudget();
            this.deps.state.showToast(
              `Saved ${updated.name}: ${formatZAR(updated.referencePriceZAR)}/${updated.priceUnit}`,
              'success'
            );
          }
        },
        { signal }
      );
    });

    overlay.querySelector('#btn-reset-catalog-defaults')?.addEventListener(
      'click',
      async () => {
        if (confirm('Reset all Master Ingredient Catalog reference prices to defaults?')) {
          await this.deps.catalog.resetToDefaults();
          await this.deps.state.refreshBudget();
          this.deps.state.showToast('Master Catalog reference prices reset to defaults', 'info');
          await this.render(overlay, { filterGroup, searchQuery, showAddForm: false });
        }
      },
      { signal }
    );

    overlay.querySelector('#btn-done-catalog')?.addEventListener(
      'click',
      () => {
        this.deps.state.closeModal();
      },
      { signal }
    );
  }
}
