# MealWeek — Apple-Inspired Weekly Meal Planning & Pantry PWA

**MealWeek** is a weekly meal planning, recipe scaling, and household food inventory Progressive Web Application (PWA). It features an Apple-inspired warm luxury glassmorphism interface and is built in **pure Vanilla TypeScript** with **Tailwind CSS**, running completely client-side with **IndexedDB** local persistence and offline service worker caching.

---

## 🌟 Quick Overview: How It Works

MealWeek connects every step of your household food workflow into an automated, closed-loop system:

```
┌────────────────────────────────────────────────────────┐
│                   1. Weekly Plan                       │
│   Schedule Breakfast & Dinner (Mon - Sun) from Recipes │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│               2. Dynamic Serving Scaling               │
│   Adjust portions (e.g. 4 → 6 servings);              │
│   Ingredients dynamically scale in real-time           │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│               3. Smart Shopping List                   │
│   To Buy = max(0, Planned Ingredients - In Pantry)     │
│   Check off items & restock into Pantry Inventory      │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             4. "Mark as Cooked" & Deduct               │
│   Review required ingredients vs. available stock;     │
│   Deduct exact amounts and log audit history           │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                 5. Undo & Reversal                     │
│   Easily undo any meal completion;                     │
│   Deducted stock is safely restored to inventory       │
└────────────────────────────────────────────────────────┘
```

---

## 🧭 Navigation & Core Modules

### 1. Weekly Plan (`/src/pages/WeeklyPlanPage.ts`)
- **Central Timetable**: 7 horizontal cards representing Monday through Sunday.
- **Breakfast & Dinner Slots**: Each day features dedicated morning (sun) and evening (moon) meals with dish photography.
- **Recipe Inspection**: Clicking any meal immediately loads the dish into the right-hand **Recipe Detail Panel**.
- **Assign New Meals**: Click the arrow (`>`) on any day card to switch the dish via the **Assign Meal** modal.
- **Week Navigator**: Switch between past, current, and future weeks using `<` and `>` or the week selector dropdown.
- **Weekly Meal Budget**: Bottom glass card displays the estimated total cost (e.g. `R1,250.00`), planned meal count, and daily average.

### 2. Recipe Detail Panel (`/src/components/RecipePanel.ts`)
- **Culinary Hero Image**: Studio food photography showcasing the selected dish.
- **Serving Stepper**: Use `-` and `+` to change household servings. Ingredient quantities instantly calculate using proportional scaling:
  $$\text{Scaled Quantity} = \text{Base Quantity} \times \left(\frac{\text{Target Servings}}{\text{Base Servings}}\right)$$
- **Portion-Aware Ingredients**: Units adapt automatically (e.g. `800 g` scales up to `1.2 kg`).
- **Mark as Cooked**: Opens the stock deduction confirmation workflow.
- **Undo Action**: If a meal was marked as cooked by mistake, click `Undo` to restore your inventory instantly.

### 3. AI-Powered Recipe Creator & Ingredients Auto-Fill
- **Type Any Recipe Name**: When creating a new dish in the Recipe Library or weekly planner, simply type the title (e.g. *"Spaghetti Carbonara"*, *"Beef Lasagna"*, *"Shakshuka"*, *"Blueberry Protein Pancakes"*).
- **✨ 1-Click AI Auto-Fill**: Tap **"Auto-Fill Ingredients"** (or hit Enter).
- **Automated Recipe Generation**: Powered by **Gemini 3.8 Flash**, the AI instantly populates:
  - Complete culinary ingredients list with accurate quantities and units (e.g. `g`, `ml`, `medium`, `pieces`, `cloves`).
  - Automatically scaled to the selected serving size.
  - Appetizing recipe description.
  - Recommended meal category (*Breakfast*, *Lunch*, or *Dinner*).
  - Best matching culinary image from the photo catalog.
- **Full Customizability**: Users can freely fine-tune quantities, add ingredients, or delete any item before saving.

### 4. Ingredients Inventory (`/src/pages/IngredientsPage.ts`)
- **KPI Metrics**: Real-time counters for **Total Items**, **In Stock**, **Low Stock**, and **Out of Stock**.
- **Dynamic Stock Status**: Never stored statically; calculated live:
  - **In Stock**: Quantity > Minimum Stock Level.
  - **Low Stock**: $0 < \text{Quantity} \le \text{Minimum Stock Level}$.
  - **Out of Stock**: Quantity = 0.
- **Storage Locations**: Categorize ingredients by *Fridge*, *Pantry*, *Freezer*, *Spice Rack*, or *Counter*.
- **Quick Steppers**: Adjust inventory counts directly with inline `+` and `-` buttons.
- **Activity Audit Trail**: Click **Activity History** to see every purchase, cooking deduction, manual edit, and reversal with timestamps.

### 4. Smart Shopping List (`/src/pages/ShoppingListPage.ts`)
- Aggregates all ingredients required across the entire week's planned meals.
- Compares required amounts with what you already have in your pantry:
  - If you already have enough, the item displays a green **"In Pantry"** badge to prevent duplicate purchases.
  - If you are short, it highlights the exact quantity you need to purchase.
- **Restock Directly**: When you return from the store, check off items and click **`+ Stock`** or **"Restock All Purchased"** to add them straight into your pantry inventory.

### 5. Settings (`/src/pages/SettingsPage.ts`)
- Configure default household portion sizes.
- Set preferred currency (`ZAR (R)`, `USD ($)`, `EUR (€)`, `GBP (£)`).
- PWA installation management and sample data reset.

---

## 🏗️ Codebase Structure

All application source code is written in modular, typed Vanilla TypeScript located in `/src`:

```
/
├── index.html                  # HTML entry point, fonts & PWA meta tags
├── vite.config.ts              # Vite configuration with Tailwind CSS & VitePWA
├── metadata.json               # AI Studio app metadata
├── docs/
│   ├── MEALWEEK_DOCUMENTATION.md # Comprehensive system manual
│   └── HOW_THE_APP_WORKS.md     # Detailed user & architectural guide
├── public/
│   ├── icon.svg                # Chef hat SVG brand logo
│   ├── pwa-192x192.png         # PWA app icon (192px)
│   ├── pwa-512x512.png         # PWA app icon (512px)
│   └── apple-touch-icon.png    # iOS touch icon
└── src/
    ├── main.ts                 # Application bootstrapping & PWA registration
    ├── index.css               # Tailwind v4 import & CSS custom properties
    ├── app/
    │   ├── App.ts              # Root view layout coordinator
    │   └── state.ts            # Global reactive state store & event dispatcher
    ├── components/
    │   ├── Sidebar.ts          # Left brand sidebar & navigation pills
    │   ├── WeeklyHeader.ts     # Timetable header & week switcher
    │   ├── DayCard.ts          # Monday–Sunday glassmorphism day cards
    │   ├── BudgetSummary.ts    # Weekly cost & meal statistics card
    │   ├── RecipePanel.ts      # Right interactive recipe detail drawer
    │   └── Modal.ts            # Modals: Cook & Deduct, Restock, Edit Recipe
    ├── pages/
    │   ├── WeeklyPlanPage.ts   # Weekly meal timetable page
    │   ├── RecipesPage.ts      # Recipe library with category filters & search
    │   ├── IngredientsPage.ts  # Pantry inventory management dashboard
    │   ├── ShoppingListPage.ts # Smart pantry-compared grocery list
    │   └── SettingsPage.ts     # User & household preferences
    ├── models/
    │   ├── Recipe.ts           # Recipe and ingredient definitions
    │   ├── PlannedMeal.ts      # Scheduled meal status (planned/cooking/cooked/skipped)
    │   ├── WeeklyPlan.ts       # Week schedule structure & budgets
    │   ├── IngredientInventory.ts # Stock levels, units, storage locations
    │   ├── InventoryTransaction.ts# Audit transactions (purchase, usage, reversal)
    │   └── MealCompletion.ts   # Completion records and deduction breakdowns
    ├── services/
    │   ├── storageService.ts   # IndexedDB database wrapper with localStorage fallback
    │   ├── recipeService.ts    # Default recipe catalog and custom recipe CRUD
    │   ├── inventoryService.ts # Inventory CRUD, atomic deduction, reversals
    │   ├── mealPlanService.ts  # Schedule planning and weekly budget calculations
    │   └── ingredientService.ts# Ingredient aggregation & pantry comparisons
    ├── utils/
    │   ├── unitConversion.ts   # g, kg, ml, L, pieces normalization
    │   ├── ingredientScaling.ts# Dynamic portion scaling formulas
    │   ├── dateUtils.ts        # Monday–Sunday date helpers
    │   └── iconHelper.ts       # Lucide-style SVG icon system
    └── styles/
        ├── variables.css       # Ivory, cream, champagne, and gold design tokens
        ├── glassmorphism.css   # Translucent glass panels, cards, and buttons
        ├── global.css          # Background lighting gradients and typography
        └── responsive.css      # Desktop, tablet, and mobile breakpoints
```

---

## 🔒 Data Safety & Offline PWA Capabilities

1. **Persistent Local Database**: All data is stored in the browser's IndexedDB (`MealWeekDB`, version 2). Your recipes, plans, inventory, and transaction history persist across reloads and browser sessions.
2. **Offline Ready**: Powered by Service Worker caching via `vite-plugin-pwa`. If your device loses internet connectivity, MealWeek continues running seamlessly offline.
3. **Installable Desktop/Mobile App**: Click the **"Install App"** button in the sidebar (or use your browser's install icon) to add MealWeek as a standalone desktop app or mobile home screen application.
4. **Duplicate Deduction Protection**: Meals cannot be deducted multiple times. Completing a meal locks its status, and clicking "Undo" restores the exact ingredient quantities via an auditable reversal transaction.
