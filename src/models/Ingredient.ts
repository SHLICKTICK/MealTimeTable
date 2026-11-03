export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: 'Produce' | 'Meat & Poultry' | 'Dairy & Eggs' | 'Pantry' | 'Bakery' | 'Spices & Condiments' | 'Other';
  purchased?: boolean;
  unitCostZAR?: number;
}
