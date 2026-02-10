# Checklist - Task 1.4
**Parent:** `02_detailed_m1_calendar-mobile.md`

### Steps
- [ ] Step 1: Open `components/charts/wall-chart-view.tsx`.
- [ ] Step 2: Locate the sticky "People" column (`th` and `td`).
- [ ] Step 3: Add a `border-r-2 border-slate-200/50` or a `relative` container with a `shadow-right` class to the sticky column.
- [ ] Step 4: Implement a CSS linear-gradient indicator that only appears when the grid is scrolled horizontally (using `after:` pseudo-element if possible, or a dedicated overlay div).
- [ ] Step 5: Ensure the visual indicator is hidden on desktop viewports (`lg:hidden`).
- [ ] Step 6: Verify the indicator doesn't overlap content in the adjacent cells.

### Done When
- [ ] Sticky column has a clear visual separation (border or gradient) from the scrolling content.
- [ ] Separation is only visible on mobile/tablet viewports.
- [ ] Visual indicator correctly follows the sticky column boundaries.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-10 | 1.0 | Checklist creation |
