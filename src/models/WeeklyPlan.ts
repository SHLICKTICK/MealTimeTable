import { PlannedMeal } from './PlannedMeal';

export interface DayPlan {
  dayIndex: number;
  dayName: string;
  dateStr: string; // e.g. "Apr 21"
  fullDate: string; // e.g. "2026-04-21"
  breakfast: PlannedMeal | null;
  dinner: PlannedMeal | null;
}

export interface WeeklyPlan {
  id: string; // week key like "2026-W17"
  startDate: string; // ISO string
  endDate: string; // ISO string
  label: string; // e.g. "Monday – Sunday"
  days: DayPlan[];
  estimatedBudgetZAR: number;
}
