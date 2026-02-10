# Detailed Phase - Milestone 3
**Parent:** `02_task_plan_calendar-mobile.md`
**Files Involved:** `components/calendar/mobile-filter-sheet.tsx`, `components/ui/multi-select.tsx` (or new Select component)

### Task 3.1: Filter Bottom Sheet component foundation
- [ ] 3.1.1: Adjust `SheetContent` height to `h-[90vh]` in `mobile-filter-sheet.tsx`.
- [ ] 3.1.2: Research "full-width Select" components from the design system and replace `MultiSelect` if necessary for single-select fields, or ensure `MultiSelect` is styled to be full-width and touch-optimized.
- [ ] 3.1.3: Relocate the Legend into the top of the filter panel as per PRD (if opted for that instead of info icon).
*Effort:* M | *Source:* `F03`, `C01`

### Task 3.2: Integration of Faceted Search (Dept -> Project)
- [ ] 3.2.1: Audit existing `wouldIncludeUser` logic in `mobile-filter-sheet.tsx` to ensure it correctly filters Projects based on selected Departments in real-time.
- [ ] 3.2.2: Verify that Project options update immediately in the UI when Department selection changes.
- [ ] 3.2.3: Handle edge cases where selected filters result in zero users/projects.
*Effort:* M | *Source:* `F08`, `F01` (mobile logic)

### Task 3.3: Neon Lime "Apply Filters" sticky footer
- [ ] 3.3.1: Verify the footer container is `sticky bottom-0`.
- [ ] 3.3.2: Apply Neon Lime (`#e2f337`) to the button with high-contrast text (`neutral-900`).
- [ ] 3.3.3: Add "Reset Filters" thumb-friendly button in the footer area (as per Empty State logic but applied to filter sheet).
*Effort:* S | *Source:* `F03`, `F09`

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Archive this checklist when task 3.Y is finished.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-10 | 1.0 | Milestone 3 breakdown for Filter System (Bottom Sheet) |
