import { PlannedMeal, MealCookingStatus } from '../models/PlannedMeal';
import { WeeklyPlan, DayPlan } from '../models/WeeklyPlan';
import { getWeekDates } from '../utils/dateUtils';
import { recipeService } from './recipeService';
import { storageService, STORES } from './storageService';
import { inventoryService } from './inventoryService';
import { ingredientCatalogService } from './ingredientCatalogService';
import { calculateRecipeCostBreakdown } from '../utils/pricingUtils';

class MealPlanService {
  private currentWeekOffset: number = 0;
  private currentPlan: WeeklyPlan | null = null;

  async getWeekPlan(weekOffset: number = 0, referenceDate: Date = new Date()): Promise<WeeklyPlan> {
    this.currentWeekOffset = weekOffset;
    const { weekId, startDate, endDate, dayDates } = getWeekDates(weekOffset, referenceDate);

    // Try loading saved locked-in plan for this Monday–Sunday week
    const stored = await storageService.get<WeeklyPlan>(STORES.WEEKLY_PLANS, weekId);
    if (stored) {
      // Ensure existing saved meals have status defined and day labels stay synced
      stored.days.forEach((day, idx) => {
        if (day.breakfast && !day.breakfast.status) day.breakfast.status = 'planned';
        if (day.dinner && !day.dinner.status) day.dinner.status = 'planned';
        if (dayDates[idx]) {
          day.dayName = dayDates[idx].dayName;
          day.dateStr = dayDates[idx].dateStr;
          day.fullDate = dayDates[idx].fullDate;
        }
      });
      const prevBudget = stored.estimatedBudgetZAR;
      await this.recalculateBudget(stored);
      if (Math.abs(prevBudget - stored.estimatedBudgetZAR) > 0.01) {
        await storageService.set(STORES.WEEKLY_PLANS, stored);
      }
      this.currentPlan = stored;
      return stored;
    }

    // Initialize a new Monday–Sunday plan using household default servings (if configured)
    const savedDefaultServings = await storageService.get<{ key: string; value: number }>(
      STORES.SETTINGS,
      'defaultServings'
    );
    const preferredServings =
      savedDefaultServings && typeof savedDefaultServings.value === 'number' && savedDefaultServings.value >= 1
        ? Math.max(1, Math.min(20, Math.round(savedDefaultServings.value)))
        : null;

    const allRecipes = await recipeService.getAllRecipes();
    const recipeMap = new Map(allRecipes.map((r) => [r.id, r]));

    // Default weekly template
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
            servings: preferredServings ?? bRec.servings,
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
            servings: preferredServings ?? dRec.servings,
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
      estimatedBudgetZAR: 0,
    };

    await this.recalculateBudget(newPlan);
    await storageService.set(STORES.WEEKLY_PLANS, newPlan);
    this.currentPlan = newPlan;
    return newPlan;
  }

  async assignMeal(
    weekId: string,
    dayIndex: number,
    mealType: 'breakfast' | 'dinner',
    recipeId: string,
    servings?: number
  ): Promise<WeeklyPlan> {
    const plan = (await storageService.get<WeeklyPlan>(STORES.WEEKLY_PLANS, weekId)) || (await this.getWeekPlan(this.currentWeekOffset));
    const recipe = await recipeService.getRecipeById(recipeId);
    if (!recipe || !plan.days[dayIndex]) return plan;

    const cleanServings = servings && servings >= 1 ? Math.round(servings) : recipe.servings;
    const plannedMeal: PlannedMeal = {
      id: `plan-${weekId}-${dayIndex}-${mealType}`,
      dayIndex,
      mealType,
      recipeId: recipe.id,
      title: recipe.title,
      imageUrl: recipe.imageUrl,
      servings: cleanServings,
      status: 'planned',
    };

    plan.days[dayIndex][mealType] = plannedMeal;
    await this.recalculateBudget(plan);

    await storageService.set(STORES.WEEKLY_PLANS, plan);
    this.currentPlan = plan;
    return plan;
  }

  async updateMealServings(
    weekId: string,
    dayIndex: number,
    mealType: 'breakfast' | 'dinner',
    servings: number
  ): Promise<WeeklyPlan> {
    const plan = (await storageService.get<WeeklyPlan>(STORES.WEEKLY_PLANS, weekId)) || (await this.getWeekPlan(this.currentWeekOffset));
    if (plan.days[dayIndex] && plan.days[dayIndex][mealType]) {
      const cleanServings = Math.max(1, Math.min(20, Math.round(servings)));
      plan.days[dayIndex][mealType]!.servings = cleanServings;
      await this.recalculateBudget(plan);
      await storageService.set(STORES.WEEKLY_PLANS, plan);
      this.currentPlan = plan;
    }
    return plan;
  }

  async applyServingsToWeek(weekId: string, servings: number): Promise<WeeklyPlan> {
    const plan = (await storageService.get<WeeklyPlan>(STORES.WEEKLY_PLANS, weekId)) || (await this.getWeekPlan(this.currentWeekOffset));
    const cleanServings = Math.max(1, Math.min(20, Math.round(servings)));
    for (const day of plan.days) {
      if (day.breakfast) day.breakfast.servings = cleanServings;
      if (day.dinner) day.dinner.servings = cleanServings;
    }
    await this.recalculateBudget(plan);
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
      await this.recalculateBudget(plan);
      await storageService.set(STORES.WEEKLY_PLANS, plan);
      this.currentPlan = plan;
    }
    return plan;
  }

  async refreshPlanBudget(weekOffset?: number): Promise<WeeklyPlan> {
    const offset = weekOffset ?? this.currentWeekOffset;
    const plan = await this.getWeekPlan(offset);
    await this.recalculateBudget(plan);
    await storageService.set(STORES.WEEKLY_PLANS, plan);
    this.currentPlan = plan;
    return plan;
  }

  async recalculateBudget(plan: WeeklyPlan): Promise<void> {
    await Promise.all([
      recipeService.init(),
      inventoryService.init(),
      ingredientCatalogService.init(),
    ]);

    const allRecipes = await recipeService.getAllRecipes();
    const recipeMap = new Map(allRecipes.map((r) => [r.id, r]));
    const inventoryList = inventoryService.getLoadedIngredients();
    const catalogList = ingredientCatalogService.getLoadedCatalog();

    let totalWeeklyCost = 0;

    for (const day of plan.days) {
      for (const meal of [day.breakfast, day.dinner]) {
        if (!meal) continue;
        const recipe = recipeMap.get(meal.recipeId);
        if (!recipe) continue;

        const baseServings = recipe.servings || 4;
        const targetServings = meal.servings || baseServings;
        const ratio = targetServings / baseServings;
        const breakdown = calculateRecipeCostBreakdown(
          recipe.ingredients,
          inventoryList,
          ratio,
          catalogList,
          baseServings
        );
        totalWeeklyCost += breakdown.totalCost;
      }
    }

    plan.estimatedBudgetZAR = Math.round(totalWeeklyCost * 100) / 100;
  }

  async resetWeek(weekOffset: number = 0): Promise<WeeklyPlan> {
    const { weekId } = getWeekDates(weekOffset);
    await storageService.remove(STORES.WEEKLY_PLANS, weekId);
    return this.getWeekPlan(weekOffset);
  }
}

export const mealPlanService = new MealPlanService();
