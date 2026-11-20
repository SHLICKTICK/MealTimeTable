import { appState } from '../../app/state';
import { recipeService } from '../../services/recipeService';
import { mealPlanService } from '../../services/mealPlanService';
import { inventoryService } from '../../services/inventoryService';
import { ingredientCatalogService } from '../../services/ingredientCatalogService';
import { aiRecipeService } from '../../services/aiRecipeService';

export interface ModalDependencies {
  state: typeof appState;
  recipes: typeof recipeService;
  mealPlans: typeof mealPlanService;
  inventory: typeof inventoryService;
  catalog: typeof ingredientCatalogService;
  aiRecipes: typeof aiRecipeService;
}

export function createDefaultModalDependencies(): ModalDependencies {
  return {
    state: appState,
    recipes: recipeService,
    mealPlans: mealPlanService,
    inventory: inventoryService,
    catalog: ingredientCatalogService,
    aiRecipes: aiRecipeService,
  };
}

export interface ModalComponent<TData = unknown> {
  render(overlay: HTMLElement, data?: TData): Promise<void> | void;
  destroy(): void;
}

export abstract class BaseModal<TData = unknown> implements ModalComponent<TData> {
  protected readonly deps: ModalDependencies;
  protected abortController: AbortController | null = null;
  protected overlay: HTMLElement | null = null;

  constructor(deps: ModalDependencies = createDefaultModalDependencies()) {
    this.deps = deps;
  }

  abstract render(overlay: HTMLElement, data?: TData): Promise<void> | void;

  /**
   * Aborts any listeners from a prior render of this modal instance and starts a fresh AbortSignal.
   */
  protected beginRender(overlay: HTMLElement): AbortSignal {
    this.cleanupListeners();
    this.overlay = overlay;
    this.abortController = new AbortController();
    return this.abortController.signal;
  }

  protected bindCloseButton(overlay: HTMLElement, signal: AbortSignal): void {
    const closeBtn = overlay.querySelector('#modal-close-btn');
    closeBtn?.addEventListener(
      'click',
      () => {
        this.deps.state.closeModal();
      },
      { signal }
    );
  }

  protected cleanupListeners(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  destroy(): void {
    this.cleanupListeners();
    this.overlay = null;
  }
}
