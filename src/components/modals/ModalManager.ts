import { ModalType } from '../../app/state';
import {
  ModalComponent,
  ModalDependencies,
  createDefaultModalDependencies,
} from './BaseModal';
import { MealCompletionModal, MealCompletionModalData } from './meal/MealCompletionModal';
import { AssignMealModal, AssignMealModalData } from './meal/AssignMealModal';
import { WeekSelectorModal } from './meal/WeekSelectorModal';
import { InventoryModal, InventoryModalData } from './inventory/InventoryModal';
import { IngredientDetailModal, IngredientDetailModalData } from './inventory/IngredientDetailModal';
import { InventoryActivityModal, InventoryActivityModalData } from './inventory/InventoryActivityModal';
import { RecipeEditorModal, RecipeEditorModalData } from './recipe/RecipeEditorModal';
import { PriceCatalogModal } from './catalog/PriceCatalogModal';
import { PwaGuideModal } from './system/PwaGuideModal';

export class ModalManager {
  private readonly overlay: HTMLElement;
  private readonly deps: ModalDependencies;
  private readonly managerAbortController: AbortController;
  private currentModalId: string | null = null;
  private activeModal: ModalComponent<unknown> | null = null;
  private previouslyFocusedElement: HTMLElement | null = null;

  constructor(deps: ModalDependencies = createDefaultModalDependencies()) {
    this.deps = deps;
    this.overlay = document.createElement('div');
    this.overlay.className =
      'fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay hidden select-none';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');

    this.managerAbortController = new AbortController();
    this.bindSharedHandlers();
    void this.render();
  }

  getElement(): HTMLElement {
    return this.overlay;
  }

  private bindSharedHandlers(): void {
    const { signal } = this.managerAbortController;

    // Single backdrop click handler — avoids listener accumulation across renders
    this.overlay.addEventListener(
      'click',
      (e) => {
        if (e.target === this.overlay) {
          this.deps.state.closeModal();
        }
      },
      { signal }
    );

    // Global Escape-key dismissal while any modal is active
    if (typeof document !== 'undefined') {
      document.addEventListener(
        'keydown',
        (e) => {
          if (e.key === 'Escape' && this.currentModalId !== null) {
            this.deps.state.closeModal();
          }
        },
        { signal }
      );
    }
  }

  private createModalInstance(type: ModalType): ModalComponent<unknown> {
    switch (type) {
      case 'meal-completion':
        return new MealCompletionModal(this.deps) as ModalComponent<unknown>;
      case 'assign-meal':
        return new AssignMealModal(this.deps) as ModalComponent<unknown>;
      case 'week-selector':
        return new WeekSelectorModal(this.deps) as ModalComponent<unknown>;
      case 'add-inventory':
      case 'edit-inventory':
        return new InventoryModal(this.deps) as ModalComponent<unknown>;
      case 'ingredient-detail':
        return new IngredientDetailModal(this.deps) as ModalComponent<unknown>;
      case 'inventory-activity':
        return new InventoryActivityModal(this.deps) as ModalComponent<unknown>;
      case 'edit-recipe':
      case 'create-recipe':
        return new RecipeEditorModal(this.deps) as ModalComponent<unknown>;
      case 'price-catalog':
        return new PriceCatalogModal(this.deps) as ModalComponent<unknown>;
      case 'ios-pwa-guide':
        return new PwaGuideModal(this.deps) as ModalComponent<unknown>;
    }
  }

  private cleanupActiveModal(): void {
    if (this.activeModal) {
      this.activeModal.destroy();
      this.activeModal = null;
    }
  }

  async render(force: boolean = false): Promise<void> {
    const state = this.deps.state.getState();
    const modalData = state.activeModal;

    if (!modalData || !modalData.type) {
      const wasOpen = this.currentModalId !== null;
      this.currentModalId = null;
      this.cleanupActiveModal();
      this.overlay.classList.add('hidden');
      this.overlay.innerHTML = '';

      if (wasOpen && this.previouslyFocusedElement && typeof this.previouslyFocusedElement.focus === 'function') {
        this.previouslyFocusedElement.focus();
      }
      this.previouslyFocusedElement = null;
      return;
    }

    // Preserve active form state if this modal instance is already open and being edited
    if (!force && modalData.id && this.currentModalId === modalData.id) {
      return;
    }

    if (this.currentModalId === null && typeof document !== 'undefined') {
      this.previouslyFocusedElement = document.activeElement as HTMLElement | null;
    }

    this.currentModalId = modalData.id || `modal-${modalData.type}`;
    this.cleanupActiveModal();
    this.overlay.classList.remove('hidden');

    const modalInstance = this.createModalInstance(modalData.type);
    this.activeModal = modalInstance;

    await this.renderTypedModal(modalData.type, modalInstance, modalData.data);
  }

  private async renderTypedModal(
    type: ModalType,
    instance: ModalComponent<unknown>,
    data: unknown
  ): Promise<void> {
    switch (type) {
      case 'meal-completion':
        await (instance as MealCompletionModal).render(
          this.overlay,
          data as MealCompletionModalData | undefined
        );
        break;
      case 'assign-meal':
        await (instance as AssignMealModal).render(
          this.overlay,
          data as AssignMealModalData | undefined
        );
        break;
      case 'add-inventory':
      case 'edit-inventory':
        (instance as InventoryModal).render(
          this.overlay,
          type === 'edit-inventory' ? (data as InventoryModalData | undefined) : undefined
        );
        break;
      case 'ingredient-detail':
        await (instance as IngredientDetailModal).render(
          this.overlay,
          data as IngredientDetailModalData | undefined
        );
        break;
      case 'inventory-activity':
        await (instance as InventoryActivityModal).render(
          this.overlay,
          data as InventoryActivityModalData | undefined
        );
        break;
      case 'edit-recipe':
      case 'create-recipe':
        (instance as RecipeEditorModal).render(
          this.overlay,
          type === 'edit-recipe' ? (data as RecipeEditorModalData | undefined) : undefined
        );
        break;
      case 'price-catalog':
        await (instance as PriceCatalogModal).render(this.overlay);
        break;
      case 'week-selector':
        (instance as WeekSelectorModal).render(this.overlay);
        break;
      case 'ios-pwa-guide':
        (instance as PwaGuideModal).render(this.overlay);
        break;
    }
  }

  destroy(): void {
    this.cleanupActiveModal();
    this.managerAbortController.abort();
    this.overlay.innerHTML = '';
    this.currentModalId = null;
  }
}
