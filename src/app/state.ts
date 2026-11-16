import { Recipe } from '../models/Recipe';
import { WeeklyPlan } from '../models/WeeklyPlan';
import { recipeService } from '../services/recipeService';
import { mealPlanService } from '../services/mealPlanService';
import { inventoryService } from '../services/inventoryService';
import { ingredientCatalogService } from '../services/ingredientCatalogService';
import { storageService, STORES } from '../services/storageService';
import { formatLocalISODate, getCurrentDayIndex, getWeekDates } from '../utils/dateUtils';

export type AppPage = 'weekly' | 'recipes' | 'ingredients' | 'shopping' | 'settings';

export type ModalType =
  | 'assign-meal'
  | 'edit-recipe'
  | 'create-recipe'
  | 'week-selector'
  | 'ios-pwa-guide'
  | 'meal-completion'
  | 'add-inventory'
  | 'edit-inventory'
  | 'inventory-activity'
  | 'price-catalog';

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

export interface AppState {
  activePage: AppPage;
  weekOffset: number;
  lockedWeekId: string;
  todayDateStr: string;
  currentPlan: WeeklyPlan | null;
  selectedDayIndex: number;
  selectedMealType: 'breakfast' | 'dinner';
  selectedSource: 'plan' | 'library';
  selectedRecipe: Recipe | null;
  defaultServings: number;
  recipeDetailServings: number;
  isRecipePanelOpen: boolean;
  activeModal: {
    type: ModalType | null;
    data?: any;
    id?: string;
  } | null;
  toast: ToastNotification | null;
  canInstallPwa: boolean;
  isInstalledPwa: boolean;
  isOnline: boolean;
  currencySymbol: string;
}

type Listener = (state: AppState) => void;

class StateManager {
  private state: AppState = {
    activePage: 'weekly',
    weekOffset: 0,
    lockedWeekId: getWeekDates(0).weekId,
    todayDateStr: formatLocalISODate(),
    currentPlan: null,
    selectedDayIndex: getCurrentDayIndex(),
    selectedMealType: 'dinner',
    selectedSource: 'plan',
    selectedRecipe: null,
    defaultServings: 4,
    recipeDetailServings: 4,
    isRecipePanelOpen: true,
    activeModal: null,
    toast: null,
    canInstallPwa: false,
    isInstalledPwa: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    currencySymbol: 'R',
  };

  private listeners: Set<Listener> = new Set();
  private deferredPwaPrompt: any = null;
  private toastTimer: any = null;
  private rolloverTimer: any = null;
  private watchersInitialized: boolean = false;

  getState(): AppState {
    return { ...this.state };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const currentState = this.getState();
    this.listeners.forEach((fn) => fn(currentState));
  }

  private setupGlobalWatchers(): void {
    if (this.watchersInitialized) return;
    this.watchersInitialized = true;

    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      this.state.isInstalledPwa = isStandalone;

      window.addEventListener('online', () => {
        this.state.isOnline = true;
        this.notify();
      });
      window.addEventListener('offline', () => {
        this.state.isOnline = false;
        this.notify();
      });

      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPwaPrompt = e;
        this.state.canInstallPwa = true;
        this.notify();
      });

      window.addEventListener('appinstalled', () => {
        this.state.isInstalledPwa = true;
        this.state.canInstallPwa = false;
        this.deferredPwaPrompt = null;
        this.notify();
      });

      window.addEventListener('focus', () => {
        this.checkWeekRollover();
      });
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkWeekRollover();
        }
      });
    }

    this.scheduleRolloverCheck();
  }

  private scheduleRolloverCheck(): void {
    if (typeof window === 'undefined') return;
    if (this.rolloverTimer) clearTimeout(this.rolloverTimer);

    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2);
    const msUntilMidnight = Math.max(1000, nextMidnight.getTime() - now.getTime());
    const waitMs = Math.min(msUntilMidnight, 3_600_000);

    this.rolloverTimer = setTimeout(() => {
      this.checkWeekRollover();
    }, waitMs);
  }

  async init(referenceDate: Date = new Date()): Promise<void> {
    this.setupGlobalWatchers();

    // Initialize master catalog & pantry inventory before weekly budget calculation
    await ingredientCatalogService.init();
    await inventoryService.init();

    // Load persisted household default servings
    const savedDefaultServings = await storageService.get<{ key: string; value: number }>(
      STORES.SETTINGS,
      'defaultServings'
    );
    if (savedDefaultServings && typeof savedDefaultServings.value === 'number' && savedDefaultServings.value >= 1) {
      this.state.defaultServings = Math.max(1, Math.min(20, Math.round(savedDefaultServings.value)));
    }

    // Lock into the current Monday–Sunday week and detect rollover since last visit
    const { weekId, dayDates } = getWeekDates(0, referenceDate);
    const todayStr = formatLocalISODate(referenceDate);
    const todayIdx = getCurrentDayIndex(referenceDate);

    const savedWeekAnchor = await storageService.get<{ key: string; value: string }>(
      STORES.SETTINGS,
      'activeWeekAnchor'
    );
    const didRollOver = !!(savedWeekAnchor?.value && savedWeekAnchor.value !== weekId);
    if (!savedWeekAnchor || savedWeekAnchor.value !== weekId) {
      await storageService.set(STORES.SETTINGS, { key: 'activeWeekAnchor', value: weekId });
    }

    this.state.lockedWeekId = weekId;
    this.state.todayDateStr = todayStr;
    this.state.weekOffset = 0;

    // Load locked Monday–Sunday plan for this week
    const plan = await mealPlanService.getWeekPlan(0, referenceDate);
    this.state.currentPlan = plan;
    this.state.selectedSource = 'plan';

    // Focus today's meal slot (or first available meal in the week)
    const todayPlan = plan.days[todayIdx];
    const initialMeal = todayPlan?.dinner || todayPlan?.breakfast || plan.days[0]?.dinner || null;
    if (initialMeal) {
      this.state.selectedDayIndex = initialMeal.dayIndex;
      this.state.selectedMealType = initialMeal.mealType;
      const rec = await recipeService.getRecipeById(initialMeal.recipeId);
      this.state.selectedRecipe = rec;
      this.state.recipeDetailServings =
        initialMeal.servings || (rec ? rec.servings : this.state.defaultServings);
    } else {
      this.state.selectedDayIndex = todayIdx;
      this.state.selectedMealType = 'dinner';
      this.state.selectedRecipe = null;
      this.state.recipeDetailServings = this.state.defaultServings;
    }

    this.notify();

    if (didRollOver) {
      this.showToast(
        `New week locked in (${dayDates[0].dateStr} – ${dayDates[6].dateStr})`,
        'info'
      );
    }
  }

  async checkWeekRollover(referenceDate: Date = new Date()): Promise<boolean> {
    const { weekId, dayDates } = getWeekDates(0, referenceDate);
    const todayStr = formatLocalISODate(referenceDate);
    const todayIdx = getCurrentDayIndex(referenceDate);

    if (weekId !== this.state.lockedWeekId) {
      await storageService.set(STORES.SETTINGS, { key: 'activeWeekAnchor', value: weekId });
      this.state.lockedWeekId = weekId;
      this.state.todayDateStr = todayStr;
      this.state.weekOffset = 0;

      const plan = await mealPlanService.getWeekPlan(0, referenceDate);
      this.state.currentPlan = plan;
      this.state.selectedSource = 'plan';

      const todayPlan = plan.days[todayIdx];
      const meal = todayPlan?.dinner || todayPlan?.breakfast || null;
      if (meal) {
        this.state.selectedDayIndex = meal.dayIndex;
        this.state.selectedMealType = meal.mealType;
        const rec = await recipeService.getRecipeById(meal.recipeId);
        this.state.selectedRecipe = rec;
        this.state.recipeDetailServings =
          meal.servings || (rec ? rec.servings : this.state.defaultServings);
      } else {
        this.state.selectedDayIndex = todayIdx;
        this.state.selectedMealType = 'dinner';
        this.state.selectedRecipe = null;
        this.state.recipeDetailServings = this.state.defaultServings;
      }

      this.scheduleRolloverCheck();
      this.notify();
      this.showToast(
        `Monday rollover — now planning ${dayDates[0].dateStr} – ${dayDates[6].dateStr}`,
        'info'
      );
      return true;
    }

    if (todayStr !== this.state.todayDateStr) {
      this.state.todayDateStr = todayStr;
      this.notify();
    }

    this.scheduleRolloverCheck();
    return false;
  }

  async refreshBudget(): Promise<void> {
    this.state.currentPlan = await mealPlanService.refreshPlanBudget(this.state.weekOffset);
    if (this.state.selectedRecipe) {
      const fresh = await recipeService.getRecipeById(this.state.selectedRecipe.id);
      if (fresh) {
        this.state.selectedRecipe = fresh;
      }
    }
    this.notify();
  }

  setPage(page: AppPage): void {
    this.state.activePage = page;
    this.notify();
  }

  async setWeekOffset(offset: number): Promise<void> {
    this.state.weekOffset = offset;
    this.state.currentPlan = await mealPlanService.getWeekPlan(offset);

    const currentDay = this.state.currentPlan.days[this.state.selectedDayIndex];
    const meal = currentDay ? currentDay[this.state.selectedMealType] : null;
    if (meal) {
      this.state.selectedSource = 'plan';
      const rec = await recipeService.getRecipeById(meal.recipeId);
      this.state.selectedRecipe = rec;
      this.state.recipeDetailServings = meal.servings || (rec ? rec.servings : this.state.defaultServings);
    }

    this.notify();
  }

  async selectMeal(dayIndex: number, mealType: 'breakfast' | 'dinner'): Promise<void> {
    this.state.selectedDayIndex = dayIndex;
    this.state.selectedMealType = mealType;
    this.state.selectedSource = 'plan';
    this.state.isRecipePanelOpen = true;

    if (this.state.currentPlan) {
      const day = this.state.currentPlan.days[dayIndex];
      const meal = day ? day[mealType] : null;
      if (meal) {
        const rec = await recipeService.getRecipeById(meal.recipeId);
        this.state.selectedRecipe = rec;
        this.state.recipeDetailServings = meal.servings || (rec ? rec.servings : this.state.defaultServings);
      } else {
        this.state.selectedRecipe = null;
        this.state.recipeDetailServings = this.state.defaultServings;
      }
    }

    this.notify();
  }

  async setDefaultServings(servings: number, applyToCurrentWeek: boolean = false): Promise<void> {
    const clean = Math.max(1, Math.min(20, Math.round(servings)));
    this.state.defaultServings = clean;
    await storageService.set(STORES.SETTINGS, { key: 'defaultServings', value: clean });

    if (applyToCurrentWeek && this.state.currentPlan) {
      this.state.currentPlan = await mealPlanService.applyServingsToWeek(this.state.currentPlan.id, clean);
      if (this.state.selectedSource === 'plan') {
        this.state.recipeDetailServings = clean;
      }
    } else if (this.state.selectedSource === 'library' && this.state.selectedRecipe) {
      this.state.recipeDetailServings = clean;
    }

    this.notify();
  }

  async setRecipeDetailServings(servings: number): Promise<void> {
    const clean = Math.max(1, Math.min(20, Math.round(servings)));
    this.state.recipeDetailServings = clean;
    this.notify();

    if (
      this.state.selectedSource === 'plan' &&
      this.state.currentPlan?.days[this.state.selectedDayIndex]?.[this.state.selectedMealType]
    ) {
      this.state.currentPlan = await mealPlanService.updateMealServings(
        this.state.currentPlan.id,
        this.state.selectedDayIndex,
        this.state.selectedMealType,
        clean
      );
      this.notify();
    }
  }

  openRecipeDetail(recipe: Recipe): void {
    this.state.selectedSource = 'library';
    this.state.selectedRecipe = recipe;
    this.state.recipeDetailServings = recipe.servings || this.state.defaultServings;
    this.state.isRecipePanelOpen = true;
    this.notify();
  }

  closeRecipePanel(): void {
    this.state.isRecipePanelOpen = false;
    this.notify();
  }

  openModal(type: ModalType, data?: any): void {
    this.state.activeModal = {
      type,
      data,
      id: `modal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    this.notify();
  }

  closeModal(): void {
    this.state.activeModal = null;
    this.notify();
  }

  showToast(message: string, type: 'success' | 'info' | 'warning' = 'success'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.state.toast = { id: `toast-${Date.now()}`, message, type };
    this.notify();

    this.toastTimer = setTimeout(() => {
      this.state.toast = null;
      this.notify();
    }, 4000);
  }

  async installPwa(): Promise<boolean> {
    if (this.deferredPwaPrompt) {
      this.deferredPwaPrompt.prompt();
      const choice = await this.deferredPwaPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        this.state.isInstalledPwa = true;
        this.state.canInstallPwa = false;
        this.deferredPwaPrompt = null;
        this.notify();
        return true;
      }
    } else {
      const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
      if (isIOS) {
        this.openModal('ios-pwa-guide');
      }
    }
    return false;
  }
}

export const appState = new StateManager();
