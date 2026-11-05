import { appState, AppState, AppPage } from './state';
import { Sidebar } from '../components/Sidebar';
import { WeeklyHeader } from '../components/WeeklyHeader';
import { RecipePanel } from '../components/RecipePanel';
import { Modal } from '../components/Modal';
import { WeeklyPlanPage } from '../pages/WeeklyPlanPage';
import { RecipesPage } from '../pages/RecipesPage';
import { IngredientsPage } from '../pages/IngredientsPage';
import { ShoppingListPage } from '../pages/ShoppingListPage';
import { SettingsPage } from '../pages/SettingsPage';
import { getIconSvg } from '../utils/iconHelper';

export class App {
  private root: HTMLElement;
  private sidebar: Sidebar;
  private weeklyHeader: WeeklyHeader;
  private recipePanel: RecipePanel;
  private modal: Modal;

  // Pages
  private weeklyPlanPage: WeeklyPlanPage;
  private recipesPage: RecipesPage;
  private ingredientsPage: IngredientsPage;
  private shoppingListPage: ShoppingListPage;
  private settingsPage: SettingsPage;

  private currentMountedPage: AppPage | null = null;
  private wasModalOpen: boolean = false;
  private lastWeeklyKey: string = '';

  constructor(root: HTMLElement) {
    this.root = root;
    this.sidebar = new Sidebar();
    this.weeklyHeader = new WeeklyHeader();
    this.recipePanel = new RecipePanel();
    this.modal = new Modal();

    this.weeklyPlanPage = new WeeklyPlanPage();
    this.recipesPage = new RecipesPage();
    this.ingredientsPage = new IngredientsPage();
    this.shoppingListPage = new ShoppingListPage();
    this.settingsPage = new SettingsPage();

    this.init();
  }

  private async init(): Promise<void> {
    await appState.init();
    this.render();

    // Subscribe to state updates
    appState.subscribe((state) => {
      this.handleStateChange(state);
    });
  }

  private getMainAreaClass(page: AppPage): string {
    return page === 'weekly'
      ? 'flex-1 min-w-0 h-full flex flex-col overflow-y-auto overscroll-contain pr-0.5'
      : 'flex-1 min-w-0 h-full flex flex-col glass-panel p-5 md:p-6 overflow-y-auto overscroll-contain';
  }

  private computeWeeklyKey(state: AppState): string {
    const mealsSig = state.currentPlan?.days
      ?.map((d) => `${d.breakfast?.recipeId || ''}:${d.breakfast?.status || ''}|${d.dinner?.recipeId || ''}:${d.dinner?.status || ''}`)
      .join(';');
    return `${state.weekOffset}:${state.selectedDayIndex}:${state.selectedMealType}:${state.currentPlan?.estimatedBudgetZAR || 0}:${mealsSig || ''}`;
  }

  private render(): void {
    const state = appState.getState();

    this.root.className = 'w-full min-h-screen lg:h-screen apple-bg-scene flex flex-col justify-between overflow-x-hidden lg:overflow-hidden';

    this.root.innerHTML = `
      <!-- Toast Notification Alert -->
      ${
        state.toast
          ? `
        <div class="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-fade-in flex items-center gap-2.5 px-4 py-2.5 rounded-2xl glass-panel bg-white/95 text-xs font-semibold text-[#25221F] shadow-lg border border-white">
          <span class="w-2 h-2 rounded-full ${
            state.toast.type === 'success'
              ? 'bg-emerald-500'
              : state.toast.type === 'warning'
              ? 'bg-amber-500'
              : 'bg-blue-500'
          }"></span>
          <span class="toast-message-text">${state.toast.message}</span>
        </div>
      `
          : ''
      }

      <!-- Offline Notice Banner if disconnected -->
      ${
        !state.isOnline
          ? `
        <div class="w-full bg-[#E9D1B4]/90 backdrop-blur-md px-4 py-1.5 text-xs text-[#25221F] text-center font-medium border-b border-[#D4AA6A]/50 z-40">
          Offline Mode — Using locally saved recipes, inventory stock, and meal schedules.
        </div>
      `
          : ''
      }

      <!-- Main Desktop Frame matching reference layout -->
      <div class="flex-1 w-full max-w-[1640px] mx-auto flex items-stretch relative z-10 min-h-0 overflow-hidden">
        <!-- 1. Left Sidebar -->
        <div id="sidebar-container" class="shrink-0 h-full flex flex-col min-h-0 lg:pb-[72px] xl:pb-[80px]"></div>

        <!-- 2. Right-of-Sidebar Workspace -->
        <div class="flex-1 min-w-0 h-full flex flex-col px-4 pt-4 pb-20 md:px-6 md:pt-5 lg:px-8 lg:py-6 overflow-hidden">
          <!-- Top Header Bar (spans above Day Cards + Recipe Panel on Weekly Plan) -->
          <div id="weekly-header-container" class="${state.activePage === 'weekly' ? '' : 'hidden'}"></div>

          <!-- Two-Column Content Row -->
          <div class="flex-1 min-h-0 flex gap-6 items-stretch overflow-hidden">
            <!-- Central Workspace Content -->
            <main id="main-content-area" class="${this.getMainAreaClass(state.activePage)}">
              <!-- Active Page renders here -->
            </main>

            <!-- Right Recipe Detail Panel -->
            <div id="recipe-panel-container" class="shrink-0 h-full flex flex-col min-h-0 ${state.isRecipePanelOpen ? '' : 'hidden xl:flex'}"></div>
          </div>
        </div>
      </div>

      <!-- Mobile Bottom Navigation Bar (hidden on desktop) -->
      <nav class="mobile-nav-bar fixed bottom-0 left-0 right-0 z-40 glass-panel !rounded-t-2xl !rounded-b-none border-t border-white/80 py-2.5 px-4 flex items-center justify-around shadow-lg">
        ${this.renderMobileNavMarkup(state.activePage)}
      </nav>

      <!-- Global Modal Mount -->
      <div id="modal-container"></div>
    `;

    // Mount subcomponents
    const sidebarMount = this.root.querySelector('#sidebar-container');
    if (sidebarMount) {
      sidebarMount.appendChild(this.sidebar.getElement());
    }

    const headerMount = this.root.querySelector('#weekly-header-container');
    if (headerMount) {
      this.weeklyHeader.render();
      headerMount.appendChild(this.weeklyHeader.getElement());
    }

    const panelMount = this.root.querySelector('#recipe-panel-container');
    if (panelMount) {
      panelMount.appendChild(this.recipePanel.getElement());
    }

    const modalMount = this.root.querySelector('#modal-container');
    if (modalMount) {
      modalMount.appendChild(this.modal.getElement());
    }

    this.lastWeeklyKey = this.computeWeeklyKey(state);
    this.mountActivePage(state.activePage);
    this.bindMobileNav();
  }

  private renderMobileNavMarkup(activePage: AppPage): string {
    return `
      ${this.renderMobileNavItem('weekly', 'Plan', 'calendar', activePage === 'weekly')}
      ${this.renderMobileNavItem('recipes', 'Recipes', 'book-open', activePage === 'recipes')}
      ${this.renderMobileNavItem('ingredients', 'Pantry', 'package', activePage === 'ingredients')}
      ${this.renderMobileNavItem('shopping', 'Shopping', 'shopping-cart', activePage === 'shopping')}
      ${this.renderMobileNavItem('settings', 'Settings', 'settings', activePage === 'settings')}
    `;
  }

  private mountActivePage(page: AppPage): void {
    const mainMount = this.root.querySelector('#main-content-area');
    if (!mainMount) return;

    mainMount.className = this.getMainAreaClass(page);

    if (this.currentMountedPage !== page) {
      this.currentMountedPage = page;
      mainMount.innerHTML = '';
      switch (page) {
        case 'weekly':
          this.weeklyPlanPage.update();
          mainMount.appendChild(this.weeklyPlanPage.getElement());
          break;
        case 'recipes':
          this.recipesPage.loadRecipes();
          mainMount.appendChild(this.recipesPage.getElement());
          break;
        case 'ingredients':
          this.ingredientsPage.loadIngredients();
          mainMount.appendChild(this.ingredientsPage.getElement());
          break;
        case 'shopping':
          this.shoppingListPage.loadItems();
          mainMount.appendChild(this.shoppingListPage.getElement());
          break;
        case 'settings':
          this.settingsPage.render();
          mainMount.appendChild(this.settingsPage.getElement());
          break;
      }
    }
  }

  private renderMobileNavItem(page: AppPage, label: string, icon: string, isActive: boolean): string {
    return `
      <button data-page="${page}" class="flex flex-col items-center gap-1 cursor-pointer transition ${
        isActive ? 'text-[#8C5C26] font-semibold' : 'text-[#77716D]'
      }">
        ${getIconSvg(icon, 'w-5 h-5')}
        <span class="text-[10px]">${label}</span>
      </button>
    `;
  }

  private bindMobileNav(): void {
    const buttons = this.root.querySelectorAll<HTMLButtonElement>('.mobile-nav-bar button[data-page]');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const page = btn.getAttribute('data-page') as AppPage;
        if (page) {
          appState.setPage(page);
        }
      });
    });
  }

  private handleStateChange(state: AppState): void {
    this.sidebar.render();
    this.weeklyHeader.render();
    this.recipePanel.render();
    this.modal.render();

    const headerMount = this.root.querySelector('#weekly-header-container');
    if (headerMount) {
      headerMount.className = state.activePage === 'weekly' ? '' : 'hidden';
    }

    const panelMount = this.root.querySelector('#recipe-panel-container');
    if (panelMount) {
      panelMount.className = `shrink-0 h-full flex flex-col min-h-0 ${state.isRecipePanelOpen ? '' : 'hidden xl:flex'}`;
    }

    const mobileNav = this.root.querySelector('.mobile-nav-bar');
    if (mobileNav) {
      mobileNav.innerHTML = this.renderMobileNavMarkup(state.activePage);
      this.bindMobileNav();
    }

    const wasWeekly = this.currentMountedPage === 'weekly';
    this.mountActivePage(state.activePage);

    const nextWeeklyKey = this.computeWeeklyKey(state);
    if (state.activePage === 'weekly' && wasWeekly && nextWeeklyKey !== this.lastWeeklyKey) {
      this.weeklyPlanPage.update();
    }
    this.lastWeeklyKey = nextWeeklyKey;

    // Refresh page data when a modal finishes/closes
    const isModalOpen = !!state.activeModal;
    if (this.wasModalOpen && !isModalOpen) {
      if (state.activePage === 'recipes') {
        this.recipesPage.loadRecipes();
      } else if (state.activePage === 'ingredients') {
        this.ingredientsPage.loadIngredients();
      } else if (state.activePage === 'weekly') {
        this.weeklyPlanPage.update();
      } else if (state.activePage === 'shopping') {
        this.shoppingListPage.loadItems();
      }
    }
    this.wasModalOpen = isModalOpen;

    // Update floating toast notification smoothly
    const existingToast = this.root.querySelector('.fixed.top-5');
    if (state.toast) {
      if (!existingToast) {
        const toastDiv = document.createElement('div');
        toastDiv.className =
          'fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-fade-in flex items-center gap-2.5 px-4 py-2.5 rounded-2xl glass-panel bg-white/95 text-xs font-semibold text-[#25221F] shadow-lg border border-white';
        toastDiv.innerHTML = `
          <span class="w-2 h-2 rounded-full ${
            state.toast.type === 'success'
              ? 'bg-emerald-500'
              : state.toast.type === 'warning'
              ? 'bg-amber-500'
              : 'bg-blue-500'
          }"></span>
          <span class="toast-message-text">${state.toast.message}</span>
        `;
        this.root.appendChild(toastDiv);
      } else {
        const dot = existingToast.querySelector('span:first-child');
        const text = existingToast.querySelector('.toast-message-text');
        if (dot) {
          dot.className = `w-2 h-2 rounded-full ${
            state.toast.type === 'success'
              ? 'bg-emerald-500'
              : state.toast.type === 'warning'
              ? 'bg-amber-500'
              : 'bg-blue-500'
          }`;
        }
        if (text) {
          text.textContent = state.toast.message;
        }
      }
    } else if (!state.toast && existingToast) {
      existingToast.remove();
    }
  }
}
