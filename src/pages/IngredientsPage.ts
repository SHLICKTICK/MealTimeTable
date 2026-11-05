import { inventoryService } from '../services/inventoryService';
import {
  IngredientInventory,
  StockStatus,
  StorageLocation,
  calculateStockStatus,
} from '../models/IngredientInventory';
import { appState } from '../app/state';
import { getIconSvg } from '../utils/iconHelper';
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

    this.container.innerHTML = `
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#25221F]/10">
        <div>
          <h2 class="text-3xl font-serif font-medium text-[#25221F]">Pantry & Ingredients</h2>
          <p class="text-xs text-[#77716D] mt-1">Manage household stock, pricing per kg / g & L / ml, minimum levels, and pantry valuation</p>
        </div>

        <div class="flex items-center gap-2.5">
          <button id="btn-view-activity-log" 
                  class="px-3.5 py-2 rounded-xl glass-card text-xs font-medium text-[#25221F] hover:bg-white/80 transition flex items-center gap-1.5 cursor-pointer shadow-2xs">
            ${getIconSvg('history', 'w-4 h-4 text-[#8C5C26]')}
            Activity History
          </button>

          <button id="btn-add-inventory-item" 
                  class="px-4 py-2 rounded-xl bg-[#25221F] text-white text-xs font-medium flex items-center gap-2 hover:bg-[#3D3833] transition shadow-sm cursor-pointer whitespace-nowrap">
            ${getIconSvg('plus', 'w-3.5 h-3.5')}
            Add Ingredient
          </button>
        </div>
      </div>

      <!-- Quick KPI Counters with Pantry Valuation -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div class="glass-card p-3.5 rounded-2xl flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-white/60 border border-white flex items-center justify-center text-[#25221F] shrink-0">
            ${getIconSvg('package', 'w-5 h-5 text-[#8C5C26]')}
          </div>
          <div>
            <span class="text-[11px] text-[#77716D] font-medium block">Total Items</span>
            <span class="text-xl font-bold text-[#25221F] tabular-nums">${this.ingredients.length}</span>
          </div>
        </div>

        <div class="glass-card p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-white/70 transition" data-quick-filter="In Stock">
          <div class="w-10 h-10 rounded-xl bg-[#F2F7F2] border border-[#D5EAD5] flex items-center justify-center text-[#4A7C4A] shrink-0">
            ${getIconSvg('check-circle', 'w-5 h-5')}
          </div>
          <div>
            <span class="text-[11px] text-[#77716D] font-medium block">In Stock</span>
            <span class="text-xl font-bold text-[#4A7C4A] tabular-nums">${inStockCount}</span>
          </div>
        </div>

        <div class="glass-card p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-white/70 transition" data-quick-filter="Low Stock">
          <div class="w-10 h-10 rounded-xl bg-[#FDF7ED] border border-[#F6E1C5] flex items-center justify-center text-[#C2822B] shrink-0">
            ${getIconSvg('alert-triangle', 'w-5 h-5')}
          </div>
          <div>
            <span class="text-[11px] text-[#77716D] font-medium block">Low Stock</span>
            <span class="text-xl font-bold text-[#C2822B] tabular-nums">${lowStockCount}</span>
          </div>
        </div>

        <div class="glass-card p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-white/70 transition" data-quick-filter="Out of Stock">
          <div class="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            ${getIconSvg('x', 'w-5 h-5')}
          </div>
          <div>
            <span class="text-[11px] text-[#77716D] font-medium block">Out of Stock</span>
            <span class="text-xl font-bold text-rose-600 tabular-nums">${outOfStockCount}</span>
          </div>
        </div>

        <div class="glass-card p-3.5 rounded-2xl flex items-center gap-3 bg-gradient-to-br from-white/80 to-[#FDF8F3] border border-[#F1E0CC]/80">
          <div class="w-10 h-10 rounded-xl bg-[#FBF5ED] border border-[#F3E2CE] flex items-center justify-center text-[#8C5C26] shrink-0">
            ${getIconSvg('chart-bar', 'w-5 h-5 text-[#8C5C26]')}
          </div>
          <div>
            <span class="text-[11px] text-[#77716D] font-medium block">Pantry Value</span>
            <span class="text-xl font-bold text-[#8C5C26] tabular-nums">${formatZAR(totalPantryValue)}</span>
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
                 class="w-full pl-3 pr-8 py-2 text-xs rounded-xl glass-card focus:outline-none focus:ring-1 focus:ring-[#D9A441] text-[#25221F]" />
        </div>

        <!-- Filter and Sort Controls -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Stock Filter Tabs -->
          <div class="flex items-center gap-1 glass-card p-1 rounded-xl">
            ${['All', 'In Stock', 'Low Stock', 'Out of Stock']
              .map(
                (st) => `
              <button data-status="${st}" 
                      class="btn-status-filter px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                        this.filterStatus === st
                          ? 'bg-[#25221F] text-white shadow-2xs'
                          : 'text-[#77716D] hover:text-[#25221F]'
                      }">
                ${st}
              </button>
            `
              )
              .join('')}
          </div>

          <!-- Location Selector -->
          <select id="select-inventory-location" class="glass-card px-3 py-1.5 rounded-xl text-xs text-[#25221F] border border-white/80 focus:outline-none cursor-pointer">
            <option value="All" ${this.filterLocation === 'All' ? 'selected' : ''}>All Locations</option>
            <option value="Fridge" ${this.filterLocation === 'Fridge' ? 'selected' : ''}>Fridge</option>
            <option value="Pantry" ${this.filterLocation === 'Pantry' ? 'selected' : ''}>Pantry</option>
            <option value="Freezer" ${this.filterLocation === 'Freezer' ? 'selected' : ''}>Freezer</option>
            <option value="Spice Rack" ${this.filterLocation === 'Spice Rack' ? 'selected' : ''}>Spice Rack</option>
            <option value="Counter" ${this.filterLocation === 'Counter' ? 'selected' : ''}>Counter</option>
          </select>

          <!-- Sort Selector with Price & Value Options -->
          <select id="select-inventory-sort" class="glass-card px-3 py-1.5 rounded-xl text-xs text-[#25221F] border border-white/80 focus:outline-none cursor-pointer">
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
      <div class="glass-card rounded-2xl border border-white/80 shadow-xs mb-8 overflow-hidden">
        <div class="overflow-x-auto w-full">
          <table class="w-full text-left border-collapse text-xs">
            <thead class="sticky top-0 bg-[#FBF7F2]/95 backdrop-blur-md z-10 border-b border-[#25221F]/10 shadow-2xs">
              <tr class="text-[#77716D] font-medium">
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
                            <span class="w-1.5 h-1.5 rounded-full bg-[#4A7C4A]"></span>
                            In Stock
                          </span>`;
                        } else if (status === 'Low Stock') {
                          statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FDF4E7] text-[#B87A24] border border-[#F6DEBD]">
                            <span class="w-1.5 h-1.5 rounded-full bg-[#C2822B]"></span>
                            Low Stock
                          </span>`;
                        } else {
                          statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Out of Stock
                          </span>`;
                        }

                        const lastUsedStr = item.lastUsedAt
                          ? new Date(item.lastUsedAt).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
                          : '<span class="text-[#77716D]/50 italic">Never used</span>';

                        const stockVal = getItemStockValue(item);

                        return `
                    <tr class="hover:bg-white/40 transition group">
                      <!-- Name & Category -->
                      <td class="py-3 px-4">
                        <div class="flex flex-col">
                          <span class="font-semibold text-[#25221F] text-sm">${item.name}</span>
                          <span class="text-[11px] text-[#77716D]">${item.category}${item.notes ? ` · ${item.notes}` : ''}</span>
                        </div>
                      </td>

                      <!-- Quantity with Quick Stepper -->
                      <td class="py-3 px-4">
                        <div class="flex items-center gap-2">
                          <button class="btn-quick-qty w-6 h-6 rounded-lg bg-white/70 hover:bg-white border text-[#77716D] hover:text-[#25221F] flex items-center justify-center cursor-pointer transition shadow-2xs" 
                                   data-id="${item.id}" data-action="dec" title="Deduct 1 ${item.unit}">
                            ${getIconSvg('minus', 'w-3 h-3')}
                          </button>
                          <span class="font-bold text-[#25221F] tabular-nums text-sm min-w-[50px] text-center">
                            ${formatSmartQuantity(item.quantity, item.unit)}
                          </span>
                          <button class="btn-quick-qty w-6 h-6 rounded-lg bg-white/70 hover:bg-white border text-[#77716D] hover:text-[#25221F] flex items-center justify-center cursor-pointer transition shadow-2xs" 
                                   data-id="${item.id}" data-action="inc" title="Add 1 ${item.unit}">
                            ${getIconSvg('plus', 'w-3 h-3')}
                          </button>
                        </div>
                      </td>

                      <!-- Unit Price (e.g. per kg/g or per L/ml) -->
                      <td class="py-3 px-4">
                        <div class="flex flex-col">
                          <span class="font-semibold text-[#25221F] tabular-nums text-xs">
                            ${formatPriceRate(item.price, item.priceUnit, true)}
                          </span>
                        </div>
                      </td>

                      <!-- Calculated Stock Value -->
                      <td class="py-3 px-4">
                        <span class="font-bold text-[#8C5C26] tabular-nums text-xs">
                          ${formatZAR(stockVal)}
                        </span>
                      </td>

                      <!-- Status -->
                      <td class="py-3 px-4">
                        ${statusBadge}
                      </td>

                      <!-- Min Stock Level -->
                      <td class="py-3 px-4 text-[#77716D] tabular-nums">
                        ${formatSmartQuantity(item.minStockLevel, item.unit)}
                      </td>

                      <!-- Location -->
                      <td class="py-3 px-4 text-[#25221F]">
                        <span class="px-2 py-0.5 rounded-md bg-white/60 border border-white/80 text-[11px] font-medium">
                          ${item.location}
                        </span>
                      </td>

                      <!-- Last Used -->
                      <td class="py-3 px-4 text-[#77716D]">
                        ${lastUsedStr}
                      </td>

                      <!-- Actions -->
                      <td class="py-3 px-4 text-right">
                        <div class="flex items-center justify-end gap-1.5">
                          <button class="btn-item-history p-1.5 rounded-lg text-[#8C5C26] hover:bg-white/80 cursor-pointer transition" 
                                  title="View Item History" data-id="${item.id}">
                            ${getIconSvg('history', 'w-3.5 h-3.5')}
                          </button>
                          <button class="btn-item-edit p-1.5 rounded-lg text-[#77716D] hover:text-[#25221F] hover:bg-white/80 cursor-pointer transition" 
                                  title="Edit Ingredient" data-id="${item.id}">
                            ${getIconSvg('edit', 'w-3.5 h-3.5')}
                          </button>
                          <button class="btn-item-delete p-1.5 rounded-lg text-[#77716D] hover:text-rose-600 hover:bg-white/80 cursor-pointer transition" 
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
