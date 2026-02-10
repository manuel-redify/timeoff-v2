# Detailed Phase - Milestone 2
**Parent:** `02_task_plan_calendar-mobile.md`
**Files Involved:** `components/charts/wall-chart-view.tsx`, `components/calendar/absence-pill.tsx`, `components/ui/popover.tsx`

### Task 2.1: Horizontal Navigation with Scroll Snap
- [ ] 2.1.1: Apply `scroll-snap-type: x proximity` to the table container in `WallChartView`.
- [ ] 2.1.2: Add `scroll-snap-align: start` to day header cells (`th`) and data cells (`td`).
- [ ] 2.1.3: Verify that horizontal swiping "snaps" to the beginning of a day rather than stopping in between.
*Effort:* S | *Source:* `F06`

### Task 2.2: Absence Pills Tap Trigger refactor
- [ ] 2.2.1: Verify `AbsencePill` popover trigger behavior on mobile.
- [ ] 2.2.2: Ensure `PopoverTrigger` uses `asChild` and contains the touch-friendly div.
- [ ] 2.2.3: Remove any leftover desktop-only title/hover attributes that might interfere.
*Effort:* S | *Source:* `F07`

### Task 2.3: Mobile-optimized Popover/Modal UI
- [ ] 2.3.1: Adjust `PopoverContent` styling for mobile: center it above the tapped pill.
- [ ] 2.3.2: Implement logic to ensure popover does not get cut off by viewport edges (Radix `collisionBoundary` or `avoidCollisions`).
- [ ] 2.3.3: (Optional/If needed) Implement a small focused modal for absence details on very narrow screens.
*Effort:* M | *Source:* `F07`

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Archive this checklist when task 2.Y is finished.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-10 | 1.0 | Milestone 2 breakdown for Grid Interaction & Touch UX |
