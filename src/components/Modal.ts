import { appState } from '../app/state';
import { recipeService, MEAL_IMAGES } from '../services/recipeService';
import { mealPlanService } from '../services/mealPlanService';
import { inventoryService } from '../services/inventoryService';
import { Recipe } from '../models/Recipe';
import { Ingredient } from '../models/Ingredient';
import {
  IngredientInventory,
  StorageLocation,
  IngredientCategory,
} from '../models/IngredientInventory';
import { DAY_NAMES, getWeekDates } from '../utils/dateUtils';
import { getIconSvg } from '../utils/iconHelper';
import { formatSmartQuantity } from '../utils/unitConversion';
import { aiRecipeService } from '../services/aiRecipeService';
import {
  getAvailablePriceUnits,
  formatZAR,
  formatPriceRate,
  calculateIngredientCost,
} from '../utils/pricingUtils';

export class Modal {
  private overlay: HTMLElement;
  private currentModalId: string | null = null;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.className =
      'fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay hidden select-none';
    this.render();
  }

  getElement(): HTMLElement {
    return this.overlay;
  }

  async render(force: boolean = false): Promise<void> {
    const state = appState.getState();
    const modalData = state.activeModal;

    if (!modalData || !modalData.type) {
      this.currentModalId = null;
      this.overlay.classList.add('hidden');
      this.overlay.innerHTML = '';
      return;
    }

    // Preserve active form state if this modal instance is already open and being edited
    if (!force && modalData.id && this.currentModalId === modalData.id) {
      return;
    }

    this.currentModalId = modalData.id || `modal-${modalData.type}`;
    this.overlay.classList.remove('hidden');

    switch (modalData.type) {
      case 'meal-completion':
        await this.renderMealCompletion(modalData.data);
        break;
      case 'add-inventory':
        this.renderInventoryForm();
        break;
      case 'edit-inventory':
        this.renderInventoryForm(modalData.data?.ingredient);
        break;
      case 'inventory-activity':
        await this.renderInventoryActivity(modalData.data?.ingredient);
        break;
      case 'assign-meal':
        await this.renderAssignMeal(modalData.data);
        break;
      case 'edit-recipe':
      case 'create-recipe':
        await this.renderRecipeForm(modalData.data?.recipe);
        break;
      case 'week-selector':
        this.renderWeekSelector();
        break;
      case 'ios-pwa-guide':
        this.renderIosGuide();
        break;
    }

    this.bindCommonEvents();
  }

  // --- 1. Meal Completion Workflow Modal ---

  private async renderMealCompletion(data: {
    plannedMeal: any;
    recipe: Recipe;
    servings: number;
    dayIndex: number;
    mealType: 'breakfast' | 'dinner';
  }): Promise<void> {
    const { plannedMeal, recipe, servings, dayIndex, mealType } = data;
    const reqCheck = await inventoryService.checkMealRequirements(recipe, servings);
    const dayName = DAY_NAMES[dayIndex] || 'Monday';
    const mealLabel = mealType === 'breakfast' ? 'Breakfast' : 'Dinner';

    this.overlay.innerHTML = `
      <div class="glass-panel w-full max-w-2xl p-6 flex flex-col gap-4 bg-white/95 rounded-3xl shadow-xl animate-fade-in max-h-[92vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-[#25221F]/10">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-[#FBF5ED] border border-[#F3E2CE] flex items-center justify-center text-[#8C5C26]">
              ${getIconSvg('utensils', 'w-6 h-6')}
            </div>
            <div>
              <h3 class="text-xl font-serif font-bold text-[#25221F]">Mark as Cooked: ${recipe.title}</h3>
              <p class="text-xs text-[#77716D]">${dayName} ${mealLabel} · Serves ${servings} people</p>
            </div>
          </div>
          <button id="modal-close-btn" class="glass-circle-btn">
            ${getIconSvg('x', 'w-4 h-4')}
          </button>
        </div>

        <!-- Shortage Warning if any ingredients are insufficient -->
        ${
          reqCheck.hasShortages
            ? `
          <div class="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col gap-2">
            <div class="flex items-center gap-2 font-semibold text-xs text-amber-800">
              ${getIconSvg('alert-triangle', 'w-4 h-4 text-amber-600')}
              <span>Insufficient Inventory Detected</span>
            </div>
            <div class="text-xs space-y-1">
              ${reqCheck.items
                .filter((i) => !i.sufficient)
                .map(
                  (i) => `
                <div class="flex items-center justify-between">
                  <span>${recipe.title} requires <strong>${formatSmartQuantity(i.requiredQuantity, i.unit)}</strong> of ${i.recipeIngredientName}, but only <strong>${formatSmartQuantity(i.availableQuantityInMatchingUnit, i.unit)}</strong> is in stock. Short by <strong>${formatSmartQuantity(i.shortfall, i.unit)}</strong>.</span>
                  <button class="btn-quick-restock px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-[11px] font-semibold text-amber-900 cursor-pointer transition ml-2 whitespace-nowrap"
                          data-name="${i.recipeIngredientName}" data-shortfall="${i.shortfall}" data-unit="${i.unit}">
                    + Quick Restock
                  </button>
                </div>
              `
                )
                .join('')}
            </div>
            <p class="text-[11px] text-amber-700/90 pt-1 border-t border-amber-200/60">
              You can adjust actual quantities below, quick-restock, or proceed with deducting available stock.
            </p>
          </div>
        `
            : ''
        }

        <!-- Deduction Breakdown Table -->
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#25221F]">Ingredients Usage & Stock Deductions</span>
            <span class="text-[11px] text-[#77716D]">Adjust values if you used different amounts</span>
          </div>

          <div class="glass-card rounded-2xl overflow-hidden border border-white/80">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="bg-white/50 text-[#77716D] font-medium border-b border-[#25221F]/5">
                  <th class="py-2.5 px-3">Ingredient</th>
                  <th class="py-2.5 px-3">Required</th>
                  <th class="py-2.5 px-3">In Pantry</th>
                  <th class="py-2.5 px-3">Deduct</th>
                  <th class="py-2.5 px-3 text-right">Remaining</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#25221F]/5">
                ${reqCheck.items
                  .map((item, idx) => {
                    const statusClass = item.sufficient ? 'text-[#3E703E]' : 'text-amber-700';
                    return `
                  <tr class="deduction-row hover:bg-white/40 transition" data-idx="${idx}">
                    <td class="py-2.5 px-3 font-semibold text-[#25221F]">
                      ${item.recipeIngredientName}
                    </td>
                    <td class="py-2.5 px-3 text-[#77716D] tabular-nums">
                      ${formatSmartQuantity(item.requiredQuantity, item.unit)}
                    </td>
                    <td class="py-2.5 px-3 tabular-nums ${statusClass}">
                      ${formatSmartQuantity(item.availableQuantityInMatchingUnit, item.unit)}
                    </td>
                    <td class="py-2.5 px-3">
                      <div class="flex items-center gap-1">
                        <input type="number" step="any" min="0" 
                               value="${item.proposedDeduction}" 
                               data-name="${item.recipeIngredientName}"
                               data-unit="${item.unit}"
                               data-avail="${item.availableQuantityInMatchingUnit}"
                               class="input-deduct-qty w-20 px-2 py-1 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#D9A441] text-xs font-semibold text-[#25221F]" />
                        <span class="text-[11px] text-[#77716D]">${item.unit}</span>
                      </div>
                    </td>
                    <td class="py-2.5 px-3 text-right tabular-nums font-medium text-[#25221F] remaining-stock-col">
                      ${formatSmartQuantity(item.remainingStock, item.unit)}
                    </td>
                  </tr>
                `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-between pt-3 border-t border-[#25221F]/10">
          <button type="button" id="btn-cancel-completion" class="px-4 py-2 rounded-xl glass-card font-medium text-[#77716D] cursor-pointer">
            Cancel
          </button>

          <button type="button" id="btn-confirm-cooking" 
                  class="px-5 py-2.5 rounded-xl bg-[#25221F] text-white font-semibold hover:bg-[#3D3833] cursor-pointer shadow-sm flex items-center gap-2">
            ${getIconSvg('check-circle', 'w-4 h-4 text-emerald-400')}
            Confirm & Deduct Ingredients
          </button>
        </div>
      </div>
    `;

    // Recalculate remaining stock on input change
    const deductInputs = this.overlay.querySelectorAll<HTMLInputElement>('.input-deduct-qty');
    deductInputs.forEach((input) => {
      input.addEventListener('input', () => {
        const row = input.closest('.deduction-row');
        const avail = parseFloat(input.getAttribute('data-avail') || '0');
        const unit = input.getAttribute('data-unit') || '';
        const deduct = parseFloat(input.value) || 0;
        const remaining = Math.max(0, avail - deduct);
        const remCol = row?.querySelector('.remaining-stock-col');
        if (remCol) {
          remCol.textContent = formatSmartQuantity(remaining, unit);
        }
      });
    });

    // Quick Restock buttons
    const restockBtns = this.overlay.querySelectorAll<HTMLButtonElement>('.btn-quick-restock');
    restockBtns.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const name = btn.getAttribute('data-name');
        const shortfall = parseFloat(btn.getAttribute('data-shortfall') || '0');
        const unit = btn.getAttribute('data-unit') || 'g';
        if (name && shortfall > 0) {
          await inventoryService.addStock(name, shortfall, unit, 'Fridge', 'Produce');
          appState.showToast(`Restocked ${formatSmartQuantity(shortfall, unit)} of ${name}!`, 'success');
          // Re-render completion modal with updated stock
          await this.renderMealCompletion(data);
        }
      });
    });

    // Confirm button
    const confirmBtn = this.overlay.querySelector('#btn-confirm-cooking');
    confirmBtn?.addEventListener('click', async () => {
      const customDeductions: Array<{ recipeIngredientName: string; deductionQuantity: number; unit: string }> = [];

      deductInputs.forEach((input) => {
        const name = input.getAttribute('data-name') || '';
        const unit = input.getAttribute('data-unit') || '';
        const qty = parseFloat(input.value) || 0;
        customDeductions.push({
          recipeIngredientName: name,
          deductionQuantity: qty,
          unit,
        });
      });

      const state = appState.getState();
      if (state.currentPlan) {
        const completion = await inventoryService.completeMeal({
          mealId: plannedMeal.id,
          weekId: state.currentPlan.id,
          dayIndex,
          mealType,
          recipe,
          targetServings: servings,
          customDeductions,
        });

        await mealPlanService.updateMealStatus(state.currentPlan.id, dayIndex, mealType, 'cooked', completion.id);

        appState.showToast(`Marked ${recipe.title} as cooked! Deducted stock from pantry.`, 'success');
        await appState.setWeekOffset(state.weekOffset);
        appState.closeModal();
      }
    });

    const cancelBtn = this.overlay.querySelector('#btn-cancel-completion');
    cancelBtn?.addEventListener('click', () => {
      appState.closeModal();
    });
  }

  // --- 2. Add / Edit Inventory Item Modal ---

  private renderInventoryForm(ingredient?: IngredientInventory): void {
    const isEdit = !!ingredient;
    const title = isEdit ? 'Edit Ingredient' : 'Add Ingredient to Pantry';

    const curName = ingredient?.name || '';
    const curQty = ingredient?.quantity ?? 500;
    const curUnit = ingredient?.unit || 'g';
    const curMin = ingredient?.minStockLevel ?? 200;
    const curLoc: StorageLocation = ingredient?.location || 'Pantry';
    const curCat: IngredientCategory = ingredient?.category || 'Produce';
    const curNotes = ingredient?.notes || '';

    // Initial pricing state
    const curPrice = ingredient?.price ?? (curUnit === 'kg' || curUnit === 'g' ? 55 : curUnit === 'ml' || curUnit === 'L' ? 28 : 5);
    const availablePriceUnits = getAvailablePriceUnits(curUnit);
    const curPriceUnit = ingredient?.priceUnit || (availablePriceUnits.find((u) => u.isDefault)?.value || availablePriceUnits[0]?.value || 'kg');

    this.overlay.innerHTML = `
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

    const unitSelect = this.overlay.querySelector<HTMLSelectElement>('#select-inv-unit')!;
    const priceUnitSelect = this.overlay.querySelector<HTMLSelectElement>('#select-inv-price-unit')!;
    const priceInput = this.overlay.querySelector<HTMLInputElement>('#input-inv-price')!;
    const qtyInput = this.overlay.querySelector<HTMLInputElement>('#input-inv-qty')!;
    const totalValSpan = this.overlay.querySelector<HTMLElement>('#inventory-item-total-value')!;
    const tipSpan = this.overlay.querySelector<HTMLElement>('#price-conversion-tip')!;

    // Helper to populate price unit dropdown based on selected measurement unit
    const updatePriceUnitOptions = (selectedUnit: string, preserveSelection?: string) => {
      const units = getAvailablePriceUnits(selectedUnit);
      priceUnitSelect.innerHTML = units
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

      const totalCost = calculateIngredientCost(q, u, p, pu);
      totalValSpan.textContent = formatZAR(totalCost);

      // Conversion tip
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

    unitSelect.addEventListener('change', () => {
      updatePriceUnitOptions(unitSelect.value);
      updateLiveCalculations();
    });

    priceUnitSelect.addEventListener('change', updateLiveCalculations);
    priceInput.addEventListener('input', updateLiveCalculations);
    qtyInput.addEventListener('input', updateLiveCalculations);

    const form = this.overlay.querySelector<HTMLFormElement>('#inventory-editor-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (this.overlay.querySelector('#input-inv-name') as HTMLInputElement).value.trim();
      const qty = parseFloat(qtyInput.value) || 0;
      const unit = unitSelect.value;
      const minStock = parseFloat((this.overlay.querySelector('#input-inv-min') as HTMLInputElement).value) || 0;
      const location = (this.overlay.querySelector('#select-inv-location') as HTMLSelectElement).value as StorageLocation;
      const category = (this.overlay.querySelector('#select-inv-category') as HTMLSelectElement).value as IngredientCategory;
      const notes = (this.overlay.querySelector('#input-inv-notes') as HTMLInputElement).value.trim();
      const price = parseFloat(priceInput.value) || 0;
      const priceUnit = priceUnitSelect.value;

      if (isEdit && ingredient) {
        await inventoryService.updateIngredient(ingredient.id, {
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
        appState.showToast(`Updated "${name}"`, 'success');
      } else {
        await inventoryService.addIngredient({
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
        appState.showToast(`Added "${name}" to pantry`, 'success');
      }

      appState.closeModal();
    });

    this.overlay.querySelector('#btn-cancel-inv')?.addEventListener('click', () => {
      appState.closeModal();
    });
  }

  // --- 3. Inventory Activity History Modal ---

  private async renderInventoryActivity(specificIngredient?: IngredientInventory): Promise<void> {
    const transactions = await inventoryService.getAllTransactions(specificIngredient?.id);
    const title = specificIngredient ? `${specificIngredient.name} History` : 'Ingredient Activity History';

    this.overlay.innerHTML = `
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
          ${this.renderTransactionItems(transactions)}
        </div>
      </div>
    `;

    const txBtns = this.overlay.querySelectorAll<HTMLButtonElement>('.btn-tx-filter');
    txBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-tx-type');
        txBtns.forEach((b) => b.classList.remove('bg-[#25221F]', 'text-white'));
        btn.classList.add('bg-[#25221F]', 'text-white');

        const filtered =
          !type || type === 'All' ? transactions : transactions.filter((t) => t.type === type);
        const container = this.overlay.querySelector('#tx-list-container');
        if (container) {
          container.innerHTML = this.renderTransactionItems(filtered);
        }
      });
    });

    // Default select All
    const allBtn = this.overlay.querySelector<HTMLButtonElement>('[data-tx-type="All"]');
    allBtn?.classList.add('bg-[#25221F]', 'text-white');
  }

  private renderTransactionItems(transactions: any[]): string {
    if (transactions.length === 0) {
      return `<div class="py-12 text-center text-[#77716D] font-serif text-xs">No activity records found.</div>`;
    }

    return transactions
      .map((tx) => {
        const isPositive = tx.quantityChange > 0;
        const changeStr = `${isPositive ? '+' : ''}${tx.quantityChange} ${tx.unit}`;
        let badgeColor = '';
        if (tx.type === 'Purchase') badgeColor = 'bg-[#EAF5EA] text-[#3E703E] border-[#D5EAD5]';
        else if (tx.type === 'Meal Usage') badgeColor = 'bg-[#FDF4E7] text-[#B87A24] border-[#F6DEBD]';
        else if (tx.type === 'Reversal') badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
        else if (tx.type === 'Waste') badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
        else badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';

        const dateStr = new Date(tx.timestamp).toLocaleString('en-ZA', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return `
          <div class="p-3 rounded-2xl glass-card flex items-center justify-between border border-white/80">
            <div class="flex items-center gap-3">
              <span class="px-2.5 py-1 rounded-full text-[10.5px] font-semibold border ${badgeColor}">
                ${tx.type}
              </span>
              <div class="flex flex-col">
                <span class="text-xs font-semibold text-[#25221F]">${tx.ingredientName}</span>
                <span class="text-[11px] text-[#77716D]">${tx.notes || ''} ${tx.mealTitle ? `· ${tx.mealTitle}` : ''}</span>
              </div>
            </div>

            <div class="flex flex-col items-end">
              <span class="text-xs font-bold tabular-nums ${isPositive ? 'text-[#3E703E]' : 'text-[#8C5C26]'}">
                ${changeStr}
              </span>
              <span class="text-[10px] text-[#77716D]">${dateStr}</span>
            </div>
          </div>
        `;
      })
      .join('');
  }

  // --- 4. Existing Assign Meal, Recipe Form, Week Selector, iOS Guide ---

  private async renderAssignMeal(data?: { dayIndex?: number; mealType?: 'breakfast' | 'dinner' }): Promise<void> {
    const dayIndex = data?.dayIndex ?? appState.getState().selectedDayIndex;
    const mealType = data?.mealType ?? appState.getState().selectedMealType;
    const dayName = DAY_NAMES[dayIndex] || 'Monday';
    const recipes = await recipeService.getAllRecipes();

    const relevantCategory = mealType === 'breakfast' ? 'Breakfast' : 'Dinner';
    const sortedRecipes = [...recipes].sort((a, b) => {
      if (a.category === relevantCategory && b.category !== relevantCategory) return -1;
      if (b.category === relevantCategory && a.category !== relevantCategory) return 1;
      return a.title.localeCompare(b.title);
    });

    this.overlay.innerHTML = `
      <div class="glass-panel w-full max-w-lg p-6 flex flex-col gap-4 bg-white/95 rounded-3xl shadow-xl animate-fade-in max-h-[90vh]">
        <div class="flex items-center justify-between pb-2 border-b border-[#25221F]/10">
          <div>
            <h3 class="text-xl font-serif font-bold text-[#25221F]">Plan ${dayName} ${mealType === 'breakfast' ? 'Breakfast' : 'Dinner'}</h3>
            <p class="text-xs text-[#77716D]">Choose a recipe from your collection</p>
          </div>
          <button id="modal-close-btn" class="glass-circle-btn">
            ${getIconSvg('x', 'w-4 h-4')}
          </button>
        </div>

        <div class="flex flex-col gap-2 overflow-y-auto max-h-[380px] pr-1">
          ${sortedRecipes
            .map(
              (r) => `
            <div class="assign-recipe-option flex items-center justify-between p-3 rounded-2xl glass-card hover:bg-white/90 border border-white/80 cursor-pointer transition group" data-id="${r.id}">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl overflow-hidden bg-[#F4E9E2] shrink-0 border border-white">
                  <img src="${r.imageUrl}" alt="${r.title}" class="w-full h-full object-cover" />
                </div>
                <div class="flex flex-col">
                  <span class="text-sm font-semibold text-[#25221F]">${r.title}</span>
                  <span class="text-xs text-[#77716D]">${r.category} · Serves ${r.servings} · ${r.ingredients.length} ingredients</span>
                </div>
              </div>
              <button class="px-3 py-1.5 rounded-xl bg-[#25221F] text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition">
                Select
              </button>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;

    const options = this.overlay.querySelectorAll<HTMLElement>('.assign-recipe-option');
    options.forEach((opt) => {
      opt.addEventListener('click', async () => {
        const recipeId = opt.getAttribute('data-id');
        const state = appState.getState();
        if (recipeId && state.currentPlan) {
          await mealPlanService.assignMeal(state.currentPlan.id, dayIndex, mealType, recipeId);
          await appState.setWeekOffset(state.weekOffset);
          appState.closeModal();
        }
      });
    });
  }

  private async renderRecipeForm(recipe?: Recipe): Promise<void> {
    const isEdit = !!recipe;
    const title = isEdit ? 'Edit Recipe' : 'Create New Recipe';
    const rTitle = recipe?.title || '';
    const rDesc = recipe?.description || '';
    const rCat = recipe?.category || 'Dinner';
    const rServings = recipe?.servings || 4;
    const rImg = recipe?.imageUrl || MEAL_IMAGES.chicken_and_rice;
    const ingredients = recipe?.ingredients || [
      { id: 'ing-1', name: '', quantity: 100, unit: 'g', category: 'Produce' },
    ];

    this.overlay.innerHTML = `
      <div class="glass-panel w-full max-w-2xl p-6 flex flex-col gap-4 bg-white/95 rounded-3xl shadow-xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-2 border-b border-[#25221F]/10">
          <div>
            <h3 class="text-xl font-serif font-bold text-[#25221F]">${title}</h3>
            <p class="text-xs text-[#77716D]">Specify recipe details, portions, and ingredient quantities</p>
          </div>
          <button id="modal-close-btn" class="glass-circle-btn">
            ${getIconSvg('x', 'w-4 h-4')}
          </button>
        </div>

        <form id="recipe-editor-form" class="flex flex-col gap-4 text-xs">
          <!-- Recipe Name & AI Auto-fill -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="font-semibold text-[#25221F] text-xs">Recipe Name *</label>
              <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8C5C26] bg-[#FBF5ED] px-2.5 py-0.5 rounded-full border border-[#F3E2CE]">
                <span>✨</span> Gemini AI Auto-Fill
              </span>
            </div>
            
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input id="input-recipe-title" type="text" required value="${rTitle}" 
                     placeholder="e.g. Spaghetti Carbonara, Shakshuka, Blueberry Pancakes, Beef Lasagna..." 
                     class="flex-1 px-3.5 py-2.5 rounded-xl glass-card border focus:outline-none focus:ring-1 focus:ring-[#D9A441] text-xs font-medium text-[#25221F]" />
              <button type="button" id="btn-ai-generate-recipe" 
                      class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D9A441] via-[#E5BA6A] to-[#E9D1B4] text-[#25221F] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer shrink-0">
                <span class="ai-btn-icon">✨</span>
                <span class="ai-btn-label">Auto-Fill Ingredients</span>
              </button>
            </div>
            <p class="text-[11px] text-[#77716D] mt-1.5 flex items-center gap-1.5">
              <span class="text-[#D9A441]">💡</span> Type any recipe name and tap <strong>Auto-Fill Ingredients</strong> (or press Enter) — AI will fill in all ingredients, portions & description!
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="block font-semibold text-[#25221F] mb-1">Meal Category</label>
              <select id="select-recipe-category" class="w-full px-3 py-2 rounded-xl glass-card border focus:outline-none">
                <option value="Dinner" ${rCat === 'Dinner' ? 'selected' : ''}>Dinner</option>
                <option value="Breakfast" ${rCat === 'Breakfast' ? 'selected' : ''}>Breakfast</option>
                <option value="Lunch" ${rCat === 'Lunch' ? 'selected' : ''}>Lunch</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-[#25221F] mb-1">Serving Size (People)</label>
              <input id="input-recipe-servings" type="number" min="1" max="20" value="${rServings}" 
                     class="w-full px-3 py-2 rounded-xl glass-card border focus:outline-none" />
            </div>

            <div>
              <label class="block font-semibold text-[#25221F] mb-1">Photo Selection</label>
              <select id="select-recipe-image" class="w-full px-3 py-2 rounded-xl glass-card border focus:outline-none">
                ${Object.entries(MEAL_IMAGES)
                  .map(
                    ([k, url]) => `
                  <option value="${url}" ${url === rImg ? 'selected' : ''}>${k.replace(/_/g, ' ').toUpperCase()}</option>
                `
                  )
                  .join('')}
              </select>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-[#25221F] mb-1">Description</label>
            <textarea id="input-recipe-desc" rows="2" placeholder="Brief summary of the dish..." 
                      class="w-full px-3 py-2 rounded-xl glass-card border focus:outline-none">${rDesc}</textarea>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <label class="font-semibold text-[#25221F]">Ingredients List</label>
                <span id="ai-ingredients-badge" class="hidden text-[10px] font-semibold text-[#3E703E] bg-[#EAF5EA] px-2 py-0.5 rounded-full border border-[#D5EAD5]">
                  AI Generated
                </span>
              </div>
              <button type="button" id="btn-add-ing-row" 
                      class="px-2.5 py-1 rounded-lg bg-white/70 hover:bg-white border text-[11px] font-medium text-[#8C5C26] cursor-pointer flex items-center gap-1">
                ${getIconSvg('plus', 'w-3 h-3')} Add Ingredient
              </button>
            </div>

            <div id="ingredients-rows-container" class="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1.5 overscroll-contain">
              ${ingredients
                .map(
                  (ing, idx) => `
                <div class="ing-row flex items-center gap-2 p-1 rounded-xl bg-white/40 border border-white/60 hover:bg-white/80 transition" data-idx="${idx}">
                  <input type="text" placeholder="Ingredient name (e.g. Carrots)" value="${ing.name}" 
                         class="ing-name flex-1 px-3 py-1.5 rounded-xl glass-card border focus:outline-none font-medium text-[#25221F]" required />
                  <input type="number" step="any" placeholder="Qty" value="${ing.quantity}" 
                         class="ing-qty w-20 px-3 py-1.5 rounded-xl glass-card border focus:outline-none font-semibold text-[#8C5C26]" required />
                  <input type="text" placeholder="Unit (g, ml, medium)" value="${ing.unit}" 
                         class="ing-unit w-24 px-3 py-1.5 rounded-xl glass-card border focus:outline-none text-[#77716D]" required />
                  <button type="button" class="btn-remove-ing p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer" title="Remove ingredient">
                    ${getIconSvg('x', 'w-4 h-4')}
                  </button>
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-[#25221F]/10">
            <button type="button" id="btn-cancel-recipe" class="px-4 py-2 rounded-xl glass-card font-medium text-[#77716D] cursor-pointer">
              Cancel
            </button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-[#25221F] text-white font-medium hover:bg-[#3D3833] cursor-pointer shadow-sm">
              Save Recipe
            </button>
          </div>
        </form>
      </div>
    `;

    const container = this.overlay.querySelector('#ingredients-rows-container')!;
    const addRowBtn = this.overlay.querySelector('#btn-add-ing-row');
    const aiBtn = this.overlay.querySelector<HTMLButtonElement>('#btn-ai-generate-recipe');
    const titleInput = this.overlay.querySelector<HTMLInputElement>('#input-recipe-title');
    const servingsInput = this.overlay.querySelector<HTMLInputElement>('#input-recipe-servings');
    const catSelect = this.overlay.querySelector<HTMLSelectElement>('#select-recipe-category');
    const descInput = this.overlay.querySelector<HTMLTextAreaElement>('#input-recipe-desc');
    const imgSelect = this.overlay.querySelector<HTMLSelectElement>('#select-recipe-image');
    const aiBadge = this.overlay.querySelector<HTMLElement>('#ai-ingredients-badge');

    const handleAiAutoFill = async () => {
      const recipeTitle = titleInput?.value.trim();
      if (!recipeTitle) {
        appState.showToast('Please type a recipe name first (e.g. "Spaghetti Carbonara")', 'warning');
        titleInput?.focus();
        return;
      }

      if (aiBtn) {
        aiBtn.disabled = true;
        aiBtn.innerHTML = `
          <span class="inline-block animate-spin text-xs">✨</span>
          <span>Crafting Ingredients...</span>
        `;
      }

      try {
        const servings = parseInt(servingsInput?.value || '4', 10);
        const category = catSelect?.value || 'Dinner';
        const data = await aiRecipeService.generateIngredients(recipeTitle, servings, category);

        if (descInput && (!descInput.value.trim() || descInput.value.length < 15)) {
          descInput.value = data.description;
        }

        if (catSelect && data.category) {
          catSelect.value = data.category;
        }

        if (imgSelect && data.suggestedImageType) {
          const matchKey = data.suggestedImageType.toLowerCase().replace(/[^a-z0-9_]/g, '_');
          const matchingUrl = (MEAL_IMAGES as any)[matchKey];
          if (matchingUrl) {
            imgSelect.value = matchingUrl;
          }
        }

        // Populate all AI-generated ingredient rows
        container.innerHTML = '';
        data.ingredients.forEach((ing, idx) => {
          const row = document.createElement('div');
          row.className =
            'ing-row flex items-center gap-2 p-1.5 rounded-xl bg-[#FAF5EE]/80 border border-[#E9D1B4] hover:bg-[#FAF5EE] animate-fade-in transition';
          row.setAttribute('data-idx', String(idx));
          row.innerHTML = `
            <input type="text" placeholder="Ingredient name" 
                   class="ing-name flex-1 px-3 py-1.5 rounded-xl glass-card border focus:outline-none font-medium text-[#25221F]" required />
            <input type="number" step="any" placeholder="Qty" 
                   class="ing-qty w-20 px-3 py-1.5 rounded-xl glass-card border focus:outline-none font-semibold text-[#8C5C26]" required />
            <input type="text" placeholder="Unit" 
                   class="ing-unit w-24 px-3 py-1.5 rounded-xl glass-card border focus:outline-none text-[#77716D]" required />
            <button type="button" class="btn-remove-ing p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer" title="Remove ingredient">
              ${getIconSvg('x', 'w-4 h-4')}
            </button>
          `;

          // Set input properties directly
          const nInput = row.querySelector<HTMLInputElement>('.ing-name')!;
          nInput.value = ing.name;
          const qInput = row.querySelector<HTMLInputElement>('.ing-qty')!;
          qInput.value = String(ing.quantity);
          const uInput = row.querySelector<HTMLInputElement>('.ing-unit')!;
          uInput.value = ing.unit;

          row.querySelector('.btn-remove-ing')?.addEventListener('click', () => row.remove());
          container.appendChild(row);
        });

        if (aiBadge) {
          aiBadge.textContent = `✨ ${data.ingredients.length} AI Ingredients Auto-Filled`;
          aiBadge.classList.remove('hidden');
        }

        // Scroll to top of ingredient container to review
        container.scrollTop = 0;

        appState.showToast(`✨ Added ${data.ingredients.length} ingredients to "${recipeTitle}"!`, 'success');
      } catch (err: any) {
        appState.showToast(err?.message || 'Could not auto-generate ingredients', 'warning');
      } finally {
        if (aiBtn) {
          aiBtn.disabled = false;
          aiBtn.innerHTML = `
            <span class="ai-btn-icon">✨</span>
            <span class="ai-btn-label">Re-generate with AI</span>
          `;
        }
      }
    };

    aiBtn?.addEventListener('click', handleAiAutoFill);

    titleInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAiAutoFill();
      }
    });

    addRowBtn?.addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'ing-row flex items-center gap-2';
      row.innerHTML = `
        <input type="text" placeholder="Ingredient name" class="ing-name flex-1 px-3 py-1.5 rounded-xl glass-card border focus:outline-none" required />
        <input type="number" step="any" placeholder="Qty" value="100" class="ing-qty w-20 px-3 py-1.5 rounded-xl glass-card border focus:outline-none" required />
        <input type="text" placeholder="Unit" value="g" class="ing-unit w-24 px-3 py-1.5 rounded-xl glass-card border focus:outline-none" required />
        <button type="button" class="btn-remove-ing p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer">
          ${getIconSvg('x', 'w-4 h-4')}
        </button>
      `;
      row.querySelector('.btn-remove-ing')?.addEventListener('click', () => row.remove());
      container.appendChild(row);
    });

    this.overlay.querySelectorAll('.btn-remove-ing').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        (e.target as HTMLElement).closest('.ing-row')?.remove();
      });
    });

    const form = this.overlay.querySelector<HTMLFormElement>('#recipe-editor-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const titleInput = this.overlay.querySelector<HTMLInputElement>('#input-recipe-title');
      const catSelect = this.overlay.querySelector<HTMLSelectElement>('#select-recipe-category');
      const servingsInput = this.overlay.querySelector<HTMLInputElement>('#input-recipe-servings');
      const imgSelect = this.overlay.querySelector<HTMLSelectElement>('#select-recipe-image');
      const descInput = this.overlay.querySelector<HTMLTextAreaElement>('#input-recipe-desc');

      const ingRows = this.overlay.querySelectorAll('.ing-row');
      const parsedIngredients: Ingredient[] = [];
      ingRows.forEach((row, i) => {
        const name = (row.querySelector('.ing-name') as HTMLInputElement).value;
        const qty = parseFloat((row.querySelector('.ing-qty') as HTMLInputElement).value) || 1;
        const unit = (row.querySelector('.ing-unit') as HTMLInputElement).value || 'portion';
        if (name) {
          parsedIngredients.push({
            id: `ing-${Date.now()}-${i}`,
            name: name.trim(),
            quantity: qty,
            unit: unit.trim(),
            category: 'Pantry',
          });
        }
      });

      if (parsedIngredients.length === 0) {
        appState.showToast('Please add at least one ingredient to the recipe', 'warning');
        return;
      }

      const updatedRecipe: Recipe = {
        id: recipe?.id || `rec-${Date.now()}`,
        title: titleInput?.value.trim() || 'Untitled Recipe',
        category: (catSelect?.value as any) || 'Dinner',
        servings: parseInt(servingsInput?.value || '4', 10),
        imageUrl: imgSelect?.value || MEAL_IMAGES.chicken_and_rice,
        description: descInput?.value.trim() || '',
        ingredients: parsedIngredients,
      };

      await recipeService.saveRecipe(updatedRecipe);
      appState.openRecipeDetail(updatedRecipe);
      appState.closeModal();
      appState.showToast(`Recipe "${updatedRecipe.title}" saved successfully!`, 'success');
    });
  }

  private renderWeekSelector(): void {
    const curOffset = appState.getState().weekOffset;

    this.overlay.innerHTML = `
      <div class="glass-panel w-full max-w-sm p-6 flex flex-col gap-4 bg-white/95 rounded-3xl shadow-xl animate-fade-in">
        <div class="flex items-center justify-between pb-2 border-b border-[#25221F]/10">
          <h3 class="text-lg font-serif font-bold text-[#25221F]">Select Timetable Week</h3>
          <button id="modal-close-btn" class="glass-circle-btn">
            ${getIconSvg('x', 'w-4 h-4')}
          </button>
        </div>

        <div class="flex flex-col gap-2">
          ${[-2, -1, 0, 1, 2, 3]
            .map((offset) => {
              const { dayDates } = getWeekDates(offset);
              const label = offset === 0 ? 'This Week (Current)' : offset === 1 ? 'Next Week' : offset === -1 ? 'Last Week' : `Week ${offset > 0 ? `+${offset}` : offset}`;
              const dateRange = `${dayDates[0].dateStr} – ${dayDates[6].dateStr}`;
              const isSelected = curOffset === offset;

              return `
              <button class="week-opt-btn flex items-center justify-between p-3 rounded-2xl glass-card transition cursor-pointer ${
                isSelected ? 'border-[#D9A441] bg-[#FBF5ED]' : 'hover:bg-white'
              }" data-offset="${offset}">
                <div class="flex flex-col text-left">
                  <span class="text-xs font-semibold ${isSelected ? 'text-[#8C5C26]' : 'text-[#25221F]'}">${label}</span>
                  <span class="text-[11px] text-[#77716D]">${dateRange}</span>
                </div>
                ${isSelected ? `<span class="text-[#8C5C26]">${getIconSvg('check', 'w-4 h-4')}</span>` : ''}
              </button>
            `;
            })
            .join('')}
        </div>
      </div>
    `;

    const weekButtons = this.overlay.querySelectorAll<HTMLButtonElement>('.week-opt-btn');
    weekButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const offset = parseInt(btn.getAttribute('data-offset') || '0', 10);
        appState.setWeekOffset(offset);
        appState.closeModal();
      });
    });
  }

  private renderIosGuide(): void {
    this.overlay.innerHTML = `
      <div class="glass-panel w-full max-w-sm p-6 flex flex-col gap-4 bg-white/95 rounded-3xl shadow-xl animate-fade-in text-center">
        <div class="w-12 h-12 rounded-2xl bg-[#FBF5ED] border border-[#F3E2CE] flex items-center justify-center text-[#D9A441] mx-auto">
          ${getIconSvg('download', 'w-6 h-6')}
        </div>
        <h3 class="text-lg font-serif font-bold text-[#25221F]">Install on iPhone / iPad</h3>
        <p class="text-xs text-[#77716D] leading-relaxed">
          1. Tap the <strong>Share</strong> button in Safari's bottom toolbar.<br />
          2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
          3. Tap <strong>Add</strong> in the top-right corner.
        </p>
        <button id="modal-close-btn" class="w-full py-2.5 rounded-xl bg-[#25221F] text-white text-xs font-medium cursor-pointer">
          Done
        </button>
      </div>
    `;
  }

  private bindCommonEvents(): void {
    const closeBtn = this.overlay.querySelector('#modal-close-btn');
    closeBtn?.addEventListener('click', () => {
      appState.closeModal();
    });

    const cancelBtn = this.overlay.querySelector('#btn-cancel-recipe');
    cancelBtn?.addEventListener('click', () => {
      appState.closeModal();
    });

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        appState.closeModal();
      }
    });
  }
}
