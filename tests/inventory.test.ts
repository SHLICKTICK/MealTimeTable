/**
 * Comprehensive verification suite for MealWeek's Inventory, Matching, Unit Conversion,
 * Meal Completion/Undo, Shopping List Aggregation, and IndexedDB Storage Authority.
 * Run with: npx tsx tests/inventory.test.ts
 */

import type { IngredientInventory } from '../src/models/IngredientInventory';
import type { MealCompletion } from '../src/models/MealCompletion';
import type { InventoryTransaction } from '../src/models/InventoryTransaction';
import type { Recipe } from '../src/models/Recipe';
import type { WeeklyPlan } from '../src/models/WeeklyPlan';

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

function assertClose(actual: number, expected: number, tolerance: number, message: string): void {
  if (!Number.isFinite(actual) || Math.abs(actual - expected) > tolerance) {
    throw new Error(`Assertion failed: ${message} (expected ~${expected}, got ${actual})`);
  }
}

async function assertRejects(fn: () => Promise<unknown>, message: string): Promise<void> {
  let rejected = false;
  try {
    await fn();
  } catch {
    rejected = true;
  }
  assert(rejected, message);
}

// --- Minimal In-Memory IndexedDB + localStorage Harness ---

interface StoreSchema {
  keyPath: string;
}

class MockIndexedDBEnv {
  stores = new Map<string, { schema: StoreSchema; records: Map<string, unknown> }>();
  objectStoreNames = {
    contains: (name: string) => this.stores.has(name),
  };
  failNextCommit = false;
  onversionchange: (() => void) | null = null;

  close(): void {}

  createObjectStore(name: string, opts: { keyPath: string }): void {
    if (!this.stores.has(name)) {
      this.stores.set(name, { schema: { keyPath: opts.keyPath }, records: new Map() });
    }
  }

  transaction(storeNames: string | string[], _mode: 'readonly' | 'readwrite') {
    const names = Array.isArray(storeNames) ? storeNames : [storeNames];
    const txSnapshot = new Map<string, Map<string, unknown>>();
    for (const n of names) {
      const store = this.stores.get(n);
      if (store) {
        const clone = new Map<string, unknown>();
        for (const [k, v] of store.records.entries()) {
          clone.set(k, JSON.parse(JSON.stringify(v)));
        }
        txSnapshot.set(n, clone);
      }
    }

    const txObj: Record<string, unknown> = {
      error: null as Error | null,
      oncomplete: null as (() => void) | null,
      onerror: null as (() => void) | null,
      onabort: null as (() => void) | null,
      objectStore: (name: string) => {
        const store = this.stores.get(name);
        if (!store) throw new Error(`Object store ${name} does not exist`);

        const makeReq = <T>(exec: () => T) => {
          const req: Record<string, unknown> = {
            result: undefined as unknown,
            error: null as Error | null,
            onsuccess: null as (() => void) | null,
            onerror: null as (() => void) | null,
          };
          queueMicrotask(() => {
            try {
              req.result = exec();
              (req.onsuccess as (() => void) | null)?.();
            } catch (err) {
              req.error = err as Error;
              txObj.error = err as Error;
              (req.onerror as (() => void) | null)?.();
            }
          });
          return req;
        };

        return {
          get: (key: string) =>
            makeReq(() => {
              const v = store.records.get(key);
              return v !== undefined ? JSON.parse(JSON.stringify(v)) : undefined;
            }),
          getAll: () =>
            makeReq(() =>
              Array.from(store.records.values()).map((v) => JSON.parse(JSON.stringify(v)))
            ),
          put: (item: Record<string, unknown>) =>
            makeReq(() => {
              if (this.failNextCommit) {
                throw new Error('Simulated IndexedDB write error');
              }
              const keyVal = item[store.schema.keyPath] as string;
              if (!keyVal) throw new Error(`Missing keyPath ${store.schema.keyPath}`);
              store.records.set(keyVal, JSON.parse(JSON.stringify(item)));
              return keyVal;
            }),
          delete: (key: string) =>
            makeReq(() => {
              store.records.delete(key);
              return undefined;
            }),
        };
      },
    };

    // Complete or abort after microtasks flush
    setTimeout(() => {
      if (this.failNextCommit) {
        this.failNextCommit = false;
        // Rollback store mutations inside this aborted transaction
        for (const [n, prev] of txSnapshot.entries()) {
          const s = this.stores.get(n);
          if (s) s.records = prev;
        }
        txObj.error = txObj.error || new Error('Simulated IndexedDB transaction abort');
        (txObj.onabort as (() => void) | null)?.();
        return;
      }
      if (txObj.error) {
        for (const [n, prev] of txSnapshot.entries()) {
          const s = this.stores.get(n);
          if (s) s.records = prev;
        }
        (txObj.onerror as (() => void) | null)?.();
      } else {
        (txObj.oncomplete as (() => void) | null)?.();
      }
    }, 0);

    return txObj;
  }
}

class MockLocalStorage {
  private map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }
  getItem(k: string): string | null {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    this.map.set(k, v);
  }
  removeItem(k: string): void {
    this.map.delete(k);
  }
  clear(): void {
    this.map.clear();
  }
}

const mockIdbEnv = new MockIndexedDBEnv();
const mockLocalStorage = new MockLocalStorage();
let idbUpgraded = false;

(globalThis as unknown as Record<string, unknown>).localStorage = mockLocalStorage;
(globalThis as unknown as Record<string, unknown>).window = {
  indexedDB: {
    open: (_name: string, _version: number) => {
      const req: Record<string, unknown> = {
        result: mockIdbEnv,
        onupgradeneeded: null as ((e: { target: { result: MockIndexedDBEnv } }) => void) | null,
        onsuccess: null as (() => void) | null,
        onblocked: null as (() => void) | null,
        onerror: null as ((e: unknown) => void) | null,
      };
      setTimeout(() => {
        if (!idbUpgraded) {
          idbUpgraded = true;
          (req.onupgradeneeded as ((e: { target: { result: MockIndexedDBEnv } }) => void) | null)?.({
            target: { result: mockIdbEnv },
          });
        }
        (req.onsuccess as (() => void) | null)?.();
      }, 0);
      return req;
    },
  },
};

async function runTests(): Promise<void> {
  const {
    normalizeUnit,
    areUnitsCompatible,
    convertQuantity,
    convertQuantityDetailed,
  } = await import('../src/utils/unitConversion');
  const { matchIngredient, canonicalizeIngredientName } = await import(
    '../src/utils/ingredientMatcher'
  );
  const { storageService, STORES } = await import('../src/services/storageService');
  const { inventoryService } = await import('../src/services/inventoryService');
  const { recipeService } = await import('../src/services/recipeService');
  const { ingredientService } = await import('../src/services/ingredientService');

  // 1. Unit Conversion & Normalisation
  {
    assertEqual(normalizeUnit('litre'), 'L', 'litre normalizes to L');
    assertEqual(normalizeUnit('liters'), 'L', 'liters normalizes to L');
    assertEqual(normalizeUnit('l'), 'L', 'lowercase l normalizes to L');
    assertEqual(normalizeUnit('L'), 'L', 'uppercase L normalizes to L');
    assertEqual(normalizeUnit('millilitres'), 'ml', 'millilitres normalizes to ml');
    assertEqual(normalizeUnit('tablespoons'), 'tbsp', 'tablespoons normalizes to tbsp');
    assertEqual(normalizeUnit('teaspoon'), 'tsp', 'teaspoon normalizes to tsp');
    assertEqual(normalizeUnit('fluid ounces'), 'fl oz', 'fluid ounces normalizes to fl oz');
    assertEqual(normalizeUnit('each'), 'pieces', 'each normalizes to pieces');

    assertEqual(convertQuantity(1, 'L', 'ml'), 1000, '1 L = 1000 ml');
    assertEqual(convertQuantity(2.5, 'litres', 'ml'), 2500, '2.5 litres = 2500 ml');
    assertEqual(convertQuantity(500, 'ml', 'L'), 0.5, '500 ml = 0.5 L');
    assertEqual(convertQuantity(1, 'kg', 'g'), 1000, '1 kg = 1000 g');
    assertEqual(convertQuantity(1, 'g', 'mg'), 1000, '1 g = 1000 mg');
    assertClose(convertQuantity(1, 'lb', 'g')!, 453.592, 0.001, '1 lb = 453.592 g');
    assertClose(convertQuantity(1, 'oz', 'g')!, 28.3495, 0.001, '1 oz = 28.3495 g');
    assertClose(convertQuantity(1, 'tbsp', 'tsp')!, 3, 0.0001, '1 tbsp = 3 tsp');
    assertClose(convertQuantity(1, 'cup', 'ml')!, 236.588, 0.001, '1 US cup = 236.588 ml');
    assertClose(convertQuantity(1, 'fl oz', 'ml')!, 29.5735, 0.001, '1 US fl oz = 29.5735 ml');
    assertClose(convertQuantity(1, 'cup', 'tbsp')!, 16, 0.0001, '1 cup = 16 tbsp');

    assert(!areUnitsCompatible('g', 'ml'), 'Mass g and volume ml are incompatible');
    assert(!areUnitsCompatible('whole', 'g'), 'Count whole and mass g are incompatible');
    assert(!areUnitsCompatible('cloves', 'pieces'), 'Distinct count cloves and pieces are incompatible');

    const bad = convertQuantityDetailed(200, 'g', 'cup');
    assertEqual(bad.ok, false, 'Incompatible unit conversion fails cleanly');
    assertEqual(bad.value, null, 'Incompatible unit conversion returns null value');
    assert(Boolean(bad.reason), 'Incompatible conversion reports explicit failure reason');

    console.log('✓ Test 1 passed: Unit normalisation, conversion factors & incompatibility checks');
  }

  // 2. Ingredient Matching & Collision Guards
  {
    const pantry = [
      { id: '1', name: 'Milk', aliases: ['whole milk'] },
      { id: '2', name: 'Powdered milk' },
      { id: '3', name: 'Salt' },
      { id: '4', name: 'Garlic salt' },
      { id: '5', name: 'Carrots' },
      { id: '6', name: 'Butter' },
      { id: '7', name: 'Fresh tomatoes' },
      { id: '8', name: 'Free-range eggs', aliases: ['eggs'] },
    ];

    assertEqual(
      canonicalizeIngredientName('  Carrots '),
      'carrot',
      'Canonicalizes plural and whitespace cleanly'
    );
    assertEqual(matchIngredient('carrot', pantry).match?.id, '5', 'Matches singular to plural pantry item');
    assertEqual(matchIngredient('MILK', pantry).match?.id, '1', 'Matches fresh milk exactly without colliding with powdered milk');
    assertEqual(matchIngredient('powdered milk', pantry).match?.id, '2', 'Matches powdered milk distinctly');
    assertEqual(matchIngredient('Fresh milk', pantry).match?.id, '1', 'Benign Fresh modifier matches Milk, not Powdered milk');

    const condensed = matchIngredient('Condensed milk', pantry);
    assertEqual(condensed.match, null, 'Condensed milk must not auto-match Milk');

    assertEqual(matchIngredient('Garlic salt', pantry).match?.id, '4', 'Garlic salt matches Garlic salt, not Salt');
    assertEqual(matchIngredient('Margarine', pantry).match, null, 'Margarine must not match Butter');
    assertEqual(matchIngredient('Tomato paste', pantry).match, null, 'Tomato paste must not match Fresh tomatoes');
    assertEqual(matchIngredient('Eggplant', pantry).match, null, 'Eggplant must not match Free-range eggs');
    assertEqual(matchIngredient('eggs', pantry).match?.id, '8', 'Alias matches Free-range eggs');

    const multi = [
      { id: 'a', name: 'Cheddar Cheese (Aged)' },
      { id: 'b', name: 'Cheddar Cheese (Mild)' },
    ];
    const amb = matchIngredient('Cheddar cheese', multi);
    assertEqual(amb.confidence, 'ambiguous', 'Close competing matches flagged as ambiguous');
    assertEqual(amb.needsReview, true, 'Ambiguous match flags needsReview');

    console.log('✓ Test 2 passed: Ingredient matching, collision guards & ambiguity detection');
  }

  // 3. Seed & Test Inventory Requirements Check + Atomic Meal Completion / Rollback / Undo
  {
    await inventoryService.init();
    await recipeService.init();

    // Verify seeded pantry in IndexedDB
    assertEqual(await storageService.isIndexedDbActive(), true, 'Mock IndexedDB is active');

    // Add a custom recipe with compatible & incompatible units + a plan
    const customRecipe: Recipe = {
      id: 'rec-test-soup',
      title: 'Test Carrot Soup',
      description: 'Verification recipe',
      category: 'Dinner',
      servings: 4,
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      imageUrl: '',
      ingredients: [
        { id: 'i1', name: 'Milk', quantity: 0.5, unit: 'L', category: 'Dairy & Eggs' },
        { id: 'i2', name: 'Carrots', quantity: 100, unit: 'g', category: 'Produce' },
        { id: 'i3', name: 'Salt', quantity: 1, unit: 'cup', category: 'Spices & Condiments' }, // incompatible with Salt (g)!
      ],
      instructions: ['Cook'],
    };
    await recipeService.saveRecipe(customRecipe);

    const testWeekId = 'week-test-1';
    const testPlan: WeeklyPlan = {
      id: testWeekId,
      startDate: '2026-11-16T00:00:00.000Z',
      endDate: '2026-11-22T23:59:59.000Z',
      label: 'Test Week',
      estimatedBudgetZAR: 0,
      days: Array.from({ length: 7 }, (_, i) => ({
        dayIndex: i,
        dayName: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i],
        dateStr: `Nov ${16 + i}`,
        fullDate: `2026-11-${16 + i}`,
        breakfast: null,
        dinner:
          i === 0
            ? {
                id: 'meal-mon-dinner',
                dayIndex: 0,
                mealType: 'dinner',
                recipeId: customRecipe.id,
                title: customRecipe.title,
                imageUrl: '',
                servings: 4,
                status: 'planned',
              }
            : null,
      })),
    };
    await storageService.set(STORES.WEEKLY_PLANS, testPlan);

    // Check requirements: Milk converts L -> ml (2000 ml available for 0.5 L -> 2 L), Salt incompatible (cup vs g)
    const reqCheck = await inventoryService.checkMealRequirements(customRecipe, 4);
    const milkCheck = reqCheck.items.find((i) => i.recipeIngredientName === 'Milk')!;
    const saltCheck = reqCheck.items.find((i) => i.recipeIngredientName === 'Salt')!;

    assertEqual(milkCheck.conversionStatus, 'converted', 'Milk L vs ml marked converted');
    assertEqual(milkCheck.availableQuantityInMatchingUnit, 2, '2000 ml Milk = 2 L available');
    assertEqual(milkCheck.sufficient, true, 'Milk is sufficient');

    assertEqual(saltCheck.conversionStatus, 'incompatible_units', 'Salt cup vs g marked incompatible');
    assertEqual(saltCheck.availableQuantityInMatchingUnit, null, 'Incompatible availableQuantityInMatchingUnit is null (no raw fallback)');
    assertEqual(saltCheck.proposedDeduction, 0, 'Incompatible unit proposes 0 deduction');
    assertEqual(reqCheck.hasIncompatibleUnits, true, 'Meal check flags hasIncompatibleUnits');

    // Negative / over-stock / incompatible deduction must reject atomically
    await assertRejects(
      () =>
        inventoryService.completeMeal({
          mealId: 'meal-mon-dinner',
          weekId: testWeekId,
          dayIndex: 0,
          mealType: 'dinner',
          recipe: customRecipe,
          targetServings: 4,
          customDeductions: [
            { recipeIngredientName: 'Milk', deductionQuantity: -1, unit: 'L' },
          ],
        }),
      'Negative deduction must reject'
    );

    await assertRejects(
      () =>
        inventoryService.completeMeal({
          mealId: 'meal-mon-dinner',
          weekId: testWeekId,
          dayIndex: 0,
          mealType: 'dinner',
          recipe: customRecipe,
          targetServings: 4,
          customDeductions: [
            { recipeIngredientName: 'Carrots', deductionQuantity: 9999, unit: 'g' },
          ],
        }),
      'Over-stock deduction must reject'
    );

    await assertRejects(
      () =>
        inventoryService.completeMeal({
          mealId: 'meal-mon-dinner',
          weekId: testWeekId,
          dayIndex: 0,
          mealType: 'dinner',
          recipe: customRecipe,
          targetServings: 4,
          customDeductions: [
            { recipeIngredientName: 'Salt', deductionQuantity: 1, unit: 'cup' },
          ],
        }),
      'Incompatible-unit deduction (>0) must reject'
    );

    // Verify failure left Milk (2000 ml) & Carrots (300 g) completely intact
    assertEqual((await inventoryService.findIngredientByName('Milk'))!.quantity, 2000, 'Milk unchanged after rejected completions');
    assertEqual((await inventoryService.findIngredientByName('Carrots'))!.quantity, 300, 'Carrots unchanged after rejected completions');

    // Simulated IndexedDB transaction failure rolls back cleanly
    mockIdbEnv.failNextCommit = true;
    await assertRejects(
      () =>
        inventoryService.completeMeal({
          mealId: 'meal-mon-dinner',
          weekId: testWeekId,
          dayIndex: 0,
          mealType: 'dinner',
          recipe: customRecipe,
          targetServings: 4,
        }),
      'Failed IDB commit rejects'
    );
    assertEqual((await inventoryService.findIngredientByName('Milk'))!.quantity, 2000, 'Milk cache & IDB intact after failed batch');

    // Concurrent double completion with same operationId / slot deduplicates cleanly
    const opId = 'op-double-click-test';
    const [c1, c2] = await Promise.all([
      inventoryService.completeMeal({
        mealId: 'meal-mon-dinner',
        weekId: testWeekId,
        dayIndex: 0,
        mealType: 'dinner',
        recipe: customRecipe,
        targetServings: 4,
        operationId: opId,
      }),
      inventoryService.completeMeal({
        mealId: 'meal-mon-dinner',
        weekId: testWeekId,
        dayIndex: 0,
        mealType: 'dinner',
        recipe: customRecipe,
        targetServings: 4,
        operationId: opId,
      }),
    ]);

    assertEqual(c1.id, c2.id, 'Concurrent completion returns same completion record');
    assertEqual((await inventoryService.findIngredientByName('Milk'))!.quantity, 1500, 'Milk deducted once: 2000 - 500 = 1500 ml');
    assertEqual((await inventoryService.findIngredientByName('Carrots'))!.quantity, 200, 'Carrots deducted once: 300 - 100 = 200 g');

    // Subsequent distinct completion on same already-cooked meal fails cleanly
    await assertRejects(
      () =>
        inventoryService.completeMeal({
          mealId: 'meal-mon-dinner',
          weekId: testWeekId,
          dayIndex: 0,
          mealType: 'dinner',
          recipe: customRecipe,
          targetServings: 4,
          operationId: 'op-second-attempt',
        }),
      'Cannot complete an already cooked meal twice'
    );

    // Modify recipe AFTER cooking — undo must still restore exact historical deductions!
    const editedRecipe: Recipe = {
      ...customRecipe,
      ingredients: [
        { id: 'i1', name: 'Milk', quantity: 99, unit: 'L', category: 'Dairy & Eggs' },
      ],
    };
    await recipeService.saveRecipe(editedRecipe);

    // Concurrent double-undo must only restore once!
    const [u1, u2] = await Promise.all([
      inventoryService.undoMealCompletion(c1.id),
      inventoryService.undoMealCompletion(c1.id),
    ]);
    assert(u1 !== null, 'First undo succeeds');
    assertEqual(u1!.status, 'reversed', 'Completion marked reversed');
    assertEqual((await inventoryService.findIngredientByName('Milk'))!.quantity, 2000, 'Milk restored to exact 2000 ml despite edited recipe');
    assertEqual((await inventoryService.findIngredientByName('Carrots'))!.quantity, 300, 'Carrots restored to exact 300 g');
    if (u2 !== null) {
      // Because they awaited the same inFlightUndos promise, verify repeating after completion is null:
      assertEqual(await inventoryService.undoMealCompletion(c1.id), null, 'Repeated undo after reversal returns null');
    } else {
      assertEqual(await inventoryService.undoMealCompletion(c1.id), null, 'Repeated undo returns null');
    }

    const refreshedPlan = await storageService.get<WeeklyPlan>(STORES.WEEKLY_PLANS, testWeekId);
    assertEqual(refreshedPlan?.days[0].dinner?.status, 'planned', 'Plan slot reset to planned on undo');
    assertEqual(refreshedPlan?.days[0].dinner?.completionId, undefined, 'Plan slot completionId cleared on undo');

    console.log('✓ Test 3 passed: Compatibility check, validation, batch atomicity, concurrency & historical undo');
  }

  // 4. Shopping List Aggregation, Pantry Single-Allocation & Restock Guards
  {
    const recA: Recipe = {
      id: 'rec-agg-a',
      title: 'Carrot Dish A',
      description: '',
      category: 'Dinner',
      servings: 2,
      prepTimeMinutes: 5,
      cookTimeMinutes: 10,
      imageUrl: '',
      ingredients: [
        { id: 'a1', name: 'Carrots', quantity: 500, unit: 'g', category: 'Produce' },
        { id: 'a2', name: 'Rice', quantity: 500, unit: 'g', category: 'Pantry' }, // pantry has 2000g -> sufficient
        { id: 'a3', name: 'Salt', quantity: 2, unit: 'cup', category: 'Spices & Condiments' }, // incompatible with Salt (600g)
      ],
      instructions: [],
    };
    const recB: Recipe = {
      id: 'rec-agg-b',
      title: 'Carrot Dish B',
      description: '',
      category: 'Dinner',
      servings: 2,
      prepTimeMinutes: 5,
      cookTimeMinutes: 10,
      imageUrl: '',
      ingredients: [
        { id: 'b1', name: 'Fresh carrots', quantity: 1, unit: 'kg', category: 'Produce' },
      ],
      instructions: [],
    };
    await recipeService.saveRecipe(recA);
    await recipeService.saveRecipe(recB);

    const shopWeekId = 'week-shop-test';
    const shopPlan: WeeklyPlan = {
      id: shopWeekId,
      startDate: '2026-11-16T00:00:00.000Z',
      endDate: '2026-11-22T23:59:59.000Z',
      label: 'Shop Test Week',
      estimatedBudgetZAR: 0,
      days: Array.from({ length: 7 }, (_, i) => ({
        dayIndex: i,
        dayName: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i],
        dateStr: `Nov ${16 + i}`,
        fullDate: `2026-11-${16 + i}`,
        breakfast: null,
        dinner:
          i === 0
            ? {
                id: 'sm-0',
                dayIndex: 0,
                mealType: 'dinner',
                recipeId: recA.id,
                title: recA.title,
                imageUrl: '',
                servings: 2,
                status: 'planned',
              }
            : i === 2
            ? {
                id: 'sm-2',
                dayIndex: 2,
                mealType: 'dinner',
                recipeId: recB.id,
                title: recB.title,
                imageUrl: '',
                servings: 2,
                status: 'planned',
              }
            : null,
      })),
    };

    const list = await ingredientService.getShoppingListForWeek(shopPlan);
    const carrotRows = list.filter((i) => i.name.toLowerCase().includes('carrot'));
    assertEqual(carrotRows.length, 1, '500g Carrots + 1kg Fresh carrots aggregate into single shopping row');
    const carrotRow = carrotRows[0];
    assertEqual(carrotRow.quantityRequired, 1500, 'Total carrot requirement = 1500 g');
    assertEqual(carrotRow.quantityInStock, 300, 'Pantry stock of 300 g subtracted once');
    assertEqual(carrotRow.quantityToBuy, 1200, 'To buy = 1200 g (1.2 kg)');
    assertEqual(carrotRow.originalRequirements.length, 2, 'Original meal requirements preserved');

    const saltRow = list.find((i) => i.name === 'Salt')!;
    assertEqual(saltRow.needsReview, true, 'Incompatible shopping row flagged for review');
    assertEqual(saltRow.quantityInStock, 0, 'Incompatible pantry stock not falsely subtracted');
    assertEqual(saltRow.quantityToBuy, 2, 'Incompatible shopping row keeps original 2 cup requirement');

    const riceRow = list.find((i) => i.name === 'Rice')!;
    assertEqual(riceRow.isSufficientInStock, true, 'Rice is sufficient in stock');
    assertEqual(
      await ingredientService.addPurchasedToInventory(shopWeekId, riceRow),
      false,
      'Sufficient items must NOT restock'
    );

    const beforeCarrots = (await inventoryService.findIngredientByName('Carrots'))!.quantity;
    const beforeTxs = (await inventoryService.getAllTransactions()).length;
    const addedOk = await ingredientService.addPurchasedToInventory(shopWeekId, carrotRow);
    assertEqual(addedOk, true, 'Restocking needed shopping item succeeds');
    const afterCarrots = (await inventoryService.findIngredientByName('Carrots'))!.quantity;
    assertEqual(afterCarrots, beforeCarrots + 1200, 'Restocked exact 1200 g');
    assertEqual((await inventoryService.getAllTransactions()).length, beforeTxs + 1, 'Creates single Purchase transaction');

    // Duplicate restock rejected cleanly
    assertEqual(
      await ingredientService.addPurchasedToInventory(shopWeekId, carrotRow),
      false,
      'Second restock of already added shopping item is ignored'
    );

    console.log('✓ Test 4 passed: Shopping list aggregation, stock allocation, incompatible review & restock guards');
  }

  // 5. IndexedDB Authority Over Stale localStorage After Cache Reset (Simulated Reload)
  {
    const milk = (await inventoryService.findIngredientByName('Milk'))!;
    await inventoryService.updateIngredient(milk.id, { quantity: 1750 });

    // Inject conflicting stale entry into localStorage (simulating an old fallback key)
    mockLocalStorage.setItem(
      `${STORES.INVENTORY}:${milk.id}`,
      JSON.stringify({ ...milk, quantity: 999999 })
    );

    // Simulate page reload
    storageService.resetConnection();
    inventoryService.resetCache();
    await inventoryService.init();

    const reloadedMilk = (await inventoryService.findIngredientByName('Milk'))!;
    assertEqual(
      reloadedMilk.quantity,
      1750,
      'IndexedDB remains authoritative after reload despite stale localStorage entry'
    );

    // Verify all completions and transactions persisted cleanly in IDB
    const completions = await storageService.getAll<MealCompletion>(STORES.COMPLETIONS);
    const transactions = await storageService.getAll<InventoryTransaction>(STORES.TRANSACTIONS);
    assert(completions.length >= 1, 'Meal completions persisted in IndexedDB');
    assert(transactions.length >= INITIAL_TRANSACTIONS_MIN, 'Transactions persisted in IndexedDB');

    console.log('✓ Test 5 passed: Reload persistence & IndexedDB authority over stale localStorage verified');
  }

  console.log('\nAll inventory system verification tests passed!');
}

const INITIAL_TRANSACTIONS_MIN = 1;

runTests().catch((err) => {
  console.error(err);
  throw err;
});
