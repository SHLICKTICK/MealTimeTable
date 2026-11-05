# How MealWeek Works — Complete User & System Guide

Welcome to **MealWeek**, an Apple-inspired weekly meal planner and pantry inventory Progressive Web Application (PWA).

This guide walks you through every feature of the application, how the system works behind the scenes, and how each component coordinates to keep your weekly meals and household pantry organized.

---

## Table of Contents
1. [The Big Picture: Closed-Loop Food Management](#1-the-big-picture-closed-loop-food-management)
2. [Step-by-Step User Journey](#2-step-by-step-user-journey)
   - [Planning Your Week](#step-1-planning-your-week)
   - [Inspecting & Scaling Recipes](#step-2-inspecting--scaling-recipes)
   - [Generating Your Smart Shopping List](#step-3-generating-your-smart-shopping-list)
   - [Managing the Household Pantry](#step-4-managing-the-household-pantry)
   - [Cooking a Meal & Deducting Stock](#step-5-cooking-a-meal--deducting-stock)
   - [Undoing a Meal Completion](#step-6-undoing-a-meal-completion)
3. [Under the Hood: Technical Architecture](#3-under-the-hood-technical-architecture)
   - [Pure Vanilla TypeScript (Zero Frameworks)](#pure-vanilla-typescript)
   - [Dynamic Serving Scaling Math](#dynamic-serving-scaling-math)
   - [Smart Unit Conversion Engine](#smart-unit-conversion-engine)
   - [Calculated Stock Status (No Static Desyncs)](#calculated-stock-status)
   - [Audit Trail & Inventory Transactions](#audit-trail--inventory-transactions)
   - [Local Database Storage (IndexedDB)](#local-database-storage-indexeddb)
   - [Offline PWA & Service Worker](#offline-pwa--service-worker)
4. [File & Component Directory Reference](#4-file--component-directory-reference)

---

## 1. The Big Picture: Closed-Loop Food Management

Traditional meal planners are separate from grocery lists, and grocery lists are separate from what's actually sitting in your fridge. MealWeek unites these into one continuous cycle:

```
┌────────────────────────────────────────────────────────┐
│                   1. Weekly Plan                       │
│   Schedule Breakfast & Dinner for Monday to Sunday     │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│               2. Dynamic Portion Scaling               │
│   Scale portions (e.g., 4 to 6 people) with one click;  │
│   Ingredients automatically recompute                  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│               3. Smart Shopping List                   │
│   Compares what recipes need vs. what's in stock.      │
│   Tells you EXACTLY what to buy (no overbuying!)       │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             4. "Mark as Cooked" & Deduct               │
│   Verify ingredient requirements, deduct used amounts  │
│   from pantry inventory, and record transaction log    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             5. Audit Trail & Undo Safety               │
│   Accidentally clicked Cooked? Undo restores all stock │
│   instantly with an auditable reversal log             │
└────────────────────────────────────────────────────────┘
```

---

## 2. Step-by-Step User Journey

### Step 1: Planning Your Week
- Open the **Weekly Plan** tab from the left sidebar.
- You'll see 7 horizontal day cards representing Monday through Sunday with warm luxury pastel accents.
- Each day has two dedicated slots:
  - ☀️ **Breakfast** (morning meal with dish thumbnail)
  - 🌙 **Dinner** (evening meal with dish thumbnail)
- **Assigning a Different Meal**: Click the chevron (`>`) button on any day to open the **Assign Meal** modal. Choose any dish from your library or create a custom one.
- **Navigating Weeks**: Use the `<` and `>` arrows or click `This Week ⌵` in the header to jump to future or past weeks.
- **Weekly Budget**: At the bottom, a glass summary card displays your estimated weekly cost (in South African Rand `R`, or your chosen currency), meal count, and daily average.

### Step 2: Inspecting & Scaling Recipes
- Click on any planned meal card on your timetable.
- The right-hand **Recipe Detail Panel** smoothly opens with:
  - High-resolution culinary photography.
  - Category pill (e.g., `Dinner`, `Family Classic`, `Quick & Easy`).
  - Cooking time and difficulty level.
  - Interactive **Serving Stepper** (`-` and `+`).
- When you increase or decrease servings (e.g. from 4 to 6 people), the ingredients recompute in real-time. For example:
  - Chicken pieces: `800 g` $\rightarrow$ `1.2 kg`
  - Long grain rice: `400 g` $\rightarrow$ `600 g`
  - Cooking oil: `30 ml` $\rightarrow$ `45 ml`

### Step 2b: Creating New Recipes with AI Ingredients Auto-Fill
- When creating a brand-new recipe (via the **"New Recipe"** button in Recipe Library or when assigning custom dishes):
  1. Simply type the name of the recipe (e.g., *"Spaghetti Carbonara"*, *"Beef Lasagna"*, *"Shakshuka"*, *"Blueberry Protein Pancakes"*, or any dish from any cuisine).
  2. Tap the champagne-gold **"Auto-Fill Ingredients"** button (or press `Enter`).
  3. **Gemini 3.8 Flash** analyzes the recipe title and serving size to automatically:
     - Generate a complete list of required ingredients with accurate quantities and units (`g`, `ml`, `medium`, `pieces`, `cloves`).
     - Write an appetizing description of the dish.
     - Select the recommended meal category (*Breakfast*, *Lunch*, or *Dinner*).
     - Match the best culinary photography from the photo library.
  4. The ingredients list populates immediately in the editor.
  5. You retain complete creative freedom: easily edit any ingredient name, tweak quantities, remove items, or add additional ingredients before clicking **"Save Recipe"**.

### Step 3: Generating Your Smart Shopping List
- Navigate to the **Shopping List** tab in the sidebar.
- The system automatically aggregates all ingredients needed for the entire scheduled week.
- It then inspects your pantry inventory in real-time:
  - **Already in Stock**: If you have enough in your kitchen, it shows a green **"In Pantry"** badge so you don't waste money buying duplicates.
  - **Needs Purchase**: Shows the exact shortfall needed to prepare the planned meals:
    $$\text{To Buy} = \max(0, \text{Required for Week} - \text{In Pantry})$$
- Once you return from grocery shopping:
  - Check the box next to any purchased item.
  - Click **`+ Stock`** on that item (or **"Restock All Purchased"** at the top).
  - The purchased amount is instantly added to your pantry inventory with full duplicate-restock protection.

### Step 4: Managing the Household Pantry
- Navigate to the **Ingredients** tab in the sidebar.
- The top banner provides 4 key summary metrics:
  - **Total Items**
  - **In Stock** (healthy inventory level)
  - **Low Stock** (at or below minimum reorder threshold)
  - **Out of Stock** (depleted)
- **Filter & Search**: Filter by storage location (*Fridge*, *Pantry*, *Freezer*, *Spice Rack*, *Counter*) or search by name.
- **Quick Quantity Steppers**: Increase or decrease stock directly from the table using inline `+` and `-` buttons.
- **Activity History**: Click **"Activity History"** to inspect a full audit log of every purchase, cooking deduction, manual adjustment, and reversal.

### Step 5: Cooking a Meal & Deducting Stock
- When you prepare dinner, open the dish in the right-hand Recipe Panel.
- Click **"Mark as Cooked & Deduct Stock"**.
- A confirmation dialog appears showing:
  - The meal name and serving count.
  - Each required ingredient.
  - Currently available stock in your pantry.
  - Proposed deduction amounts (which you can fine-tune if you used slightly more or less).
  - Projected remaining stock.
- **Shortage Detection**: If your pantry lacks enough of an ingredient, a warning appears specifying the shortfall (e.g., *"Short by 200 g"*), with a convenient **`+ Quick Restock`** button to replenish before cooking.
- Click **"Confirm & Deduct Stock"**:
  1. The meal is marked as `Cooked` with a green badge on the timetable.
  2. Ingredient quantities are atomically deducted from your pantry.
  3. `Meal Usage` transactions are logged in the audit trail.
  4. The Shopping List automatically updates to reflect your new inventory levels.

### Step 6: Undoing a Meal Completion
- If you marked a meal as cooked by mistake, simply click **"Undo"** next to the cooked status badge in the Recipe Panel.
- The system:
  - Reverts the meal status to `Planned`.
  - Automatically restores the deducted ingredient amounts back into inventory.
  - Records an immutable `Reversal` transaction in the activity history.

---

## 3. Under the Hood: Technical Architecture

### Pure Vanilla TypeScript
- **Zero Frontend Frameworks**: MealWeek is built entirely with modern, modular TypeScript rendering directly to the DOM.
- **Why?** Unmatched rendering speed, zero virtual DOM overhead, tiny bundle sizes, and absolute control over DOM updates and glassmorphism styling.
- All state changes flow through a central reactive store (`src/app/state.ts`) with typed event subscribers.

### Dynamic Serving Scaling Math
Every recipe stores a base serving count (e.g., 4 servings) and base ingredient amounts.
When a user changes servings to $S_{\text{target}}$, each ingredient amount is calculated via:

$$\text{Scaled Quantity} = \text{Base Quantity} \times \left( \frac{S_{\text{target}}}{S_{\text{base}}} \right)$$

### Smart Unit Conversion Engine (`src/utils/unitConversion.ts`)
The conversion engine normalizes units across weight, volume, and count:
- **Mass**: Grams (`g`) $\leftrightarrow$ Kilograms (`kg`) [1 kg = 1000 g]
- **Volume**: Milliliters (`ml`) $\leftrightarrow$ Litres (`l`) [1 L = 1000 ml]
- When scaled numbers exceed 1,000 g or 1,000 ml, the UI automatically formats them into `kg` or `L` for clean editorial readability.

### Calculated Stock Status
To eliminate stale data and synchronization bugs, stock status is **never** statically stored in the database. It is computed dynamically via `calculateStockStatus`:

$$\text{Status} = \begin{cases} \text{Out of Stock} & \text{if } \text{Quantity} \le 0 \\ \text{Low Stock} & \text{if } 0 < \text{Quantity} \le \text{MinStockLevel} \\ \text{In Stock} & \text{if } \text{Quantity} > \text{MinStockLevel} \end{cases}$$

### Audit Trail & Inventory Transactions (`src/models/InventoryTransaction.ts`)
Every modification to food stock records an immutable transaction:
- `purchase`: Groceries bought and added to pantry.
- `meal_usage`: Ingredients consumed when preparing a recipe.
- `manual_adjustment`: User updated stock via edit modal or quick stepper.
- `waste`: Food discarded or expired.
- `reversal`: Automatically generated when a cooked meal is undone.

### Local Database Storage (IndexedDB)
MealWeek uses the browser's native **IndexedDB** database (`MealWeekDB`, version 2) via `src/services/storageService.ts`:
- `recipes`: Recipe library, photos, instructions, base ingredients.
- `weekly_plans`: Monday–Sunday schedule, assigned dish IDs, budgets.
- `inventory`: Pantry ingredients, stock levels, units, storage locations.
- `meal_completions`: Meal completion receipts and portion breakdowns.
- `inventory_transactions`: Complete chronological audit history.
- `shopping_list`: Purchased check states and restock flags.
- `settings`: Default household portions and currency selection.

If IndexedDB is temporarily restricted (e.g., private browsing), the application falls back seamlessly to `localStorage`.

### Offline PWA & Service Worker
- Registered using `vite-plugin-pwa` in `vite.config.ts`.
- Precaches all HTML, JavaScript, CSS, SVGs, and food photos during the initial visit.
- Once loaded, the application functions fully offline without an internet connection.
- Supports installation to macOS/Windows desktop and iOS/Android home screens.

---

## 4. File & Component Directory Reference

| Path | Purpose |
| :--- | :--- |
| `/index.html` | Entry point, Apple fonts (*Playfair Display*, *Cormorant Garamond*, *Plus Jakarta Sans*), PWA meta tags |
| `/src/main.ts` | App startup, initializes storage, registers PWA service worker, mounts UI |
| `/src/app/App.ts` | Top-level layout container coordinating sidebar, header, active page, recipe drawer, and modals |
| `/src/app/state.ts` | Central reactive application store with type-safe event dispatching |
| `/src/components/Sidebar.ts` | Left navigation pills, brand chef hat logo, and PWA install button |
| `/src/components/WeeklyHeader.ts` | Editorial title, subtitle, week switcher (`<`, `This Week ⌵`, `>`), and avatar |
| `/src/components/DayCard.ts` | Glassmorphism cards for Monday–Sunday with breakfast & dinner slots |
| `/src/components/BudgetSummary.ts` | Bottom glass card displaying weekly budget, meal count, and daily average |
| `/src/components/RecipePanel.ts` | Right-side drawer with photo, serving stepper, scaled ingredients, and "Mark as Cooked" |
| `/src/components/Modal.ts` | Modals for Cook & Deduct confirmation, Restock, Edit Inventory, and Assign Meal |
| `/src/pages/WeeklyPlanPage.ts` | Weekly 7-day meal schedule view |
| `/src/pages/RecipesPage.ts` | Recipe catalog with category filters, search, and recipe creator |
| `/src/pages/IngredientsPage.ts` | Household pantry inventory table, stock counters, and activity audit log |
| `/src/pages/ShoppingListPage.ts` | Smart grocery list comparing weekly recipe needs against current pantry stock |
| `/src/pages/SettingsPage.ts` | Default servings, currency selector, and PWA controls |
| `/src/services/storageService.ts` | IndexedDB persistent storage wrapper |
| `/src/services/inventoryService.ts` | Stock deduction, restock, shortage detection, and transaction recording |
| `/src/services/mealPlanService.ts` | Schedule planning, meal status updates, and budget calculations |
| `/src/services/ingredientService.ts` | Ingredient aggregation and pantry shortfall calculations |
| `/src/utils/unitConversion.ts` | Unit normalization and conversion formulas |
| `/src/utils/ingredientScaling.ts` | Dynamic serving-size scaling math |
| `/src/styles/` | Glassmorphism styling, Apple background lighting, color variables, and responsive layout |

---

*MealWeek is designed to bring calm, elegance, and effortless organization to your daily culinary life.*
