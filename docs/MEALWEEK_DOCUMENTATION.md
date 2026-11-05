# MealWeek — Application Documentation & System Guide

**MealWeek** is an Apple-inspired weekly meal planning and food inventory Progressive Web Application (PWA). It provides a closed-loop system connecting weekly meal planning, dynamic ingredient portion scaling, automated pantry stock deductions, smart grocery list generation, and historical audit tracking.

---

## 1. Design Philosophy & Visual Language

MealWeek combines Apple desktop minimalism with editorial luxury aesthetics:

- **Color Palette**:
  - Warm Ivory (`#F8F4F0`) base canvas.
  - Soft Cream (`#F4E9E2`) and Champagne (`#E9D1B4`) surfaces.
  - Muted Gold (`#D9A441`) and Warm Peach accents.
  - Deep Charcoal (`#25221F`) typography and primary buttons.
  - Secondary Text (`#77716D`).
- **Glassmorphism**: Translucent panels (`backdrop-filter: blur(24px)`), soft white hairline borders (`rgba(255, 255, 255, 0.75)`), delicate interior reflections, and diffuse drop shadows.
- **Typography**:
  - Editorial Headings: *Playfair Display* / *Cormorant Garamond* (serif).
  - Body & UI Controls: *Plus Jakarta Sans* / SF-inspired clean modern sans-serif.
  - Metrics & Quantities: Tabular numerals (`tabular-nums`).

---

## 2. Architecture & Tech Stack

- **Application Logic**: Modular Vanilla TypeScript (no React, Next.js, or heavy framework overhead).
- **Styling**: Tailwind CSS v4 + custom glassmorphic design system.
- **Local Persistence**: **IndexedDB** database (`MealWeekDB`, v2) with automatic `localStorage` fallback.
- **PWA Capabilities**: Service Worker precaching and runtime caching (`vite-plugin-pwa`), Web App Manifest, offline readiness, and install prompt triggers for desktop and mobile.
- **Bundler**: Vite.

---

## 3. Application Structure & Navigation

The desktop layout is composed of three primary sections:

1. **Left Sidebar (~230px)**:
   - Brand lockup with champagne chef hat emblem and wordmark.
   - Primary navigation pills:
     - **Weekly Plan**: Central 7-day timetable and budget summary.
     - **Recipes**: Recipe collection, search, and recipe creator.
     - **Ingredients**: Complete household food stock and storage locations.
     - **Shopping List**: Dynamic grocery list comparing planned meals with pantry stock.
     - **Settings**: Household portion sizes, currency, and PWA controls.
   - PWA Install Action and brand footer.
2. **Central Workspace**:
   - Displays the active page. On the default **Weekly Plan** view, renders the header with week navigation, 7 horizontal day cards (Monday–Sunday), and the bottom weekly budget summary.
3. **Right Recipe Detail Panel (~390–410px)**:
   - Dedicated interactive detail view for the currently selected meal, featuring large culinary photography, portion stepper, ingredients breakdown, and the **"Mark as Cooked"** workflow.

---

## 4. End-to-End System Workflows

```
┌────────────────────────────────────────────────────────┐
│                   1. Weekly Planning                   │
│   Schedule Breakfast & Dinner (Mon - Sun) from Recipes │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│               2. Recipe & Portion Scaling              │
│   Adjust portions (e.g., 4 → 6 servings);              │
│   Ingredients automatically scale in real-time         │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│              3. Smart Shopping Generation              │
│   Buy = max(0, Quantity Required - In Pantry)          │
│   Check off items & restock into Pantry Inventory      │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│              4. Cooking & Stock Deduction              │
│   "Mark as Cooked" verifies inventory availability;    │
│   Deducts actual amounts and records audit log         │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│               5. Reversal / Undo Safety                │
│   Accidental completions can be reversed instantly;   │
│   Restores deducted quantities without data loss       │
└────────────────────────────────────────────────────────┘
```

---

### Workflow A: Weekly Meal Planning
1. Navigate to **Weekly Plan**.
2. Each horizontal card represents a day with dedicated **Breakfast** (sun icon) and **Dinner** (moon icon) slots.
3. Click any meal slot to view its recipe, photo, and ingredients in the right panel.
4. Click the right-facing chevron (`>`) on a day card to open the **Assign Meal** modal and choose a different dish.
5. Use `<` and `>` at the top or click `This Week ⌵` to jump between calendar weeks.
6. The **Weekly Budget Summary** card automatically updates the estimated weekly cost (in South African Rand ZAR) and meal counts.

---

### Workflow B: Dynamic Serving-Size Scaling
1. Select any meal in the timetable to view it in the right panel.
2. In the Ingredients section, click `-` or `+` to adjust portions (e.g. from 4 to 6 people).
3. The application calculates the scaling ratio:
   $$\text{Ratio} = \frac{\text{Target Servings}}{\text{Base Servings}}$$
4. Quantities scale proportionally with smart unit conversion (e.g. `800 g` chicken pieces scales to `1.2 kg`, `30 ml` oil scales to `45 ml`).

---

### Workflow C: Meal Completion & Inventory Deduction ("Cook & Deduct")
1. Click **"Mark as Cooked & Deduct Stock"** in the recipe panel.
2. The **Meal Completion Confirmation** dialog appears, displaying:
   - Recipe name and target serving size.
   - Required ingredient quantities.
   - Current quantities available in your pantry.
   - Proposed deduction amounts (editable by the user if different amounts were used).
   - Projected remaining stock post-cooking.
3. **Shortage Warning**: If any ingredient has insufficient stock, an alert specifies the exact shortfall (e.g. *"Chicken & Rice requires 800 g, but only 600 g is available. Short by 200 g"*).
4. Click **`+ Quick Restock`** to add missing stock directly inside the modal, or adjust the deduction.
5. On confirmation:
   - Meal status is updated to `cooked` with a green check badge on the timetable.
   - A unique `MealCompletion` record is generated.
   - Ingredients are atomically deducted from inventory.
   - `Meal Usage` transactions are logged in the activity history.
   - A confirmation toast notification is displayed.

---

### Workflow D: Undo Meal Completion
1. If a meal was marked as cooked by mistake, click **"Undo"** next to the cooked indicator in the recipe panel.
2. The application:
   - Restores the deducted quantities back into your inventory.
   - Resets meal status back to `planned`.
   - Records an immutable `Reversal` transaction in the activity log.
   - Preserves completion history without deleting audit logs.

---

### Workflow E: Smart Shopping List Integration
1. Open the **Shopping List** tab.
2. The system aggregates all ingredients needed across the week's planned meals.
3. It compares required quantities with current pantry inventory:
   $$\text{Quantity to Buy} = \max(0, \text{Required for Week} - \text{In Pantry})$$
4. Items with sufficient pantry stock show a green *"In Pantry"* badge so you avoid overbuying.
5. Items needing purchase show the exact shortfall to buy.
6. When groceries are bought, check off the item and click **`+ Stock`** (or **"Restock All Purchased"**) to add the quantities directly into your pantry inventory with duplicate-addition protection.

---

### Workflow F: Pantry Inventory Management
1. Open the **Ingredients** tab.
2. View KPI summary cards: **Total Items**, **In Stock**, **Low Stock**, and **Out of Stock**.
3. Stock statuses are computed dynamically:
   - **In Stock**: Quantity > Minimum Stock Level.
   - **Low Stock**: $0 < \text{Quantity} \le \text{Minimum Stock Level}$.
   - **Out of Stock**: Quantity = 0.
4. Filter by storage location (*Fridge, Pantry, Freezer, Spice Rack, Counter*).
5. Sort by *Name*, *Quantity*, *Recently Used*, or *Never Used*.
6. Use quick `-` and `+` buttons on any row to adjust counts.
7. Click **"Activity History"** to inspect the full audit trail of purchases, meal usages, and reversals.

---

## 5. Data Architecture & Persistence

Data is stored in browser-local IndexedDB (`MealWeekDB`) across seven object stores:

| Object Store | Key | Purpose |
| :--- | :--- | :--- |
| `recipes` | `id` | Recipe library, ingredients, serving sizes, and images |
| `weekly_plans` | `id` | Week schedules, day meal assignments, and budgets |
| `inventory` | `id` | Household ingredients, quantities, min stock, and locations |
| `meal_completions` | `id` | Records of cooked meals, servings, and deductions |
| `inventory_transactions` | `id` | Audit trail of purchases, meal usage, manual edits, and reversals |
| `shopping_list` | `id` | Purchased check states and restocked flags per week |
| `settings` | `key` | Default household servings, currency, and user preferences |

---

## 6. Offline Support & Installation

- **Standalone Mode**: The application runs without browser URL bars when installed.
- **Service Worker**: Precaches all HTML, CSS, JavaScript, SVG, and image assets.
- **Offline Resilience**: When the device loses internet connection, an ambient amber banner indicates offline mode, and the application continues to operate without interruption using local IndexedDB data.
