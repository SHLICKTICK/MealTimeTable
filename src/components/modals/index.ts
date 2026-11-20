export { ModalManager, ModalManager as Modal } from './ModalManager';
export {
  BaseModal,
  createDefaultModalDependencies,
  type ModalComponent,
  type ModalDependencies,
} from './BaseModal';

export { MealCompletionModal, type MealCompletionModalData } from './meal/MealCompletionModal';
export { AssignMealModal, type AssignMealModalData } from './meal/AssignMealModal';
export { WeekSelectorModal } from './meal/WeekSelectorModal';

export { InventoryModal, type InventoryModalData } from './inventory/InventoryModal';
export { IngredientDetailModal, type IngredientDetailModalData } from './inventory/IngredientDetailModal';
export { InventoryActivityModal, type InventoryActivityModalData } from './inventory/InventoryActivityModal';

export { RecipeEditorModal, type RecipeEditorModalData } from './recipe/RecipeEditorModal';
export { PriceCatalogModal, type PriceCatalogRenderState } from './catalog/PriceCatalogModal';
export { PwaGuideModal } from './system/PwaGuideModal';
