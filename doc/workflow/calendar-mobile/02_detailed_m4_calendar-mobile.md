# Detailed Phase - Milestone 4
**Parent:** `02_task_plan_calendar-mobile.md`
**Files Involved:** `components/charts/wall-chart-view.tsx`, `components/calendar/calendar-states.tsx`, `app/(dashboard)/calendar/layout.tsx` (if needed for viewport)

### Task 4.1: Mobile Skeleton Screen (60px row height)
- [ ] 4.1.1: Update the skeleton table body in `WallChartView` to use `h-[60px]` for `td` on mobile viewports.
- [ ] 4.1.2: Ensure `Skeleton` components inside the cells are appropriately sized for the 60px height.
- [ ] 4.1.3: Verify skeleton column width matches the `sticky` column implementation.
*Effort:* S | *Source:* `F09`

### Task 4.2: Thumb-friendly Empty State UI
- [ ] 4.2.1: Adjust `EmptyState` in `calendar-states.tsx` to use more vertical padding on mobile.
- [ ] 4.2.2: Ensure the "Clear Filters" button is large (h-10 or h-12) and uses a touch-optimized padding.
- [ ] 4.2.3: Verify the icon and text are legible and centered.
*Effort:* S | *Source:* `F09`

### Task 4.3: Viewport & Z-Index Management
- [ ] 4.3.1: Verify `Z-Index` hierarchy: Bottom Sheet (100) > Header (50) > Sticky Column (45).
- [ ] 4.3.2: Implement/Verify `viewport` meta tag with `maximum-scale=1.0, user-scalable=no` in a layout file or within the page component if using Next.js Metadata API.
- [ ] 4.3.3: Perform a scroll performance test; ensure no "jitter" by confirming CSS `sticky` and `will-change-scroll` are active.
*Effort:* M | *Source:* `F01`, `F09`

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Archive this checklist when task 4.Y is finished.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-10 | 1.0 | Milestone 4 breakdown for Polish & Compliance |
