import { BaseModal } from '../BaseModal';
import { MEAL_IMAGES } from '../../../services/recipeService';
import { Recipe } from '../../../models/Recipe';
import { Ingredient } from '../../../models/Ingredient';
import { getIconSvg } from '../../../utils/iconHelper';

export interface RecipeEditorModalData {
  recipe?: Recipe;
}

export class RecipeEditorModal extends BaseModal<RecipeEditorModalData> {
  render(overlay: HTMLElement, data?: RecipeEditorModalData): void {
    const signal = this.beginRender(overlay);
    const recipe = data?.recipe;
    const isEdit = !!recipe;
    const title = isEdit ? 'Edit Recipe' : 'Create New Recipe';
    const rTitle = recipe?.title || '';
    const rDesc = recipe?.description || '';
    const rCat = recipe?.category || 'Dinner';
    const rServings = recipe?.servings || this.deps.state.getState().defaultServings || 4;
    const rImg = recipe?.imageUrl || MEAL_IMAGES.chicken_and_rice;
    const ingredients = recipe?.ingredients || [
      { id: 'ing-1', name: '', quantity: 100, unit: 'g', category: 'Produce' },
    ];

    overlay.innerHTML = `
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

    this.bindCloseButton(overlay, signal);

    const container = overlay.querySelector('#ingredients-rows-container')!;
    const addRowBtn = overlay.querySelector('#btn-add-ing-row');
    const aiBtn = overlay.querySelector<HTMLButtonElement>('#btn-ai-generate-recipe');
    const titleInput = overlay.querySelector<HTMLInputElement>('#input-recipe-title');
    const servingsInput = overlay.querySelector<HTMLInputElement>('#input-recipe-servings');
    const catSelect = overlay.querySelector<HTMLSelectElement>('#select-recipe-category');
    const descInput = overlay.querySelector<HTMLTextAreaElement>('#input-recipe-desc');
    const imgSelect = overlay.querySelector<HTMLSelectElement>('#select-recipe-image');
    const aiBadge = overlay.querySelector<HTMLElement>('#ai-ingredients-badge');

    const handleAiAutoFill = async () => {
      const recipeTitle = titleInput?.value.trim();
      if (!recipeTitle) {
        this.deps.state.showToast(
          'Please type a recipe name first (e.g. "Spaghetti Carbonara")',
          'warning'
        );
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
        const aiData = await this.deps.aiRecipes.generateIngredients(
          recipeTitle,
          servings,
          category
        );

        if (descInput && (!descInput.value.trim() || descInput.value.length < 15)) {
          descInput.value = aiData.description;
        }

        if (catSelect && aiData.category) {
          catSelect.value = aiData.category;
        }

        if (imgSelect && aiData.suggestedImageType) {
          const matchKey = aiData.suggestedImageType.toLowerCase().replace(/[^a-z0-9_]/g, '_');
          const mealImageMap: Record<string, string> = MEAL_IMAGES;
          const matchingUrl = mealImageMap[matchKey];
          if (matchingUrl) {
            imgSelect.value = matchingUrl;
          }
        }

        container.innerHTML = '';
        aiData.ingredients.forEach((ing, idx) => {
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

          const nInput = row.querySelector<HTMLInputElement>('.ing-name')!;
          nInput.value = ing.name;
          const qInput = row.querySelector<HTMLInputElement>('.ing-qty')!;
          qInput.value = String(ing.quantity);
          const uInput = row.querySelector<HTMLInputElement>('.ing-unit')!;
          uInput.value = ing.unit;

          row
            .querySelector('.btn-remove-ing')
            ?.addEventListener('click', () => row.remove(), { signal });
          container.appendChild(row);
        });

        if (aiBadge) {
          aiBadge.textContent = `✨ ${aiData.ingredients.length} AI Ingredients Auto-Filled`;
          aiBadge.classList.remove('hidden');
        }

        container.scrollTop = 0;

        this.deps.state.showToast(
          `✨ Added ${aiData.ingredients.length} ingredients to "${recipeTitle}"!`,
          'success'
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Could not auto-generate ingredients';
        this.deps.state.showToast(message, 'warning');
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

    aiBtn?.addEventListener('click', handleAiAutoFill, { signal });

    titleInput?.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAiAutoFill();
        }
      },
      { signal }
    );

    addRowBtn?.addEventListener(
      'click',
      () => {
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
        row
          .querySelector('.btn-remove-ing')
          ?.addEventListener('click', () => row.remove(), { signal });
        container.appendChild(row);
      },
      { signal }
    );

    overlay.querySelectorAll('.btn-remove-ing').forEach((btn) => {
      btn.addEventListener(
        'click',
        (e) => {
          (e.target as HTMLElement).closest('.ing-row')?.remove();
        },
        { signal }
      );
    });

    overlay.querySelector('#btn-cancel-recipe')?.addEventListener(
      'click',
      () => {
        this.deps.state.closeModal();
      },
      { signal }
    );

    const form = overlay.querySelector<HTMLFormElement>('#recipe-editor-form');
    form?.addEventListener(
      'submit',
      async (e) => {
        e.preventDefault();
        const formTitleInput = overlay.querySelector<HTMLInputElement>('#input-recipe-title');
        const formCatSelect = overlay.querySelector<HTMLSelectElement>('#select-recipe-category');
        const formServingsInput = overlay.querySelector<HTMLInputElement>('#input-recipe-servings');
        const formImgSelect = overlay.querySelector<HTMLSelectElement>('#select-recipe-image');
        const formDescInput = overlay.querySelector<HTMLTextAreaElement>('#input-recipe-desc');

        const ingRows = overlay.querySelectorAll('.ing-row');
        const parsedIngredients: Ingredient[] = [];
        ingRows.forEach((row, i) => {
          const name = (row.querySelector('.ing-name') as HTMLInputElement).value;
          const qty = parseFloat((row.querySelector('.ing-qty') as HTMLInputElement).value) || 1;
          const unit = (row.querySelector('.ing-unit') as HTMLInputElement).value || 'portion';
          if (name) {
            const catMatch = this.deps.catalog.findCatalogItem(name.trim());
            parsedIngredients.push({
              id: `ing-${Date.now()}-${i}`,
              name: name.trim(),
              quantity: qty,
              unit: unit.trim(),
              category: catMatch?.category || 'Pantry',
            });
          }
        });

        if (parsedIngredients.length === 0) {
          this.deps.state.showToast('Please add at least one ingredient to the recipe', 'warning');
          return;
        }

        const updatedRecipe: Recipe = {
          ...(recipe || {}),
          id: recipe?.id || `rec-${Date.now()}`,
          title: formTitleInput?.value.trim() || 'Untitled Recipe',
          category: (formCatSelect?.value as Recipe['category']) || 'Dinner',
          servings: Math.max(1, Math.min(20, parseInt(formServingsInput?.value || '4', 10) || 4)),
          imageUrl: formImgSelect?.value || MEAL_IMAGES.chicken_and_rice,
          description: formDescInput?.value.trim() || '',
          ingredients: parsedIngredients,
        };

        await this.deps.recipes.saveRecipe(updatedRecipe);
        await this.deps.mealPlans.syncRecipeAcrossPlans(updatedRecipe);
        await this.deps.state.refreshBudget();
        const latestState = this.deps.state.getState();
        if (
          latestState.selectedSource === 'plan' &&
          latestState.selectedRecipe?.id === updatedRecipe.id
        ) {
          await this.deps.state.selectMeal(latestState.selectedDayIndex, latestState.selectedMealType);
        } else {
          this.deps.state.openRecipeDetail(updatedRecipe);
        }
        this.deps.state.closeModal();
        this.deps.state.showToast(`Recipe "${updatedRecipe.title}" saved successfully!`, 'success');
      },
      { signal }
    );
  }
}
