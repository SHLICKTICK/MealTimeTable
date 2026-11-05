export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: 'Produce' | 'Meat & Poultry' | 'Dairy & Eggs' | 'Pantry' | 'Bakery' | 'Spices & Condiments' | 'Other';
  purchased?: boolean;
  unitCostZAR?: number;
  price?: number; // e.g. 85.00
  priceUnit?: string; // e.g. 'kg' | 'g' | 'L' | 'ml' | 'piece'
}
