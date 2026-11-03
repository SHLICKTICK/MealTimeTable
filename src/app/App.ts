import { appState, AppState, AppPage } from './state';
import { Sidebar } from '../components/Sidebar';
import { RecipePanel } from '../components/RecipePanel';
import { Modal } from '../components/Modal';
import { WeeklyPlanPage } from '../pages/WeeklyPlanPage';
import { RecipesPage } from '../pages/RecipesPage';
import { ShoppingListPage } from '../pages/ShoppingListPage';
import { SettingsPage } from '../pages/SettingsPage';
import { getIconSvg } from '../utils/iconHelper';

export class App {
  private root: HTMLElement;
  private sidebar: Sidebar;
  private recipePanel: RecipePanel;
  private modal: Modal;

  // Pages
  private weeklyPlanPage: WeeklyPlanPage;
  private recipesPage: RecipesPage;
  private shoppingListPage: ShoppingListPage;
  private settingsPage: SettingsPage;

  constructor(root: HTMLElement) {
    this.root = root;
    this.sidebar = new Sidebar();
    this.recipePanel = new RecipePanel();
    this.modal = new Modal();

    this.weeklyPlanPage = new WeeklyPlanPage();
    this.recipesPage = new RecipesPage();
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

  private render(): void {
    const state = appState.getState();

    this.root.className = 'w-full min-h-screen apple-bg-scene flex flex-col justify-between overflow-x-hidden';

    this.root.innerHTML = `
      <!-- Offline Notice Banner if disconnected -->
      ${
        !state.isOnline
          ? `
        <div class="w-full bg-[#E9D1B4]/90 backdrop-blur-md px-4 py-1.5 text-xs text-[#25221F] text-center font-medium border-b border-[#D4AA6A]/50 z-40">
          Offline Mode — Using locally saved recipes and meal schedules.
        </div>
      `
          : ''
      }

      <!-- Main Desktop Frame (1536 x 1024 baseline) matching reference layout -->
      <div class="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 flex gap-6 items-stretch relative z-10">
        <!-- 1. Left Sidebar -->
        <div id="sidebar-container" class="shrink-0 h-full"></div>

        <!-- 2. Central Workspace Content -->
        <main id="main-content-area" class="flex-1 min-w-0 flex flex-col glass-panel p-5 md:p-6 overflow-y-auto max-h-[calc(100vh-48px)]">
          <!-- Active Page renders here -->
        </main>

        <!-- 3. Right Recipe Detail Panel -->
        <div id="recipe-panel-container" class="shrink-0 h-full ${state.isRecipePanelOpen ? '' : 'hidden xl:flex'}"></div>
      </div>

      <!-- Mobile Bottom Navigation Bar (hidden on desktop) -->
      <nav class="mobile-nav-bar fixed bottom-0 left-0 right-0 z-40 glass-panel !rounded-t-2xl !rounded-b-none border-t border-white/80 py-2.5 px-4 flex items-center justify-around shadow-lg">
        ${this.renderMobileNavItem('weekly', 'Plan', 'calendar', state.activePage === 'weekly')}
        ${this.renderMobileNavItem('recipes', 'Recipes', 'book-open', state.activePage === 'recipes')}
        ${this.renderMobileNavItem('shopping', 'Shopping', 'shopping-cart', state.activePage === 'shopping')}
        ${this.renderMobileNavItem('settings', 'Settings', 'settings', state.activePage === 'settings')}
      </nav>

      <!-- Global Modal Mount -->
      <div id="modal-container"></div>
    `;

    // Mount subcomponents
    const sidebarMount = this.root.querySelector('#sidebar-container');
    if (sidebarMount) {
      sidebarMount.appendChild(this.sidebar.getElement());
    }

    const panelMount = this.root.querySelector('#recipe-panel-container');
    if (panelMount) {
      panelMount.appendChild(this.recipePanel.getElement());
    }

    const modalMount = this.root.querySelector('#modal-container');
    if (modalMount) {
      modalMount.appendChild(this.modal.getElement());
    }

    this.mountActivePage(state.activePage);
    this.bindMobileNav();
  }

  private mountActivePage(page: AppPage): void {
    const mainMount = this.root.querySelector('#main-content-area');
    if (!mainMount) return;

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
    this.recipePanel.render();
    this.modal.render();
    this.mountActivePage(state.activePage);
  }
}
