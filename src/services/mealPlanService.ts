import { PlannedMeal, MealCookingStatus } from '../models/PlannedMeal';
import { WeeklyPlan, DayPlan } from '../models/WeeklyPlan';
import { getWeekDates } from '../utils/dateUtils';
import { recipeService } from './recipeService';
import { storageService, STORES } from './storageService';

class MealPlanService {
  private currentWeekOffset: number = 0;
  private currentPlan: WeeklyPlan | null = null;

  async getWeekPlan(weekOffset: number = 0): Promise<WeeklyPlan> {
    this.currentWeekOffset = weekOffset;
    const { weekId, startDate, endDate, dayDates } = getWeekDates(weekOffset);

    // Try loading saved plan
    const stored = await storageService.get<WeeklyPlan>(STORES.WEEKLY_PLANS, weekId);
    if (stored) {
      // Ensure existing saved meals have status defined
      stored.days.forEach((day) => {
        if (day.breakfast && !day.breakfast.status) day.breakfast.status = 'planned';
        if (day.dinner && !day.dinner.status) day.dinner.status = 'planned';
      });
      this.currentPlan = stored;
      return stored;
    }

    // If offset is 0 (reference week), generate the reference plan matching screenshot
    const allRecipes = await recipeService.getAllRecipes();
    const recipeMap = new Map(allRecipes.map((r) => [r.id, r]));

    // Reference week setup
    const defaultMealAssignments: { bId: string; dId: string }[] = [
      { bId: 'rec-oats-berries', dId: 'rec-chicken-rice' }, // Mon
      { bId: 'rec-scrambled-eggs', dId: 'rec-beef-stew' }, // Tue
      { bId: 'rec-pancakes', dId: 'rec-pasta-primavera' }, // Wed
      { bId: 'rec-greek-yogurt', dId: 'rec-grilled-chicken' }, // Thu
      { bId: 'rec-breakfast-sandwich', dId: 'rec-burgers' }, // Fri
      { bId: 'rec-french-toast', dId: 'rec-roast-chicken' }, // Sat
      { bId: 'rec-muffins-fruit', dId: 'rec-pap-stew' }, // Sun
    ];

    const days: DayPlan[] = dayDates.map((dayDate, index) => {
      const assignment = defaultMealAssignments[index % defaultMealAssignments.length];
      
      let breakfast: PlannedMeal | null = null;
      let dinner: PlannedMeal | null = null;

      if (assignment) {
        const bRec = recipeMap.get(assignment.bId);
        if (bRec) {
          breakfast = {
            id: `plan-${weekId}-${index}-breakfast`,
            dayIndex: index,
            mealType: 'breakfast',
            recipeId: bRec.id,
            title: bRec.title,
            imageUrl: bRec.imageUrl,
            servings: bRec.servings,
            status: 'planned',
          };
        }

        const dRec = recipeMap.get(assignment.dId);
        if (dRec) {
          dinner = {
            id: `plan-${weekId}-${index}-dinner`,
            dayIndex: index,
            mealType: 'dinner',
            recipeId: dRec.id,
            title: dRec.title,
            imageUrl: dRec.imageUrl,
            servings: dRec.servings,
            status: 'planned',
          };
        }
      }

      return {
        dayIndex: index,
        dayName: dayDate.dayName,
        dateStr: dayDate.dateStr,
        fullDate: dayDate.fullDate,
        breakfast,
        dinner,
      };
    });

    const newPlan: WeeklyPlan = {
      id: weekId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      label: 'Monday – Sunday',
      days,
      estimatedBudgetZAR: 1250.0,
    };

    await storageService.set(STORES.WEEKLY_PLANS, newPlan);
    this.currentPlan = newPlan;
    return newPlan;
  }

  async assignMeal(weekId: string, dayIndex: number, mealType: 'breakfast' | 'dinner', recipeId: string): Promise<WeeklyPlan> {
    const plan = (await storageService.get<WeeklyPlan>(STORES.WEEKLY_PLANS, weekId)) || (await this.getWeekPlan(this.currentWeekOffset));
    const recipe = await recipeService.getRecipeById(recipeId);
    if (!recipe || !plan.days[dayIndex]) return plan;

    const plannedMeal: PlannedMeal = {
      id: `plan-${weekId}-${dayIndex}-${mealType}`,
      dayIndex,
      mealType,
      recipeId: recipe.id,
      title: recipe.title,
      imageUrl: recipe.imageUrl,
      servings: recipe.servings,
      status: 'planned',
    };

    plan.days[dayIndex][mealType] = plannedMeal;
    this.recalculateBudget(plan);

    await storageService.set(STORES.WEEKLY_PLANS, plan);
    this.currentPlan = plan;
    return plan;
  }

  async updateMealStatus(
    weekId: string,
    dayIndex: number,
    mealType: 'breakfast' | 'dinner',
    status: MealCookingStatus,
    completionId?: string
  ): Promise<WeeklyPlan> {
    const plan = (await storageService.get<WeeklyPlan>(STORES.WEEKLY_PLANS, weekId)) || (await this.getWeekPlan(this.currentWeekOffset));
    if (plan.days[dayIndex] && plan.days[dayIndex][mealType]) {
      const meal = plan.days[dayIndex][mealType]!;
      meal.status = status;
      if (completionId !== undefined) {
        meal.completionId = completionId;
      }
      await storageService.set(STORES.WEEKLY_PLANS, plan);
      this.currentPlan = plan;
    }
    return plan;
  }

  async removeMeal(weekId: string, dayIndex: number, mealType: 'breakfast' | 'dinner'): Promise<WeeklyPlan> {
    const plan = (await storageService.get<WeeklyPlan>(STORES.WEEKLY_PLANS, weekId)) || (await this.getWeekPlan(this.currentWeekOffset));
    if (plan.days[dayIndex]) {
      plan.days[dayIndex][mealType] = null;
      this.recalculateBudget(plan);
      await storageService.set(STORES.WEEKLY_PLANS, plan);
      this.currentPlan = plan;
    }
    return plan;
  }

  private recalculateBudget(plan: WeeklyPlan): void {
    let dinnersCount = 0;
    plan.days.forEach((d) => {
      if (d.dinner) dinnersCount++;
    });

    if (dinnersCount === 7) {
      plan.estimatedBudgetZAR = 1250.0;
    } else {
      plan.estimatedBudgetZAR = Math.round(dinnersCount * 178.57 * 100) / 100;
    }
  }

  async resetWeek(weekOffset: number = 0): Promise<WeeklyPlan> {
    const { weekId } = getWeekDates(weekOffset);
    await storageService.remove(STORES.WEEKLY_PLANS, weekId);
    return this.getWeekPlan(weekOffset);
  }
}

export const mealPlanService = new MealPlanService();
