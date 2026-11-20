import { BaseModal } from '../BaseModal';
import {
  IngredientInventory,
  StorageLocation,
  IngredientCategory,
} from '../../../models/IngredientInventory';
import { getIconSvg } from '../../../utils/iconHelper';
import {
  getAvailablePriceUnits,
  formatZAR,
  calculateIngredientCost,
} from '../../../utils/pricingUtils';

export interface InventoryModalData {
  ingredient?: IngredientInventory;
}

export class InventoryModal extends BaseModal<InventoryModalData> {
  render(overlay: HTMLElement, data?: InventoryModalData): void {
    const signal = this.beginRender(overlay);
    const ingredient = data?.ingredient;
    const isEdit = !!ingredient;
    const title = isEdit ? 'Edit Ingredient' : 'Add Ingredient to Pantry';

    const curName = ingredient?.name || '';
    const curQty = ingredient?.quantity ?? 500;
    const curUnit = ingredient?.unit || 'g';
    const curMin = ingredient?.minStockLevel ?? 200;
    const curLoc: StorageLocation = ingredient?.location || 'Pantry';
    const curCat: IngredientCategory = ingredient?.category || 'Produce';
    const curNotes = ingredient?.notes || '';

    const curPrice =
      ingredient?.price ??
      (curUnit === 'kg' || curUnit === 'g' ? 55 : curUnit === 'ml' || curUnit === 'L' ? 28 : 5);
    const availablePriceUnits = getAvailablePriceUnits(curUnit);
    const curPriceUnit =
      ingredient?.priceUnit ||
      availablePriceUnits.find((u) => u.isDefault)?.value ||
      availablePriceUnits[0]?.value ||
      'kg';

    overlay.innerHTML = `
      <div class="glass-panel w-full max-w-lg p-6 flex flex-col gap-4 bg-white/95 rounded-3xl shadow-xl animate-fade-in max-h-[92vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-2 border-b border-[#25221F]/10">
          <div>
            <h3 class="text-xl font-serif font-bold text-[#25221F]">${title}</h3>
            <p class="text-xs text-[#77716D]">Specify quantity, per-unit pricing, minimum stock alert, and location</p>
          </div>
          <button id="modal-close-btn" class="glass-circle-btn">
            ${getIconSvg('x', 'w-4 h-4')}
          </button>
        </div>

        <form id="inventory-editor-form" class="flex flex-col gap-3.5 text-xs">
          <div>
            <label class="block font-semibold text-[#25221F] mb-1">Ingredient Name *</label>
            <input id="input-inv-name" type="text" required value="${curName}" placeholder="e.g. Free-range chicken pieces" 
                   class="w-full px-3 py-2 rounded-xl glass-card border focus:outline-none focus:ring-1 focus:ring-[#D9A441]" />
          </div>

          <!-- Stock Quantity & Unit -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-[#25221F] mb-1">Current Stock Quantity *</label>
              <input id="input-inv-qty" type="number" step="any" min="0" required value="${curQty}" 
                     class="w-full px-3 py-2 rounded-xl glass-card border focus:outline-none" />
            </div>

            <div>
              <label class="block font-semibold text-[#25221F] mb-1">Unit of Measure *</label>
              <select id="select-inv-unit" class="w-full px-3 py-2 rounded-xl glass-card border focus:outline-none">
                ${['g', 'kg', 'ml', 'L', 'pieces', 'large', 'medium', 'slices', 'cloves', 'cans', 'pack']
                  .map(
                    (u) => `
                  <option value="${u}" ${curUnit === u ? 'selected' : ''}>${u}</option>
                `
                  )
                  .join('')}
              </select>
            </div>
          </div>

          <!-- Pricing Section (per g / kg for solids, per ml / L for liquids) -->
          <div class="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#EFE4D6] flex flex-col gap-2.5">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-[#8C5C26] flex items-center gap-1.5 text-xs">
                ${getIconSvg('chart-bar', 'w-4 h-4')}
                Ingredient Pricing (ZAR)
              </span>
              <span id="price-conversion-tip" class="text-[10px] text-[#77716D] font-mono"></span>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-medium text-[#25221F] mb-1">Price (Rands)</label>
                <div class="relative">
                  <span class="absolute left-3 top-2 text-[#77716D] font-medium text-xs">R</span>
                  <input id="input-inv-price" type="number" step="any" min="0" value="${curPrice}" 
                         class="w-full pl-7 pr-3 py-2 rounded-xl bg-white border border-[#E0D3C3] focus:outline-none focus:ring-1 focus:ring-[#D9A441]" />
                </div>
              </div>

              <div>
                <label class="block font-medium text-[#25221F] mb-1">Pricing Basis</label>
                <select id="select-inv-price-unit" class="w-full px-3 py-2 rounded-xl bg-white border border-[#E0D3C3] focus:outline-none">
                  <!-- Dynamically rendered based on solid vs liquid unit -->
                </select>
              </div>
            </div>

            <div class="flex items-center justify-between pt-1 text-[11px] border-t border-[#EFE4D6]/70">
              <span class="text-[#77716D]">Current Stock Value:</span>
              <span id="inventory-item-total-value" class="font-bold text-[#8C5C26] tabular-nums">R0.00</span>
            </div>
          </div>

          <!-- Minimum Stock & Location -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-[#25221F] mb-1">Minimum Stock Alert</label>
              <input id="input-inv-min" type="number" step="any" min="0" value="${curMin}" 
                     class="w-full px-3 py-2 rounded-xl glass-card border focus:outline-none" />
              <span class="text-[10px] text-[#77716D] mt-0.5 block">Flags as 'Low Stock' when reached</span>
            </div>

            <div>
              <label class="block font-semibold text-[#25221F] mb-1">Storage Location</label>
              <select id="select-inv-location" class="w-full px-3 py-2 rounded-xl glass-card border focus:outline-none">
                ${['Pantry', 'Fridge', 'Freezer', 'Spice Rack', 'Counter']
                  .map(
                    (loc) => `
                  <option value="${loc}" ${curLoc === loc ? 'selected' : ''}>${loc}</option>
                `
                  )
                  .join('')}
              </select>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-[#25221F] mb-1">Food Category</label>
            <select id="select-inv-category" class="w-full px-3 py-2 rounded-xl glass-card border focus:outline-none">
              ${[
                'Produce',
                'Meat & Poultry',
                'Dairy & Eggs',
                'Pantry',
                'Bakery',
                'Spices & Condiments',
                'Other',
              ]
                .map(
                  (cat) => `
                <option value="${cat}" ${curCat === cat ? 'selected' : ''}>${cat}</option>
              `
                )
                .join('')}
            </select>
          </div>

          <div>
            <label class="block font-semibold text-[#25221F] mb-1">Notes / Brand</label>
            <input id="input-inv-notes" type="text" value="${curNotes}" placeholder="Optional details (e.g. Organic, Woolworths, bottom crisper)" 
                   class="w-full px-3 py-2 rounded-xl glass-card border focus:outline-none" />
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-[#25221F]/10">
            <button type="button" id="btn-cancel-inv" class="px-4 py-2 rounded-xl glass-card font-medium text-[#77716D] cursor-pointer">
              Cancel
            </button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-[#25221F] text-white font-medium hover:bg-[#3D3833] cursor-pointer shadow-sm">
              ${isEdit ? 'Save Changes' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
    `;

    this.bindCloseButton(overlay, signal);

    const nameInput = overlay.querySelector<HTMLInputElement>('#input-inv-name')!;
    const unitSelect = overlay.querySelector<HTMLSelectElement>('#select-inv-unit')!;
    const priceUnitSelect = overlay.querySelector<HTMLSelectElement>('#select-inv-price-unit')!;
    const priceInput = overlay.querySelector<HTMLInputElement>('#input-inv-price')!;
    const qtyInput = overlay.querySelector<HTMLInputElement>('#input-inv-qty')!;
    const locationSelect = overlay.querySelector<HTMLSelectElement>('#select-inv-location')!;
    const categorySelect = overlay.querySelector<HTMLSelectElement>('#select-inv-category')!;
    const totalValSpan = overlay.querySelector<HTMLElement>('#inventory-item-total-value')!;
    const tipSpan = overlay.querySelector<HTMLElement>('#price-conversion-tip')!;

    let priceEditedManually = isEdit;

    const updatePriceUnitOptions = (selectedUnit: string, preserveSelection?: string) => {
      const units = getAvailablePriceUnits(selectedUnit);
      const hasPreserve = preserveSelection && units.some((u) => u.value === preserveSelection);
      const finalUnits =
        preserveSelection && !hasPreserve
          ? [...units, { value: preserveSelection, label: `per ${preserveSelection}` }]
          : units;
      priceUnitSelect.innerHTML = finalUnits
        .map(
          (u) => `
        <option value="${u.value}" ${
            preserveSelection === u.value || (!preserveSelection && u.isDefault) ? 'selected' : ''
          }>
          ${u.label}
        </option>
      `
        )
        .join('');
    };

    const updateLiveCalculations = () => {
      const p = parseFloat(priceInput.value) || 0;
      const pu = priceUnitSelect.value;
      const q = parseFloat(qtyInput.value) || 0;
      const u = unitSelect.value;
      const catMatch = this.deps.catalog.findCatalogItem(nameInput.value);

      const totalCost = calculateIngredientCost(
        q,
        u,
        p,
        pu,
        catMatch?.avgGramsPerUnit,
        catMatch?.avgMlPerUnit
      );
      totalValSpan.textContent = formatZAR(totalCost);

      if (pu === 'kg' && p > 0) {
        tipSpan.textContent = `1 kg = 1,000 g (R${(p / 1000).toFixed(3)}/g)`;
      } else if (pu === 'g' && p > 0) {
        tipSpan.textContent = `1 g = R${p.toFixed(3)} (R${(p * 1000).toFixed(2)}/kg)`;
      } else if (pu === 'L' && p > 0) {
        tipSpan.textContent = `1 L = 1,000 ml (R${(p / 1000).toFixed(3)}/ml)`;
      } else if (pu === 'ml' && p > 0) {
        tipSpan.textContent = `1 ml = R${p.toFixed(3)} (R${(p * 1000).toFixed(2)}/L)`;
      } else {
        tipSpan.textContent = '';
      }
    };

    updatePriceUnitOptions(curUnit, curPriceUnit);
    updateLiveCalculations();

    nameInput.addEventListener(
      'blur',
      () => {
        if (priceEditedManually) return;
        const match = this.deps.catalog.findCatalogItem(nameInput.value);
        if (match) {
          priceInput.value = String(match.referencePriceZAR);
          locationSelect.value = match.defaultLocation;
          categorySelect.value = match.category;
          if (
            match.defaultUnit &&
            Array.from(unitSelect.options).some((o) => o.value === match.defaultUnit)
          ) {
            unitSelect.value = match.defaultUnit;
          }
          updatePriceUnitOptions(unitSelect.value, match.priceUnit);
          updateLiveCalculations();
          tipSpan.textContent = `Catalog ref: ${formatZAR(match.referencePriceZAR)}/${match.priceUnit}`;
        }
      },
      { signal }
    );

    unitSelect.addEventListener(
      'change',
      () => {
        updatePriceUnitOptions(unitSelect.value);
        updateLiveCalculations();
      },
      { signal }
    );

    priceUnitSelect.addEventListener(
      'change',
      () => {
        priceEditedManually = true;
        updateLiveCalculations();
      },
      { signal }
    );
    priceInput.addEventListener(
      'input',
      () => {
        priceEditedManually = true;
        updateLiveCalculations();
      },
      { signal }
    );
    qtyInput.addEventListener('input', updateLiveCalculations, { signal });

    const form = overlay.querySelector<HTMLFormElement>('#inventory-editor-form');
    form?.addEventListener(
      'submit',
      async (e) => {
        e.preventDefault();
        const name = nameInput.value.trim();
        const rawQty = qtyInput.value.trim();
        const qty = Number(rawQty);
        const unit = unitSelect.value;
        const minRaw = (overlay.querySelector('#input-inv-min') as HTMLInputElement).value.trim();
        const minStock = minRaw === '' ? 0 : Number(minRaw);
        const location = locationSelect.value as StorageLocation;
        const category = categorySelect.value as IngredientCategory;
        const notes = (overlay.querySelector('#input-inv-notes') as HTMLInputElement).value.trim();
        const priceRaw = priceInput.value.trim();
        const price = priceRaw === '' ? 0 : Number(priceRaw);
        const priceUnit = priceUnitSelect.value;

        if (!name) {
          this.deps.state.showToast('Ingredient name is required.', 'warning');
          return;
        }
        if (!rawQty || !Number.isFinite(qty) || qty < 0) {
          this.deps.state.showToast('Stock quantity must be a valid number of 0 or more.', 'warning');
          return;
        }
        if (!Number.isFinite(minStock) || minStock < 0) {
          this.deps.state.showToast('Minimum stock alert must be 0 or more.', 'warning');
          return;
        }
        if (!Number.isFinite(price) || price < 0) {
          this.deps.state.showToast('Price must be 0 or more.', 'warning');
          return;
        }

        try {
          if (isEdit && ingredient) {
            await this.deps.inventory.updateIngredient(ingredient.id, {
              name,
              quantity: qty,
              unit,
              minStockLevel: minStock,
              location,
              category,
              notes,
              price,
              priceUnit,
            });
            this.deps.state.showToast(`Updated "${name}"`, 'success');
          } else {
            await this.deps.inventory.addIngredient({
              name,
              quantity: qty,
              unit,
              minStockLevel: minStock,
              location,
              category,
              notes,
              price,
              priceUnit,
            });
            this.deps.state.showToast(`Added "${name}" to pantry`, 'success');
          }

          await this.deps.state.refreshBudget();
          this.deps.state.closeModal();
        } catch (err) {
          this.deps.state.showToast(
            err instanceof Error ? err.message : 'Unable to save ingredient.',
            'warning'
          );
        }
      },
      { signal }
    );

    overlay.querySelector('#btn-cancel-inv')?.addEventListener(
      'click',
      () => {
        this.deps.state.closeModal();
      },
      { signal }
    );
  }
}
