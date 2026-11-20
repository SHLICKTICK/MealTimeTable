/**
 * Automated verification suite for the modular modal architecture.
 * Run with: npx tsx tests/modals.test.ts
 */

import type { ModalType } from '../src/app/state';
import type { ModalDependencies } from '../src/components/modals';
import type { Recipe } from '../src/models/Recipe';
import type { IngredientInventory } from '../src/models/IngredientInventory';
import type { InventoryTransaction } from '../src/models/InventoryTransaction';
import type { WeeklyPlan } from '../src/models/WeeklyPlan';
import type { MasterIngredient } from '../src/models/MasterIngredient';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message} (expected ${String(expected)}, got ${String(actual)})`);
  }
}

// --- Lightweight DOM + EventTarget Shim with real AbortSignal tracking ---

class MockClassList {
  private classes = new Set<string>();

  add(...tokens: string[]): void {
    tokens.forEach((t) => this.classes.add(t));
  }
  remove(...tokens: string[]): void {
    tokens.forEach((t) => this.classes.delete(t));
  }
  contains(token: string): boolean {
    return this.classes.has(token);
  }
  setFromString(val: string): void {
    this.classes = new Set(val.split(/\s+/).filter(Boolean));
  }
  toString(): string {
    return Array.from(this.classes).join(' ');
  }
}

interface ListenerRecord {
  type: string;
  fn: (event: MockEvent) => void;
}

class MockEvent {
  type: string;
  target: unknown = null;
  key?: string;
  defaultPrevented = false;

  constructor(type: string, init?: { key?: string; target?: unknown }) {
    this.type = type;
    this.key = init?.key;
    this.target = init?.target ?? null;
  }

  preventDefault(): void {
    this.defaultPrevented = true;
  }
}

class MockElement {
  tagName: string;
  id = '';
  classList = new MockClassList();
  attributes = new Map<string, string>();
  children: MockElement[] = [];
  parentNode: MockElement | null = null;
  value = '';
  disabled = false;
  textContent = '';
  scrollTop = 0;
  selectionStart: number | null = null;
  focused = false;
  private _innerHTML = '';
  private listeners: ListenerRecord[] = [];
  options: MockElement[] = [];

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
  }

  get className(): string {
    return this.classList.toString();
  }

  set className(val: string) {
    this.classList.setFromString(val);
  }

  get innerHTML(): string {
    return this._innerHTML;
  }

  set innerHTML(html: string) {
    this._innerHTML = html;
    this.children = [];
    this.parseHTMLIntoChildren(html);
  }

  private parseHTMLIntoChildren(html: string): void {
    const stack: MockElement[] = [this];
    const tokenRegex = /<!--[\s\S]*?-->|<\/([a-zA-Z0-9-]+)\s*>|<([a-zA-Z0-9-]+)([^>]*?)(\/?)>|([^<]+)/g;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(html)) !== null) {
      if (match[1]) {
        if (stack.length > 1) stack.pop();
      } else if (match[2]) {
        const tag = match[2].toLowerCase();
        const attrStr = match[3] || '';
        const selfClosing = match[4] === '/' || ['input', 'img', 'br', 'hr'].includes(tag);
        const el = new MockElement(tag);
        const attrRegex = /([a-zA-Z0-9:-]+)(?:="([^"]*)")?/g;
        let aMatch: RegExpExecArray | null;
        while ((aMatch = attrRegex.exec(attrStr)) !== null) {
          const k = aMatch[1];
          const v = aMatch[2] ?? '';
          el.setAttribute(k, v);
          if (k === 'id') el.id = v;
          if (k === 'class') el.className = v;
          if (k === 'value') el.value = v;
        }
        const parent = stack[stack.length - 1];
        parent.appendChild(el);
        if (tag === 'option' && parent.tagName === 'SELECT') {
          parent.options.push(el);
          if (el.attributes.has('selected') && !parent.value) {
            parent.value = el.value;
          }
        }
        if (!selfClosing) {
          stack.push(el);
        }
      } else if (match[5]) {
        const current = stack[stack.length - 1];
        const text = match[5].trim();
        if (text && current) {
          current.textContent = current.textContent ? `${current.textContent} ${text}` : text;
          if (current.tagName === 'TEXTAREA' && !current.value) {
            current.value = text;
          }
        }
      }
    }
  }

  appendChild(child: MockElement): MockElement {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  remove(): void {
    if (this.parentNode) {
      this.parentNode.children = this.parentNode.children.filter((c) => c !== this);
      this.parentNode = null;
    }
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
    if (name === 'id') this.id = value;
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  focus(): void {
    this.focused = true;
    mockDocument.activeElement = this;
  }

  setSelectionRange(start: number): void {
    this.selectionStart = start;
  }

  closest(selector: string): MockElement | null {
    const cls = selector.startsWith('.') ? selector.slice(1) : null;
    let cur: MockElement | null = this;
    while (cur) {
      if (cls && cur.classList.contains(cls)) return cur;
      cur = cur.parentNode;
    }
    return null;
  }

  private matchesSelector(el: MockElement, selector: string): boolean {
    if (selector.startsWith('#')) return el.id === selector.slice(1);
    if (selector.startsWith('.')) return el.classList.contains(selector.slice(1));
    const attrMatch = selector.match(/^\[([^=\]]+)="([^"]+)"\]$/);
    if (attrMatch) return el.getAttribute(attrMatch[1]) === attrMatch[2];
    return el.tagName === selector.toUpperCase();
  }

  querySelectorAll<T extends MockElement = MockElement>(selector: string): T[] {
    const results: T[] = [];
    const walk = (node: MockElement) => {
      for (const child of node.children) {
        if (this.matchesSelector(child, selector)) {
          results.push(child as T);
        }
        walk(child);
      }
    };
    walk(this);
    return results;
  }

  querySelector<T extends MockElement = MockElement>(selector: string): T | null {
    return this.querySelectorAll<T>(selector)[0] ?? null;
  }

  addEventListener(
    type: string,
    fn: (event: MockEvent) => void,
    options?: { signal?: AbortSignal }
  ): void {
    if (options?.signal?.aborted) return;
    const rec: ListenerRecord = { type, fn };
    this.listeners.push(rec);
    options?.signal?.addEventListener(
      'abort',
      () => {
        this.listeners = this.listeners.filter((l) => l !== rec);
      },
      { once: true }
    );
  }

  listenerCount(type?: string): number {
    return type ? this.listeners.filter((l) => l.type === type).length : this.listeners.length;
  }

  dispatchEvent(event: MockEvent): void {
    if (!event.target) event.target = this;
    for (const rec of [...this.listeners]) {
      if (rec.type === event.type) {
        rec.fn(event);
      }
    }
  }
}

const mockDocument = {
  activeElement: null as MockElement | null,
  listeners: [] as ListenerRecord[],
  createElement(tag: string): MockElement {
    return new MockElement(tag);
  },
  addEventListener(
    type: string,
    fn: (event: MockEvent) => void,
    options?: { signal?: AbortSignal }
  ): void {
    if (options?.signal?.aborted) return;
    const rec: ListenerRecord = { type, fn };
    this.listeners.push(rec);
    options?.signal?.addEventListener(
      'abort',
      () => {
        this.listeners = this.listeners.filter((l) => l !== rec);
      },
      { once: true }
    );
  },
  listenerCount(type?: string): number {
    return type ? this.listeners.filter((l) => l.type === type).length : this.listeners.length;
  },
  dispatchEvent(event: MockEvent): void {
    for (const rec of [...this.listeners]) {
      if (rec.type === event.type) {
        rec.fn(event);
      }
    }
  },
};

(globalThis as unknown as Record<string, unknown>).document = mockDocument;
(globalThis as unknown as Record<string, unknown>).confirm = () => true;

// --- Test Runner & Fixtures ---

async function runTests(): Promise<void> {
  const { ModalManager } = await import('../src/components/modals');

  const sampleRecipe: Recipe = {
    id: 'rec-beef-stew',
    title: 'Beef Stew',
    description: 'Slow braised beef.',
    category: 'Dinner',
    servings: 4,
    prepTimeMinutes: 20,
    cookTimeMinutes: 120,
    imageUrl: '/src/assets/images/beef_stew_dinner_1793639194600.jpg',
    ingredients: [
      { id: 'ing-1', name: 'Beef chunks', quantity: 800, unit: 'g', category: 'Meat & Poultry' },
      { id: 'ing-2', name: 'Potatoes', quantity: 400, unit: 'g', category: 'Produce' },
    ],
    instructions: ['Brown beef', 'Simmer'],
  };

  const sampleIng: IngredientInventory = {
    id: 'inv-beef',
    name: 'Beef chunks',
    quantity: 500,
    unit: 'g',
    minStockLevel: 200,
    location: 'Fridge',
    category: 'Meat & Poultry',
    createdAt: '2026-11-10T10:00:00.000Z',
    updatedAt: '2026-11-17T08:00:00.000Z',
    lastActivityAt: '2026-11-17T08:00:00.000Z',
    lastActivityType: 'Purchase',
    lastActivitySummary: 'Restocked +500 g',
    price: 145,
    priceUnit: 'kg',
  };

  const samplePlan: WeeklyPlan = {
    id: 'week-2026-11-16',
    startDate: '2026-11-16T00:00:00.000Z',
    endDate: '2026-11-22T23:59:59.000Z',
    label: 'Monday – Sunday',
    estimatedBudgetZAR: 150,
    days: Array.from({ length: 7 }, (_, i) => ({
      dayIndex: i,
      dayName: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i],
      dateStr: `Nov ${16 + i}`,
      fullDate: `2026-11-${16 + i}`,
      breakfast: null,
      dinner:
        i === 1
          ? {
              id: 'plan-tue-dinner',
              dayIndex: 1,
              mealType: 'dinner',
              recipeId: sampleRecipe.id,
              title: sampleRecipe.title,
              imageUrl: sampleRecipe.imageUrl,
              servings: 2,
              status: 'planned',
            }
          : null,
    })),
  };

  const sampleCatalogItem: MasterIngredient = {
    id: 'cat-beef',
    name: 'Beef chunks',
    aliases: ['stewing beef'],
    category: 'Meat & Poultry',
    foodGroup: 'proteins',
    defaultLocation: 'Fridge',
    defaultUnit: 'g',
    referencePriceZAR: 145,
    priceUnit: 'kg',
    updatedAt: '2026-03-20T08:00:00.000Z',
  };

  function createHarness() {
    const calls = {
      closeModal: 0,
      refreshBudget: 0,
      toasts: [] as Array<{ message: string; type: string }>,
      savedRecipes: [] as Recipe[],
      syncedPlans: [] as Recipe[],
      addedIngredients: [] as Array<Record<string, unknown>>,
      updatedIngredients: [] as Array<{ id: string; updates: Partial<IngredientInventory> }>,
      completedMeals: [] as Array<Record<string, unknown>>,
      mealStatuses: [] as Array<{ status: string; completionId?: string }>,
      updatedServings: [] as Array<{ dayIndex: number; servings: number }>,
      assignedMeals: [] as Array<{ recipeId: string; servings?: number }>,
      weekOffsets: [] as number[],
    };

    const currentState: {
      activeModal: { type: ModalType | null; data?: unknown; id?: string } | null;
      selectedDayIndex: number;
      selectedMealType: 'breakfast' | 'dinner';
      selectedSource: 'plan' | 'library';
      selectedRecipe: Recipe | null;
      defaultServings: number;
      weekOffset: number;
      currentPlan: WeeklyPlan;
    } = {
      activeModal: null,
      selectedDayIndex: 1,
      selectedMealType: 'dinner',
      selectedSource: 'plan',
      selectedRecipe: sampleRecipe,
      defaultServings: 4,
      weekOffset: 0,
      currentPlan: JSON.parse(JSON.stringify(samplePlan)),
    };

    const deps = {
      state: {
        getState: () => ({ ...currentState }),
        openModal: (type: ModalType, data?: unknown) => {
          currentState.activeModal = {
            type,
            data,
            id: `modal-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          };
        },
        closeModal: () => {
          calls.closeModal++;
          currentState.activeModal = null;
        },
        showToast: (message: string, type = 'success') => {
          calls.toasts.push({ message, type });
        },
        refreshBudget: async () => {
          calls.refreshBudget++;
        },
        setWeekOffset: async (offset: number) => {
          calls.weekOffsets.push(offset);
          currentState.weekOffset = offset;
        },
        selectMeal: async (dayIndex: number, mealType: 'breakfast' | 'dinner') => {
          currentState.selectedDayIndex = dayIndex;
          currentState.selectedMealType = mealType;
        },
        openRecipeDetail: (recipe: Recipe) => {
          currentState.selectedRecipe = recipe;
        },
      },
      recipes: {
        getAllRecipes: async () => [sampleRecipe],
        saveRecipe: async (r: Recipe) => {
          calls.savedRecipes.push(r);
        },
      },
      mealPlans: {
        syncRecipeAcrossPlans: async (r: Recipe) => {
          calls.syncedPlans.push(r);
        },
        updateMealStatus: async (
          _w: string,
          _d: number,
          _m: 'breakfast' | 'dinner',
          status: string,
          completionId?: string
        ) => {
          calls.mealStatuses.push({ status, completionId });
        },
        updateMealServings: async (
          _w: string,
          dayIndex: number,
          _m: 'breakfast' | 'dinner',
          servings: number
        ) => {
          calls.updatedServings.push({ dayIndex, servings });
          return currentState.currentPlan;
        },
        assignMeal: async (
          _w: string,
          _d: number,
          _m: 'breakfast' | 'dinner',
          recipeId: string,
          servings?: number
        ) => {
          calls.assignedMeals.push({ recipeId, servings });
          return currentState.currentPlan;
        },
      },
      inventory: {
        getIngredientById: async () => sampleIng,
        getAllTransactions: async (): Promise<InventoryTransaction[]> => [
          {
            id: 'tx-1',
            ingredientId: sampleIng.id,
            ingredientName: sampleIng.name,
            quantityChange: 500,
            unit: 'g',
            type: 'Purchase',
            timestamp: '2026-11-17T08:00:00.000Z',
            notes: 'Restocked',
          },
        ],
        checkMealRequirements: async () => ({
          recipeTitle: sampleRecipe.title,
          servings: 2,
          hasShortages: false,
          totalShortagesCount: 0,
          items: [
            {
              recipeIngredientName: 'Beef chunks',
              requiredQuantity: 400,
              unit: 'g',
              matchedInventoryItem: sampleIng,
              availableQuantityInMatchingUnit: 500,
              sufficient: true,
              shortfall: 0,
              proposedDeduction: 400,
              remainingStock: 100,
            },
          ],
        }),
        completeMeal: async (params: Record<string, unknown>) => {
          calls.completedMeals.push(params);
          return { id: 'comp-test-1' };
        },
        addStock: async () => {},
        addIngredient: async (data: Record<string, unknown>) => {
          calls.addedIngredients.push(data);
          return sampleIng;
        },
        updateIngredient: async (id: string, updates: Partial<IngredientInventory>) => {
          calls.updatedIngredients.push({ id, updates });
          return { ...sampleIng, ...updates };
        },
      },
      catalog: {
        getAllCatalogItems: async () => [sampleCatalogItem],
        findCatalogItem: () => sampleCatalogItem,
        addCatalogItem: async () => sampleCatalogItem,
        updateCatalogItem: async () => sampleCatalogItem,
        resetToDefaults: async () => {},
      },
      aiRecipes: {
        generateIngredients: async () => ({
          description: 'Generated',
          category: 'Dinner' as const,
          suggestedImageType: 'beef_stew',
          ingredients: [{ name: 'Beef', quantity: 500, unit: 'g' }],
        }),
      },
    } as unknown as ModalDependencies;

    const manager = new ModalManager(deps);
    return { manager, deps, currentState, calls };
  }

  // Test 1: Every modal type opens and closes via #modal-close-btn
  {
    const { manager, deps, calls } = createHarness();
    const overlay = manager.getElement() as unknown as MockElement;
    const cases: Array<{ type: ModalType; data?: unknown; expectedText: string }> = [
      {
        type: 'meal-completion',
        data: {
          plannedMeal: samplePlan.days[1].dinner!,
          recipe: sampleRecipe,
          servings: 2,
          dayIndex: 1,
          mealType: 'dinner',
        },
        expectedText: 'Mark as Cooked',
      },
      { type: 'assign-meal', data: { dayIndex: 1, mealType: 'dinner' }, expectedText: 'Edit Tuesday Dinner' },
      { type: 'week-selector', expectedText: 'Select Timetable Week' },
      { type: 'add-inventory', expectedText: 'Add Ingredient to Pantry' },
      { type: 'edit-inventory', data: { ingredient: sampleIng }, expectedText: 'Edit Ingredient' },
      { type: 'ingredient-detail', data: { ingredient: sampleIng }, expectedText: 'Stock Value' },
      { type: 'inventory-activity', data: { ingredient: sampleIng }, expectedText: 'Beef chunks History' },
      { type: 'create-recipe', expectedText: 'Create New Recipe' },
      { type: 'edit-recipe', data: { recipe: sampleRecipe }, expectedText: 'Edit Recipe' },
      { type: 'price-catalog', expectedText: 'Master Ingredient Price Catalog' },
      { type: 'ios-pwa-guide', expectedText: 'Install on iPhone / iPad' },
    ];

    for (const c of cases) {
      deps.state.openModal(c.type, c.data);
      await manager.render();
      assert(!overlay.classList.contains('hidden'), `${c.type} should unhide overlay`);
      assert(
        overlay.innerHTML.includes(c.expectedText),
        `${c.type} should render expected text "${c.expectedText}"`
      );

      const closeBtn = overlay.querySelector('#modal-close-btn');
      assert(closeBtn !== null, `${c.type} should render #modal-close-btn`);
      const prevCloseCount = calls.closeModal;
      closeBtn.dispatchEvent(new MockEvent('click'));
      assertEqual(calls.closeModal, prevCloseCount + 1, `${c.type} close button triggers closeModal`);
      await manager.render();
      assert(overlay.classList.contains('hidden'), `${c.type} should hide overlay after close`);
    }
    manager.destroy();
    console.log('✓ Test 1 passed: All 11 modal types open, render, and close cleanly');
  }

  // Test 2: Escape key and Backdrop click behavior + zero listener accumulation across 10 cycles
  {
    mockDocument.listeners = [];
    const { manager, deps, calls } = createHarness();
    const overlay = manager.getElement() as unknown as MockElement;

    for (let i = 0; i < 10; i++) {
      deps.state.openModal('price-catalog');
      await manager.render();
      deps.state.closeModal();
      await manager.render();
    }

    assertEqual(overlay.listenerCount('click'), 1, 'Overlay must keep exactly 1 click listener');
    assertEqual(mockDocument.listenerCount('keydown'), 1, 'Document must keep exactly 1 keydown listener');

    // Escape closes active modal
    deps.state.openModal('week-selector');
    await manager.render();
    const beforeEsc = calls.closeModal;
    mockDocument.dispatchEvent(new MockEvent('keydown', { key: 'Escape' }));
    assertEqual(calls.closeModal, beforeEsc + 1, 'Escape key closes open modal once');
    await manager.render();

    // Pressing Escape while closed does nothing
    mockDocument.dispatchEvent(new MockEvent('keydown', { key: 'Escape' }));
    assertEqual(calls.closeModal, beforeEsc + 1, 'Escape key ignored when no modal open');

    // Backdrop click only closes when target === overlay
    deps.state.openModal('ios-pwa-guide');
    await manager.render();
    const innerChild = overlay.children[0];
    overlay.dispatchEvent(new MockEvent('click', { target: innerChild }));
    assertEqual(calls.closeModal, beforeEsc + 1, 'Clicking inside modal panel must not close modal');
    overlay.dispatchEvent(new MockEvent('click', { target: overlay }));
    assertEqual(calls.closeModal, beforeEsc + 2, 'Clicking backdrop must close modal');

    manager.destroy();
    assertEqual(overlay.listenerCount('click'), 0, 'destroy() removes overlay click listener');
    assertEqual(mockDocument.listenerCount('keydown'), 0, 'destroy() removes document keydown listener');
    console.log('✓ Test 2 passed: Escape key, backdrop click, and zero listener accumulation verified');
  }

  // Test 3: Inventory form submission (add & edit)
  {
    const { manager, deps, calls } = createHarness();
    const overlay = manager.getElement() as unknown as MockElement;

    deps.state.openModal('add-inventory');
    await manager.render();
    overlay.querySelector('#input-inv-name')!.value = 'Tomatoes';
    overlay.querySelector('#input-inv-qty')!.value = '750';
    overlay.querySelector('#input-inv-price')!.value = '35';
    overlay.querySelector('#inventory-editor-form')!.dispatchEvent(new MockEvent('submit'));
    await new Promise((r) => setTimeout(r, 10));

    assertEqual(calls.addedIngredients.length, 1, 'Inventory add form should save new ingredient');
    assertEqual(calls.addedIngredients[0].name, 'Tomatoes', 'Ingredient name preserved on add');
    assertEqual(calls.addedIngredients[0].quantity, 750, 'Ingredient quantity preserved on add');
    assertEqual(calls.refreshBudget, 1, 'Budget refreshed after inventory add');
    assertEqual(calls.closeModal, 1, 'Modal closes after inventory add');

    deps.state.openModal('edit-inventory', { ingredient: sampleIng });
    await manager.render();
    overlay.querySelector('#input-inv-qty')!.value = '900';
    overlay.querySelector('#inventory-editor-form')!.dispatchEvent(new MockEvent('submit'));
    await new Promise((r) => setTimeout(r, 10));

    assertEqual(calls.updatedIngredients.length, 1, 'Inventory edit form should update ingredient');
    assertEqual(calls.updatedIngredients[0].updates.quantity, 900, 'Updated quantity submitted');
    manager.destroy();
    console.log('✓ Test 3 passed: Inventory add & edit form submissions verified');
  }

  // Test 4: Recipe editor validation & save + sync across plans
  {
    const { manager, deps, calls } = createHarness();
    const overlay = manager.getElement() as unknown as MockElement;

    // Validation when all ingredients removed
    deps.state.openModal('create-recipe');
    await manager.render();
    overlay.querySelectorAll('.ing-row').forEach((row) => row.remove());
    overlay.querySelector('#recipe-editor-form')!.dispatchEvent(new MockEvent('submit'));
    await new Promise((r) => setTimeout(r, 10));
    assertEqual(calls.savedRecipes.length, 0, 'Recipe with 0 ingredients must fail validation');
    assert(
      calls.toasts.some((t) => t.type === 'warning'),
      'Validation failure triggers warning toast'
    );

    // Valid recipe edit preserves instructions and syncs across weekly plans
    deps.state.openModal('edit-recipe', { recipe: sampleRecipe });
    await manager.render();
    overlay.querySelector('#input-recipe-title')!.value = 'Slow Braised Beef Stew';
    overlay.querySelector('#recipe-editor-form')!.dispatchEvent(new MockEvent('submit'));
    await new Promise((r) => setTimeout(r, 10));

    assertEqual(calls.savedRecipes.length, 1, 'Edited recipe should be saved');
    assertEqual(calls.savedRecipes[0].title, 'Slow Braised Beef Stew', 'Recipe title updated');
    assertEqual(calls.syncedPlans.length, 1, 'Edited recipe synced across weekly plans');
    assert(
      Array.isArray(calls.savedRecipes[0].instructions) && calls.savedRecipes[0].instructions.length === 2,
      'Existing instructions preserved on edit'
    );
    manager.destroy();
    console.log('✓ Test 4 passed: Recipe validation, save, metadata preservation & plan sync verified');
  }

  // Test 5: Meal completion & Assign meal slot servings workflows
  {
    const { manager, deps, calls } = createHarness();
    const overlay = manager.getElement() as unknown as MockElement;

    deps.state.openModal('assign-meal', { dayIndex: 1, mealType: 'dinner' });
    await manager.render();
    assertEqual(
      overlay.querySelector('#assign-servings-label')?.textContent,
      '2 people',
      'Slot editor pre-fills existing slot servings (2)'
    );
    overlay.querySelector('#btn-assign-servings-inc')!.dispatchEvent(new MockEvent('click'));
    assertEqual(
      overlay.querySelector('#assign-servings-label')?.textContent,
      '3 people',
      'Incrementing servings updates label to 3 people'
    );
    overlay.querySelector('#btn-save-slot-servings')!.dispatchEvent(new MockEvent('click'));
    await new Promise((r) => setTimeout(r, 10));
    assertEqual(calls.updatedServings.length, 1, 'Save Meal updates planned slot servings');
    assertEqual(calls.updatedServings[0].servings, 3, 'Slot servings updated to 3');

    deps.state.openModal('meal-completion', {
      plannedMeal: samplePlan.days[1].dinner!,
      recipe: sampleRecipe,
      servings: 2,
      dayIndex: 1,
      mealType: 'dinner',
    });
    await manager.render();
    overlay.querySelector('#btn-confirm-cooking')!.dispatchEvent(new MockEvent('click'));
    await new Promise((r) => setTimeout(r, 10));
    assertEqual(calls.completedMeals.length, 1, 'Confirm cooking calls inventory.completeMeal');
    assertEqual(calls.mealStatuses[0]?.status, 'cooked', 'Meal status updated to cooked');
    manager.destroy();
    console.log('✓ Test 5 passed: AssignMeal slot update & MealCompletion deduction workflows verified');
  }

  console.log('\nAll modal architecture tests passed!');
}

runTests().catch((err) => {
  console.error(err);
  throw err;
});
