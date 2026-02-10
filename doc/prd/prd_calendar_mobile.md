# Product Requirements Document: Calendar page - Mobile Version (List View)

## 1. Overview & Mobile Mission

The mobile version of the Calendar page is reimagined as a **"Daily Snapshot"** rather than a complex grid. It focuses on showing who is absent on a selected date, optimized for quick lookups and touch interactions. This implementation must be triggered only on mobile viewports, leaving the Desktop grid intact.

## 2. Mobile Design Tokens (Adjustments)

- **Touch Targets:** List items must have a minimum height of **`3.75rem` (60px)**.
- **Colors:** Use the same functional palette for absence types (Approved: `#dcfae7`, Pending: `#faf2c8`, Holiday: `#fae6e7`).
- **Radius:** Layout containers use `rounded-lg`, while list elements and filters use `rounded-sm`.

## 3. Layout & Component Adaptation

### A. Header & Controls (Control Bar)

- **Row 1:** "Team View" title and the "Filters" button (with active count badge).
- **Row 2:** Month Navigation Group (`<`, Month/Year, `>`) and "Today" button.

### B. Active Filters (Faceted Tags)

- **Placement:** Positioned immediately below the main control bar card, as a standalone horizontally scrollable row.
- **Visuals:** Active filter tags displayed as a list of Neon Lime (`#e2f337`) pills.
- **Style:** Rectangular with `rounded-sm` corners, including an "X" for removal and a "Clear all" link at the end.

### C. Horizontal Date Strip (Sticky Top)

- Below the header, implement a **Horizontal Date Scroller**.
- **Visuals:** Each day is a **compact vertical card** showing the day (e.g., "Monday") and the number (e.g., "14").
- **Active State:** The selected day uses a **thick Neon Lime (`#e2f337`) border** and bold text to signal selection, while keeping the background white to respect the "Highlighter Restraint" rule.
- **Today State:** The current date card is marked with the light blue background (`#f2f7ff`) and a small "dot" indicator at the bottom.
- **Behavior:** Clicking a card updates the list below.

### D. The Absence List (Main Content)

- A vertical list of minimalist rows representing employees absent on the selected day.
- **Empty State:** If no absences are found for the selected day, show a minimalist "No absences today" illustration with a "View next absence" shortcut.
- **Row Structure:**
    - **Style:** Use a "light" approach with no full borders or background cards. Items are separated by a subtle `0.0625rem` (1px) bottom border (`neutral-100`).
    - **Left:** Employee Name (medium weight, `neutral-900`).
    - **Right:** Absence Status Pill (e.g., "Approved", "Holiday") with its specific color and Lucide icon.
- **Grouping:** If there are many absences, group them by "Department" or "Project" (based on active filters) using simple header labels.

## 4. Interaction & Filter System

### A. Bottom Sheet Filters

- The "Filters" button opens a **Bottom Sheet** (90% height).
- **Faceted Search:** Same logic as Desktop. Selecting a Department dynamically updates available Projects.
- **Action:** A sticky "Apply" button in Neon Lime at the bottom.

### B. Navigation & Gestures

- **Swipe Navigation:** Users can swipe left/right on the main list area to move to the next/previous day in the month.
- **Scroll Snap:** The horizontal Date Strip snaps to the center for the selected day.

## 5. Visual Hierarchy & States

| Component | UI Treatment |
| --- | --- |
| **Selected Day Card** | White background with a thick Neon Lime border (#e2f337) and bold text |
| **Current Day Card** | Light Blue Background (#f2f7ff), Bordered |
| **Absence Row** | Transparent background, `0.0625rem` bottom border only, high-density layout |
| **Loading** | Pulse skeleton of the list rows |

## 6. Technical Requirements

- **Conditional Rendering:** Use a media query or a custom hook to switch between `GridView` (Desktop) and `ListView` (Mobile).
- **Performance:** Memoize the absence list to ensure instant day-switching.
- **Z-Index:** Date Strip (40) > Active Filters (45) > Header (50) > Bottom Sheet (100).