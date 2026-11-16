import { FoodGroup } from '../utils/iconHelper';
import { IngredientCategory, StorageLocation } from './IngredientInventory';

export type MasterPriceUnit = 'kg' | 'g' | 'L' | 'ml' | 'piece' | 'can' | 'pack';

export interface MasterIngredient {
  id: string;
  name: string;
  aliases: string[];
  foodGroup: FoodGroup;
  category: IngredientCategory;
  defaultLocation: StorageLocation;
  defaultUnit: string;
  referencePriceZAR: number;
  priceUnit: MasterPriceUnit;
  /** Average weight in grams per discrete unit (e.g., 1 egg = 55g, 1 medium onion = 120g) */
  avgGramsPerUnit?: number;
  /** Average volume in milliliters per discrete unit */
  avgMlPerUnit?: number;
  updatedAt: string;
}
