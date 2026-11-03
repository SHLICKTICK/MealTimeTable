import { Recipe } from '../models/Recipe';
import { WeeklyPlan } from '../models/WeeklyPlan';
import { recipeService } from '../services/recipeService';
import { mealPlanService } from '../services/mealPlanService';

export type AppPage = 'weekly' | 'recipes' | 'shopping' | 'settings';

export interface AppState {
  activePage: AppPage;
  weekOffset: number;
  currentPlan: WeeklyPlan | null;
  selectedDayIndex: number;
  selectedMealType: 'breakfast' | 'dinner';
  selectedRecipe: Recipe | null;
  recipeDetailServings: number;
  isRecipePanelOpen: boolean;
  activeModal: {
    type: 'assign-meal' | 'edit-recipe' | 'create-recipe' | 'week-selector' | 'ios-pwa-guide' | null;
    data?: any;
  } | null;
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
    currentPlan: null,
    selectedDayIndex: 0, // Monday
    selectedMealType: 'dinner', // Chicken & Rice
    selectedRecipe: null,
    recipeDetailServings: 4,
    isRecipePanelOpen: true,
    activeModal: null,
    canInstallPwa: false,
    isInstalledPwa: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    currencySymbol: 'R',
  };

  private listeners: Set<Listener> = new Set();
  private deferredPwaPrompt: any = null;

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

  async init(): Promise<void> {
    // Check if running in standalone mode (already installed PWA)
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

      // Capture PWA install prompt
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
    }

    // Load initial week plan and select Monday Dinner (Chicken & Rice)
    const plan = await mealPlanService.getWeekPlan(this.state.weekOffset);
    this.state.currentPlan = plan;

    const mondayDinner = plan.days[0]?.dinner;
    if (mondayDinner) {
      const rec = await recipeService.getRecipeById(mondayDinner.recipeId);
      this.state.selectedRecipe = rec;
      this.state.recipeDetailServings = rec ? rec.servings : 4;
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

    // Keep active selection in sync
    const currentDay = this.state.currentPlan.days[this.state.selectedDayIndex];
    const meal = currentDay ? currentDay[this.state.selectedMealType] : null;
    if (meal) {
      this.state.selectedRecipe = await recipeService.getRecipeById(meal.recipeId);
    }

    this.notify();
  }

  async selectMeal(dayIndex: number, mealType: 'breakfast' | 'dinner'): Promise<void> {
    this.state.selectedDayIndex = dayIndex;
    this.state.selectedMealType = mealType;
    this.state.isRecipePanelOpen = true;

    if (this.state.currentPlan) {
      const day = this.state.currentPlan.days[dayIndex];
      const meal = day ? day[mealType] : null;
      if (meal) {
        const rec = await recipeService.getRecipeById(meal.recipeId);
        this.state.selectedRecipe = rec;
        this.state.recipeDetailServings = rec ? rec.servings : 4;
      } else {
        this.state.selectedRecipe = null;
      }
    }

    this.notify();
  }

  setRecipeDetailServings(servings: number): void {
    this.state.recipeDetailServings = Math.max(1, servings);
    this.notify();
  }

  openRecipeDetail(recipe: Recipe): void {
    this.state.selectedRecipe = recipe;
    this.state.recipeDetailServings = recipe.servings || 4;
    this.state.isRecipePanelOpen = true;
    this.notify();
  }

  closeRecipePanel(): void {
    this.state.isRecipePanelOpen = false;
    this.notify();
  }

  openModal(type: NonNullable<AppState['activeModal']>['type'], data?: any): void {
    this.state.activeModal = { type, data };
    this.notify();
  }

  closeModal(): void {
    this.state.activeModal = null;
    this.notify();
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
      // Show iOS guided instructions if iOS
      const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
      if (isIOS) {
        this.openModal('ios-pwa-guide');
      }
    }
    return false;
  }
}

export const appState = new StateManager();
