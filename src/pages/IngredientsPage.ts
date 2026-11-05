import { inventoryService } from '../services/inventoryService';
import {
  IngredientInventory,
  StockStatus,
  StorageLocation,
  calculateStockStatus,
} from '../models/IngredientInventory';
import { appState } from '../app/state';
import { getIconSvg, getIngredientMiniIconSvg } from '../utils/iconHelper';
import { formatSmartQuantity } from '../utils/unitConversion';
import { formatZAR, formatPriceRate, getItemStockValue } from '../utils/pricingUtils';

export class IngredientsPage {
  private container: HTMLElement;
  private ingredients: IngredientInventory[] = [];
  private searchQuery: string = '';
  private filterStatus: 'All' | StockStatus = 'All';
  private filterLocation: 'All' | StorageLocation = 'All';
  private sortBy: 'name' | 'quantity-desc' | 'quantity-asc' | 'recent' | 'never-used' | 'price-desc' | 'value-desc' = 'name';

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'w-full flex flex-col gap-4 pb-16';
    this.loadIngredients();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  async loadIngredients(): Promise<void> {
    this.ingredients = await inventoryService.getAllIngredients();
    this.render();
  }

  render(): void {
    // Calculate stock stats and total pantry valuation
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalPantryValue = 0;

    this.ingredients.forEach((item) => {
      const status = calculateStockStatus(item.quantity, item.minStockLevel);
      if (status === 'In Stock') inStockCount++;
      else if (status === 'Low Stock') lowStockCount++;
      else if (status === 'Out of Stock') outOfStockCount++;
      totalPantryValue += getItemStockValue(item);
    });

    // Filter & Sort
    const filtered = this.ingredients.filter((item) => {
      const status = calculateStockStatus(item.quantity, item.minStockLevel);
      const matchesStatus = this.filterStatus === 'All' || status === this.filterStatus;
      const matchesLoc = this.filterLocation === 'All' || item.location === this.filterLocation;
      const matchesSearch =
        !this.searchQuery ||
        item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(this.searchQuery.toLowerCase()));

      return matchesStatus && matchesLoc && matchesSearch;
    });

    filtered.sort((a, b) => {
      if (this.sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (this.sortBy === 'quantity-desc') {
        return b.quantity - a.quantity;
      }
      if (this.sortBy === 'quantity-asc') {
        return a.quantity - b.quantity;
      }
      if (this.sortBy === 'price-desc') {
        return (b.price || 0) - (a.price || 0);
      }
      if (this.sortBy === 'value-desc') {
        return getItemStockValue(b) - getItemStockValue(a);
      }
      if (this.sortBy === 'recent') {
        const timeA = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
        const timeB = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
        return timeB - timeA;
      }
      if (this.sortBy === 'never-used') {
        const hasA = a.lastUsedAt ? 1 : 0;
        const hasB = b.lastUsedAt ? 1 : 0;
        return hasA - hasB;
      }
      return 0;
    });

    const wasSearchFocused = document.activeElement?.id === 'inventory-search-input';
    const cursorPos = (document.activeElement as HTMLInputElement | null)?.selectionStart ?? null;

    this.container.innerHTML = `
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#25221F]/8">
        <div>
          <h2 class="text-[28px] md:text-[32px] font-serif font-normal text-[#221F1C] tracking-[-0.015em] leading-tight">Pantry & Ingredients</h2>
          <p class="text-xs text-[#6B6560] mt-1">Manage household stock, pricing per kg / g & L / ml, minimum levels, and pantry valuation</p>
        </div>

        <div class="flex items-center gap-2.5">
          <button id="btn-view-activity-log" 
                  class="px-4 py-2 rounded-full glass-pill text-xs font-medium text-[#221F1C] hover:bg-white/80 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
            ${getIconSvg('history', 'w-3.5 h-3.5 text-[#8C5C26]')}
            Activity History
          </button>

          <button id="btn-add-inventory-item" 
                  class="px-5 py-2 rounded-full text-white text-xs font-medium flex items-center gap-2 hover:opacity-95 transition shadow-[0_6px_16px_-4px_rgba(25,22,19,0.3)] cursor-pointer whitespace-nowrap"
                  style="background: linear-gradient(180deg, #2D2A27 0%, #191715 100%);">
            ${getIconSvg('plus', 'w-3.5 h-3.5')}
            Add Ingredient
          </button>
        </div>
      </div>

      <!-- Quick KPI Counters with Pantry Valuation -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div class="rounded-[22px] bg-white/58 backdrop-blur-md border border-white/85 shadow-[0_6px_22px_-6px_rgba(85,58,30,0.06),inset_0_1px_0_#FFFFFF] px-4 py-3.5 flex items-center gap-3.5">
          <div class="shrink-0 flex items-center justify-center text-[#8C5C26]">
            ${getIconSvg('package', 'w-5 h-5')}
          </div>
          <div>
            <span class="text-[11.5px] text-[#6E6863] font-normal block">Total Items</span>
            <span class="text-xl font-medium text-[#221F1C] tabular-nums leading-snug">${this.ingredients.length}</span>
          </div>
        </div>

        <div class="rounded-[22px] bg-white/58 hover:bg-white/75 backdrop-blur-md border border-white/85 shadow-[0_6px_22px_-6px_rgba(85,58,30,0.06),inset_0_1px_0_#FFFFFF] px-4 py-3.5 flex items-center gap-3.5 cursor-pointer transition" data-quick-filter="In Stock">
          <div class="shrink-0 flex items-center justify-center text-[#4A7C4A]">
            ${getIconSvg('check-circle', 'w-5 h-5')}
          </div>
          <div>
            <span class="text-[11.5px] text-[#6E6863] font-normal block">In Stock</span>
            <span class="text-xl font-medium text-[#4A7C4A] tabular-nums leading-snug">${inStockCount}</span>
          </div>
        </div>

        <div class="rounded-[22px] bg-white/58 hover:bg-white/75 backdrop-blur-md border border-white/85 shadow-[0_6px_22px_-6px_rgba(85,58,30,0.06),inset_0_1px_0_#FFFFFF] px-4 py-3.5 flex items-center gap-3.5 cursor-pointer transition" data-quick-filter="Low Stock">
          <div class="shrink-0 flex items-center justify-center text-[#C2822B]">
            ${getIconSvg('alert-triangle', 'w-5 h-5')}
          </div>
          <div>
            <span class="text-[11.5px] text-[#6E6863] font-normal block">Low Stock</span>
            <span class="text-xl font-medium text-[#C2822B] tabular-nums leading-snug">${lowStockCount}</span>
          </div>
        </div>

        <div class="rounded-[22px] bg-white/58 hover:bg-white/75 backdrop-blur-md border border-white/85 shadow-[0_6px_22px_-6px_rgba(85,58,30,0.06),inset_0_1px_0_#FFFFFF] px-4 py-3.5 flex items-center gap-3.5 cursor-pointer transition" data-quick-filter="Out of Stock">
          <div class="shrink-0 flex items-center justify-center text-rose-600">
            ${getIconSvg('x', 'w-5 h-5')}
          </div>
          <div>
            <span class="text-[11.5px] text-[#6E6863] font-normal block">Out of Stock</span>
            <span class="text-xl font-medium text-rose-600 tabular-nums leading-snug">${outOfStockCount}</span>
          </div>
        </div>

        <div class="rounded-[22px] bg-white/58 backdrop-blur-md border border-white/85 shadow-[0_6px_22px_-6px_rgba(85,58,30,0.06),inset_0_1px_0_#FFFFFF] px-4 py-3.5 flex items-center gap-3.5">
          <div class="shrink-0 flex items-center justify-center">
            ${getIconSvg('chart-bar-filled', 'w-5 h-5')}
          </div>
          <div>
            <span class="text-[11.5px] text-[#6E6863] font-normal block">Pantry Value</span>
            <span class="text-xl font-medium text-[#221F1C] tabular-nums leading-snug">${formatZAR(totalPantryValue)}</span>
          </div>
        </div>
      </div>

      <!-- Controls & Filter Toolbar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        <!-- Search -->
        <div class="relative w-full md:w-64">
          <input id="inventory-search-input" 
                 type="text" 
                 placeholder="Search ingredient or location..." 
                 value="${this.searchQuery}"
                 class="w-full pl-3.5 pr-8 py-2 text-xs rounded-full bg-white/65 border border-white/90 focus:outline-none focus:ring-1 focus:ring-[#D9A441] text-[#221F1C] shadow-2xs" />
        </div>

        <!-- Filter and Sort Controls -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Stock Filter Tabs -->
          <div class="flex items-center gap-1 bg-white/55 backdrop-blur-md border border-white/85 p-1 rounded-full">
            ${['All', 'In Stock', 'Low Stock', 'Out of Stock']
              .map(
                (st) => `
              <button data-status="${st}" 
                      class="btn-status-filter px-3 py-1 rounded-full text-[11px] transition cursor-pointer whitespace-nowrap ${
                        this.filterStatus === st
                          ? 'sidebar-nav-active text-[#221F1C] font-semibold'
                          : 'text-[#6B6560] hover:text-[#221F1C] font-medium'
                      }">
                ${st}
              </button>
            `
              )
              .join('')}
          </div>

          <!-- Location Selector -->
          <select id="select-inventory-location" class="bg-white/65 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs text-[#221F1C] border border-white/90 focus:outline-none cursor-pointer shadow-2xs">
            <option value="All" ${this.filterLocation === 'All' ? 'selected' : ''}>All Locations</option>
            <option value="Fridge" ${this.filterLocation === 'Fridge' ? 'selected' : ''}>Fridge</option>
            <option value="Pantry" ${this.filterLocation === 'Pantry' ? 'selected' : ''}>Pantry</option>
            <option value="Freezer" ${this.filterLocation === 'Freezer' ? 'selected' : ''}>Freezer</option>
            <option value="Spice Rack" ${this.filterLocation === 'Spice Rack' ? 'selected' : ''}>Spice Rack</option>
            <option value="Counter" ${this.filterLocation === 'Counter' ? 'selected' : ''}>Counter</option>
          </select>

          <!-- Sort Selector with Price & Value Options -->
          <select id="select-inventory-sort" class="bg-white/65 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs text-[#221F1C] border border-white/90 focus:outline-none cursor-pointer shadow-2xs">
            <option value="name" ${this.sortBy === 'name' ? 'selected' : ''}>Sort: Name (A-Z)</option>
            <option value="value-desc" ${this.sortBy === 'value-desc' ? 'selected' : ''}>Sort: Stock Value (High-Low)</option>
            <option value="price-desc" ${this.sortBy === 'price-desc' ? 'selected' : ''}>Sort: Unit Price (High-Low)</option>
            <option value="quantity-desc" ${this.sortBy === 'quantity-desc' ? 'selected' : ''}>Sort: Quantity (High-Low)</option>
            <option value="quantity-asc" ${this.sortBy === 'quantity-asc' ? 'selected' : ''}>Sort: Quantity (Low-High)</option>
            <option value="recent" ${this.sortBy === 'recent' ? 'selected' : ''}>Sort: Recently Used</option>
            <option value="never-used" ${this.sortBy === 'never-used' ? 'selected' : ''}>Sort: Never Used</option>
          </select>
        </div>
      </div>

      <!-- Inventory Table / Cards -->
      <div class="rounded-[22px] bg-white/58 backdrop-blur-md border border-white/85 shadow-[0_6px_22px_-6px_rgba(85,58,30,0.06),inset_0_1px_0_#FFFFFF] mb-8 overflow-hidden">
        <div class="overflow-x-auto w-full">
          <table class="w-full text-left border-collapse text-xs">
            <thead class="sticky top-0 bg-white/75 backdrop-blur-md z-10 border-b border-[#25221F]/8">
              <tr class="text-[#6B6560] font-medium">
                <th class="py-3 px-4">Ingredient</th>
                <th class="py-3 px-4">Current Stock</th>
                <th class="py-3 px-4">Unit Price</th>
                <th class="py-3 px-4">Stock Value</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4">Min. Level</th>
                <th class="py-3 px-4">Location</th>
                <th class="py-3 px-4">Last Activity</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#25221F]/5">
              ${
                filtered.length === 0
                  ? `
                <tr>
                  <td colspan="9" class="py-12 text-center text-[#77716D] font-serif">
                    No ingredients found matching your search and filter criteria.
                  </td>
                </tr>
              `
                  : filtered
                      .map((item) => {
                        const status = calculateStockStatus(item.quantity, item.minStockLevel);
                        let statusBadge = '';
                        if (status === 'In Stock') {
                          statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF5EA] text-[#3E703E] border border-[#D5EAD5]">
                            ${getIconSvg('check', 'w-3 h-3 text-[#4A7C4A]')}
                            In Stock
                          </span>`;
                        } else if (status === 'Low Stock') {
                          statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FDF4E7] text-[#B87A24] border border-[#F6DEBD]">
                            ${getIconSvg('alert-triangle', 'w-3 h-3 text-[#C2822B]')}
                            Low Stock
                          </span>`;
                        } else {
                          statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            ${getIconSvg('x', 'w-3 h-3 text-rose-600')}
                            Out of Stock
                          </span>`;
                        }

                        const lastUsedStr = item.lastUsedAt
                          ? new Date(item.lastUsedAt).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
                          : '<span class="text-[#6B6560]/50 italic">Never used</span>';

                        const stockVal = getItemStockValue(item);

                        return `
                    <tr class="hover:bg-white/45 transition group">
                      <!-- Name & Category -->
                      <td class="py-3 px-4">
                        <div class="flex items-center gap-2.5">
                          ${getIngredientMiniIconSvg(item.name, item.category)}
                          <div class="flex flex-col">
                            <span class="font-semibold text-[#221F1C] text-[13.5px]">${item.name}</span>
                            <span class="text-[11px] text-[#6B6560]">${item.category}${item.notes ? ` · ${item.notes}` : ''}</span>
                          </div>
                        </div>
                      </td>

                      <!-- Quantity with Quick Stepper -->
                      <td class="py-3 px-4">
                        <div class="flex items-center gap-2">
                          <button class="btn-quick-qty w-6 h-6 rounded-full bg-white/75 hover:bg-white border border-white/90 text-[#6B6560] hover:text-[#221F1C] flex items-center justify-center cursor-pointer transition shadow-2xs" 
                                   data-id="${item.id}" data-action="dec" title="Deduct 1 ${item.unit}">
                            ${getIconSvg('minus', 'w-3 h-3')}
                          </button>
                          <span class="font-semibold text-[#221F1C] tabular-nums text-[13px] min-w-[50px] text-center">
                            ${formatSmartQuantity(item.quantity, item.unit)}
                          </span>
                          <button class="btn-quick-qty w-6 h-6 rounded-full bg-white/75 hover:bg-white border border-white/90 text-[#6B6560] hover:text-[#221F1C] flex items-center justify-center cursor-pointer transition shadow-2xs" 
                                   data-id="${item.id}" data-action="inc" title="Add 1 ${item.unit}">
                            ${getIconSvg('plus', 'w-3 h-3')}
                          </button>
                        </div>
                      </td>

                      <!-- Unit Price (e.g. per kg/g or per L/ml) -->
                      <td class="py-3 px-4">
                        <div class="flex flex-col">
                          <span class="font-medium text-[#221F1C] tabular-nums text-xs">
                            ${formatPriceRate(item.price, item.priceUnit, true)}
                          </span>
                        </div>
                      </td>

                      <!-- Calculated Stock Value -->
                      <td class="py-3 px-4">
                        <span class="font-semibold text-[#8C5C26] tabular-nums text-xs">
                          ${formatZAR(stockVal)}
                        </span>
                      </td>

                      <!-- Status -->
                      <td class="py-3 px-4">
                        ${statusBadge}
                      </td>

                      <!-- Min Stock Level -->
                      <td class="py-3 px-4 text-[#6B6560] tabular-nums">
                        ${formatSmartQuantity(item.minStockLevel, item.unit)}
                      </td>

                      <!-- Location -->
                      <td class="py-3 px-4 text-[#221F1C]">
                        <span class="px-2.5 py-0.5 rounded-full bg-white/70 border border-white/90 text-[11px] font-medium">
                          ${item.location}
                        </span>
                      </td>

                      <!-- Last Used -->
                      <td class="py-3 px-4 text-[#6B6560]">
                        ${lastUsedStr}
                      </td>

                      <!-- Actions -->
                      <td class="py-3 px-4 text-right">
                        <div class="flex items-center justify-end gap-1.5">
                          <button class="btn-item-history p-1.5 rounded-full text-[#8C5C26] hover:bg-white/80 cursor-pointer transition" 
                                  title="View Item History" data-id="${item.id}">
                            ${getIconSvg('history', 'w-3.5 h-3.5')}
                          </button>
                          <button class="btn-item-edit p-1.5 rounded-full text-[#6B6560] hover:text-[#221F1C] hover:bg-white/80 cursor-pointer transition" 
                                  title="Edit Ingredient" data-id="${item.id}">
                            ${getIconSvg('edit', 'w-3.5 h-3.5')}
                          </button>
                          <button class="btn-item-delete p-1.5 rounded-full text-[#6B6560] hover:text-rose-600 hover:bg-white/80 cursor-pointer transition" 
                                  title="Remove Ingredient" data-id="${item.id}">
                            ${getIconSvg('trash', 'w-3.5 h-3.5')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                      })
                      .join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.bindEvents();
    if (wasSearchFocused) {
      const nextInput = this.container.querySelector<HTMLInputElement>('#inventory-search-input');
      if (nextInput) {
        nextInput.focus();
        if (cursorPos !== null) {
          nextInput.setSelectionRange(cursorPos, cursorPos);
        }
      }
    }
  }

  private bindEvents(): void {
    const searchInput = this.container.querySelector<HTMLInputElement>('#inventory-search-input');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value;
      this.render();
    });

    const statusBtns = this.container.querySelectorAll<HTMLButtonElement>('.btn-status-filter');
    statusBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.filterStatus = btn.getAttribute('data-status') as any;
        this.render();
      });
    });

    const quickFilters = this.container.querySelectorAll<HTMLElement>('[data-quick-filter]');
    quickFilters.forEach((qf) => {
      qf.addEventListener('click', () => {
        const val = qf.getAttribute('data-quick-filter') as StockStatus;
        this.filterStatus = val;
        this.render();
      });
    });

    const locSelect = this.container.querySelector<HTMLSelectElement>('#select-inventory-location');
    locSelect?.addEventListener('change', (e) => {
      this.filterLocation = (e.target as HTMLSelectElement).value as any;
      this.render();
    });

    const sortSelect = this.container.querySelector<HTMLSelectElement>('#select-inventory-sort');
    sortSelect?.addEventListener('change', (e) => {
      this.sortBy = (e.target as HTMLSelectElement).value as any;
      this.render();
    });

    const addBtn = this.container.querySelector('#btn-add-inventory-item');
    addBtn?.addEventListener('click', () => {
      appState.openModal('add-inventory');
    });

    const historyBtn = this.container.querySelector('#btn-view-activity-log');
    historyBtn?.addEventListener('click', () => {
      appState.openModal('inventory-activity');
    });

    // Quick increment / decrement quantity buttons
    const qtyBtns = this.container.querySelectorAll<HTMLButtonElement>('.btn-quick-qty');
    qtyBtns.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        const item = this.ingredients.find((i) => i.id === id);
        if (id && item) {
          // Adjust by step: if in grams, 100g, if kg 0.5kg, else 1
          let step = 1;
          if (item.unit === 'g') step = 50;
          else if (item.unit === 'ml') step = 50;
          else if (item.unit === 'kg') step = 0.5;

          const newQty = action === 'inc' ? item.quantity + step : Math.max(0, item.quantity - step);
          await inventoryService.updateIngredient(id, { quantity: Math.round(newQty * 100) / 100 });
          await this.loadIngredients();
        }
      });
    });

    // Item-specific actions
    const itemHistoryBtns = this.container.querySelectorAll<HTMLButtonElement>('.btn-item-history');
    itemHistoryBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = this.ingredients.find((i) => i.id === id);
        if (item) {
          appState.openModal('inventory-activity', { ingredient: item });
        }
      });
    });

    const editBtns = this.container.querySelectorAll<HTMLButtonElement>('.btn-item-edit');
    editBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = this.ingredients.find((i) => i.id === id);
        if (item) {
          appState.openModal('edit-inventory', { ingredient: item });
        }
      });
    });

    const deleteBtns = this.container.querySelectorAll<HTMLButtonElement>('.btn-item-delete');
    deleteBtns.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const item = this.ingredients.find((i) => i.id === id);
        if (id && item && confirm(`Remove "${item.name}" from household inventory?`)) {
          await inventoryService.deleteIngredient(id);
          appState.showToast(`Removed "${item.name}" from inventory`, 'info');
          await this.loadIngredients();
        }
      });
    });
  }
}
