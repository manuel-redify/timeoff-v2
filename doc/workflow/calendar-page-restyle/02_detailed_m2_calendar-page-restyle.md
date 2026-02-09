# Detailed Phase - Milestone 2: Calendar Grid Restyling
**Parent:** `02_task_plan_calendar-page-restyle.md`
**Files Involved:** `components/charts/wall-chart-view.tsx`, `components/calendar/calendar-absence-badge.tsx`

### Task 2.1: Bidirectional Sticky Logic (Intersect Table)
- [x] Refactor table structure to support `sticky` headers and columns. (M)
- [x] Implement "Employee" header as a double-sticky element (Left 0, Top 0). (S)
- [x] Ensure z-index hierarchy follows PRD (Header 10 > Column 9 > Pills 5). (S)

### Task 2.2: Weekend & Today Highlighting Strategy
- [ ] Update weekend column styling to `#f7f9fa`. (S)
- [ ] Implement "Today" column highlight with `#f2f7ff` and blue date indicator. (S)
- [ ] Add 1px `neutral-200` borders precisely to the grid. (S)

### Task 2.3: Absence Pills & Popover Restyling
- [ ] Replace simple divs with a refined `AbsencePill` component. (M)
- [ ] Integrate Lucide icons into pills (based on leave type). (S)
- [ ] Implement Radix UI Popover for leave details on hover/click. (M)
- [ ] Fix half-day rendering issues in the new grid. (M)

### Task 2.4: Virtualization Implementation (Teams > 50)
- [ ] Research/Install `@tanstack/react-virtual` if necessary or use standard CSS grid optimization. (M)
- [ ] Implement windowing for rows (Employees) to maintain 60fps. (L)
- [ ] Verify sticky behavior remains functional with virtualized rows. (M)

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Once finished, proceed to Milestone 3 (Mobile UX).

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-09 | 1.0 | Milestone breakdown |
