export type TransactionType =
  | 'Purchase'
  | 'Meal Usage'
  | 'Manual Adjustment'
  | 'Waste'
  | 'Reversal';

export interface InventoryTransaction {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantityChange: number; // positive = added, negative = deducted
  unit: string;
  type: TransactionType;
  timestamp: string; // ISO date
  mealCompletionId?: string;
  mealTitle?: string;
  notes?: string;
}
