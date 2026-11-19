import { TransactionType } from './InventoryTransaction';

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export type StorageLocation = 'Pantry' | 'Fridge' | 'Freezer' | 'Spice Rack' | 'Counter';

export type IngredientCategory =
  | 'Produce'
  | 'Meat & Poultry'
  | 'Dairy & Eggs'
  | 'Pantry'
  | 'Bakery'
  | 'Spices & Condiments'
  | 'Other';

export type IngredientActivityType = TransactionType | 'Details Updated';

export interface IngredientInventory {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minStockLevel: number;
  location: StorageLocation;
  category: IngredientCategory;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  lastUsedAt?: string; // ISO date (last meal cooking usage)
  lastActivityAt?: string; // ISO date (most recent activity of any type)
  lastActivityType?: IngredientActivityType;
  lastActivitySummary?: string; // Concise summary, e.g. "Used -400 g · Beef Stew"
  notes?: string;
  unitCostZAR?: number;
  price?: number; // Price in ZAR (R)
  priceUnit?: string; // e.g. 'kg' | 'g' | 'L' | 'ml' | 'piece'
}

/**
 * Calculates stock status dynamically from quantity and minStockLevel.
 * Per specification: Do not manually store the stock status.
 */
export function calculateStockStatus(quantity: number, minStockLevel: number): StockStatus {
  if (quantity <= 0) {
    return 'Out of Stock';
  }
  if (quantity <= minStockLevel) {
    return 'Low Stock';
  }
  return 'In Stock';
}
