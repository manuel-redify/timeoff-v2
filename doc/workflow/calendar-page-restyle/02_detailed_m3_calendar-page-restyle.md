# Detailed Phase - Milestone 3: Mobile UX & Refinements
**Parent:** `02_task_plan_calendar-page-restyle.md`
**Files Involved:** `components/calendar/calendar-header.tsx`, `components/charts/wall-chart-view.tsx`, `components/ui/sheet.tsx`

### Task 3.1: Bottom Sheet for Mobile Filters
- [x] Implement `MobileFilterDrawer` using `Sheet` with `side="bottom"`. (M)
- [x] Share filter logic/selection components between the desktop drawer and mobile sheet. (S)
- [x] Update `calendar-header.tsx` to conditionally trigger the bottom sheet on small screens. (S)

### Task 3.2: Mobile Touch Targets & Snap Scroll
- [ ] Implement `scroll-snap-type: x mandatory` or `proximity` on the table container for mobile. (M)
- [ ] Increase padding and touch targets for navigation chevrons and filter tags on mobile. (S)
- [ ] Ensure the "Employee" sticky column behaves correctly with touch-scrolling. (M)

### Task 3.3: Gradient Shadows for Sticky Column
- [ ] Add a `::after` pseudo-element or a separate shadow div to the sticky column. (S)
- [ ] Implement a subtle gradient shadow that appears only when the grid is scrolled horizontally. (M)
- [ ] Refine z-index to ensure shadows don't overlap interactive pills. (S)

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Once finished, proceed to Milestone 4 (Performance & Polish).

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-09 | 1.0 | Milestone breakdown |
