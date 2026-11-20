import { BaseModal } from '../BaseModal';
import { PlannedMeal } from '../../../models/PlannedMeal';
import { Recipe } from '../../../models/Recipe';
import { DAY_NAMES } from '../../../utils/dateUtils';
import { getIconSvg } from '../../../utils/iconHelper';
import { formatSmartQuantity } from '../../../utils/unitConversion';

export interface MealCompletionModalData {
  plannedMeal: PlannedMeal;
  recipe: Recipe;
  servings: number;
  dayIndex: number;
  mealType: 'breakfast' | 'dinner';
}

export class MealCompletionModal extends BaseModal<MealCompletionModalData> {
  async render(overlay: HTMLElement, data?: MealCompletionModalData): Promise<void> {
    if (!data) {
      this.deps.state.closeModal();
      return;
    }

    const { plannedMeal, recipe, servings, dayIndex, mealType } = data;
    const reqCheck = await this.deps.inventory.checkMealRequirements(recipe, servings);
    const signal = this.beginRender(overlay);
    const dayName = DAY_NAMES[dayIndex] || 'Monday';
    const mealLabel = mealType === 'breakfast' ? 'Breakfast' : 'Dinner';
    const operationId = `op-${plannedMeal.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    let isSubmitting = false;

    const getNormalizedStatus = (item: (typeof reqCheck.items)[number]) => {
      if (item.conversionStatus) return item.conversionStatus;
      return item.matchedInventoryItem ? 'exact' : 'missing_inventory';
    };

    const showWarningBanner =
      reqCheck.hasShortages || reqCheck.hasIncompatibleUnits || reqCheck.hasReviewItems;

    overlay.innerHTML = `
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

        <!-- Shortage & Compatibility Warning -->
        ${
          showWarningBanner
            ? `
          <div class="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col gap-2">
            <div class="flex items-center gap-2 font-semibold text-xs text-amber-800">
              ${getIconSvg('alert-triangle', 'w-4 h-4 text-amber-600')}
              <span>${reqCheck.hasIncompatibleUnits || reqCheck.hasReviewItems ? 'Inventory Warnings & Shortages Detected' : 'Insufficient Inventory Detected'}</span>
            </div>
            <div class="text-xs space-y-1.5">
              ${reqCheck.items
                .filter((i) => !i.sufficient || i.needsReview)
                .map((i) => {
                  const status = getNormalizedStatus(i);
                  if (status === 'incompatible_units') {
                    const nativeText =
                      i.availableQuantity !== null && i.availableUnit
                        ? formatSmartQuantity(i.availableQuantity, i.availableUnit)
                        : 'incompatible stock';
                    return `
                      <div class="flex items-center justify-between gap-2">
                        <span>
                          <strong>${i.recipeIngredientName}</strong>: Recipe uses <strong>${formatSmartQuantity(i.requiredQuantity, i.unit)}</strong>, but pantry tracks <strong>${nativeText}</strong>. Units cannot be converted automatically (deduction set to 0).
                        </span>
                      </div>
                    `;
                  }
                  if (status === 'ambiguous_match') {
                    return `
                      <div class="flex items-center justify-between gap-2">
                        <span>
                          <strong>${i.recipeIngredientName}</strong>: ${i.conversionMessage || 'Multiple pantry items matched; skipped automatic deduction.'}
                        </span>
                      </div>
                    `;
                  }
                  const availInMatching = i.availableQuantityInMatchingUnit ?? 0;
                  return `
                    <div class="flex items-center justify-between">
                      <span>${recipe.title} requires <strong>${formatSmartQuantity(i.requiredQuantity, i.unit)}</strong> of ${i.recipeIngredientName}, ${i.matchedInventoryItem ? `but only <strong>${formatSmartQuantity(availInMatching, i.unit)}</strong> is in stock` : 'which is not in pantry stock'}. Short by <strong>${formatSmartQuantity(i.shortfall, i.unit)}</strong>.</span>
                      <button class="btn-quick-restock px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-[11px] font-semibold text-amber-900 cursor-pointer transition ml-2 whitespace-nowrap"
                              data-name="${i.recipeIngredientName}" data-shortfall="${i.shortfall}" data-unit="${i.unit}">
                        + Quick Restock
                      </button>
                    </div>
                  `;
                })
                .join('')}
            </div>
            <p class="text-[11px] text-amber-700/90 pt-1 border-t border-amber-200/60">
              Adjust actual deductions below (must not exceed available compatible pantry stock), quick-restock, or proceed with 0 / available stock.
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
                    const status = getNormalizedStatus(item);
                    const isIncompatible = status === 'incompatible_units';
                    const isAmbiguous = status === 'ambiguous_match';
                    const isMissing = status === 'missing_inventory' || !item.matchedInventoryItem;
                    const hasCompatible =
                      !isIncompatible &&
                      !isAmbiguous &&
                      !isMissing &&
                      item.availableQuantityInMatchingUnit !== null;
                    const availInUnit = item.availableQuantityInMatchingUnit ?? 0;

                    const statusClass = item.sufficient ? 'text-[#3E703E]' : 'text-amber-700';
                    const inPantryDisplay = isIncompatible
                      ? `${
                          item.availableQuantity !== null && item.availableUnit
                            ? formatSmartQuantity(item.availableQuantity, item.availableUnit)
                            : 'Stock'
                        } <span class="block text-[10px] text-rose-700 font-medium">Incompatible unit</span>`
                      : isAmbiguous
                      ? `<span class="text-[11px] text-amber-700 font-medium">Ambiguous match</span>`
                      : isMissing
                      ? `<span class="text-[#77716D]">Not in pantry</span>`
                      : formatSmartQuantity(availInUnit, item.unit);

                    const remainingDisplay =
                      isIncompatible && item.availableQuantity !== null && item.availableUnit
                        ? formatSmartQuantity(item.availableQuantity, item.availableUnit)
                        : hasCompatible
                        ? formatSmartQuantity(item.remainingStock, item.unit)
                        : '—';

                    return `
                  <tr class="deduction-row hover:bg-white/40 transition" data-idx="${idx}">
                    <td class="py-2.5 px-3 font-semibold text-[#25221F]">
                      ${item.recipeIngredientName}
                    </td>
                    <td class="py-2.5 px-3 text-[#77716D] tabular-nums">
                      ${formatSmartQuantity(item.requiredQuantity, item.unit)}
                    </td>
                    <td class="py-2.5 px-3 tabular-nums ${statusClass}">
                      ${inPantryDisplay}
                    </td>
                    <td class="py-2.5 px-3">
                      <div class="flex items-center gap-1">
                        <input type="number" step="any" min="0"
                               value="${item.proposedDeduction}"
                               data-name="${item.recipeIngredientName}"
                               data-unit="${item.unit}"
                               data-status="${status}"
                               data-avail="${hasCompatible ? availInUnit : 0}"
                               data-native-avail="${item.availableQuantity ?? ''}"
                               data-native-unit="${item.availableUnit ?? ''}"
                               class="input-deduct-qty w-20 px-2 py-1 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#D9A441] text-xs font-semibold text-[#25221F]" />
                        <span class="text-[11px] text-[#77716D]">${item.unit}</span>
                      </div>
                    </td>
                    <td class="py-2.5 px-3 text-right tabular-nums font-medium text-[#25221F] remaining-stock-col">
                      ${remainingDisplay}
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
                  class="px-5 py-2.5 rounded-xl bg-[#25221F] text-white font-semibold hover:bg-[#3D3833] cursor-pointer shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            ${getIconSvg('check-circle', 'w-4 h-4 text-emerald-400')}
            Confirm & Deduct Ingredients
          </button>
        </div>
      </div>
    `;

    this.bindCloseButton(overlay, signal);

    const validateInput = (
      input: HTMLInputElement
    ): { valid: boolean; value: number; message?: string } => {
      const name = input.getAttribute('data-name') || 'Ingredient';
      const status = input.getAttribute('data-status') || 'exact';
      const avail = parseFloat(input.getAttribute('data-avail') || '0');
      const unit = input.getAttribute('data-unit') || '';
      const raw = input.value.trim();

      if (!raw) {
        return { valid: false, value: NaN, message: `Enter a deduction amount for ${name} (or 0).` };
      }
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return { valid: false, value: parsed, message: `Deduction for ${name} must be 0 or greater.` };
      }

      if (
        (status === 'incompatible_units' || status === 'ambiguous_match' || status === 'missing_inventory') &&
        parsed > 0
      ) {
        const reason =
          status === 'incompatible_units'
            ? `Cannot deduct ${name}: incompatible units with pantry.`
            : status === 'ambiguous_match'
            ? `Cannot deduct ${name}: ambiguous pantry match.`
            : `Cannot deduct ${name}: not found in pantry stock.`;
        return { valid: false, value: parsed, message: reason };
      }

      if (parsed > avail + 1e-6) {
        return {
          valid: false,
          value: parsed,
          message: `Cannot deduct ${formatSmartQuantity(parsed, unit)} of ${name}: only ${formatSmartQuantity(avail, unit)} in stock.`,
        };
      }

      return { valid: true, value: parsed };
    };

    const deductInputs = overlay.querySelectorAll<HTMLInputElement>('.input-deduct-qty');
    deductInputs.forEach((input) => {
      input.addEventListener(
        'input',
        () => {
          const row = input.closest('.deduction-row');
          const remCol = row?.querySelector('.remaining-stock-col');
          const avail = parseFloat(input.getAttribute('data-avail') || '0');
          const unit = input.getAttribute('data-unit') || '';
          const status = input.getAttribute('data-status') || 'exact';
          const nativeAvail = input.getAttribute('data-native-avail');
          const nativeUnit = input.getAttribute('data-native-unit');

          const check = validateInput(input);
          if (!check.valid) {
            input.classList.add('border-rose-500');
            if (remCol) {
              remCol.textContent = check.value > avail ? 'Exceeds stock' : 'Invalid';
            }
            return;
          }

          input.classList.remove('border-rose-500');
          if (remCol) {
            if (status === 'incompatible_units' && nativeAvail && nativeUnit) {
              remCol.textContent = formatSmartQuantity(parseFloat(nativeAvail), nativeUnit);
            } else if (status === 'missing_inventory' || status === 'ambiguous_match') {
              remCol.textContent = '—';
            } else {
              const remaining = Math.max(0, avail - check.value);
              remCol.textContent = formatSmartQuantity(remaining, unit);
            }
          }
        },
        { signal }
      );
    });

    const restockBtns = overlay.querySelectorAll<HTMLButtonElement>('.btn-quick-restock');
    restockBtns.forEach((btn) => {
      btn.addEventListener(
        'click',
        async () => {
          if (btn.disabled) return;
          const name = btn.getAttribute('data-name');
          const shortfall = parseFloat(btn.getAttribute('data-shortfall') || '0');
          const unit = btn.getAttribute('data-unit') || 'g';
          if (name && Number.isFinite(shortfall) && shortfall > 0) {
            btn.disabled = true;
            try {
              await this.deps.inventory.addStock(name, shortfall, unit, 'Fridge', 'Produce');
              this.deps.state.showToast(
                `Restocked ${formatSmartQuantity(shortfall, unit)} of ${name}!`,
                'success'
              );
              await this.render(overlay, data);
            } catch (err) {
              btn.disabled = false;
              this.deps.state.showToast(
                err instanceof Error ? err.message : `Unable to restock ${name}.`,
                'warning'
              );
            }
          }
        },
        { signal }
      );
    });

    const confirmBtn = overlay.querySelector<HTMLButtonElement>('#btn-confirm-cooking');
    confirmBtn?.addEventListener(
      'click',
      async () => {
        if (isSubmitting) return;

        const customDeductions: Array<{
          recipeIngredientName: string;
          deductionQuantity: number;
          unit: string;
        }> = [];

        for (const input of deductInputs) {
          const check = validateInput(input);
          if (!check.valid) {
            input.classList.add('border-rose-500');
            this.deps.state.showToast(check.message || 'Please fix invalid deduction quantities.', 'warning');
            return;
          }
          customDeductions.push({
            recipeIngredientName: input.getAttribute('data-name') || '',
            deductionQuantity: check.value,
            unit: input.getAttribute('data-unit') || '',
          });
        }

        const state = this.deps.state.getState();
        if (!state.currentPlan) return;

        isSubmitting = true;
        if (confirmBtn) confirmBtn.disabled = true;

        try {
          const completion = await this.deps.inventory.completeMeal({
            mealId: plannedMeal.id,
            weekId: state.currentPlan.id,
            dayIndex,
            mealType,
            recipe,
            targetServings: servings,
            operationId,
            customDeductions,
          });

          await this.deps.mealPlans.updateMealStatus(
            state.currentPlan.id,
            dayIndex,
            mealType,
            'cooked',
            completion.id
          );

          this.deps.state.showToast(
            `Marked ${recipe.title} as cooked! Deducted stock from pantry.`,
            'success'
          );
          await this.deps.state.setWeekOffset(state.weekOffset);
          this.deps.state.closeModal();
        } catch (err) {
          isSubmitting = false;
          if (confirmBtn) confirmBtn.disabled = false;
          this.deps.state.showToast(
            err instanceof Error ? err.message : 'Failed to complete meal.',
            'warning'
          );
        }
      },
      { signal }
    );

    const cancelBtn = overlay.querySelector('#btn-cancel-completion');
    cancelBtn?.addEventListener(
      'click',
      () => {
        this.deps.state.closeModal();
      },
      { signal }
    );
  }
}
