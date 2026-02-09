# Checklist - Task 3.1
**Parent:** `02_detailed_m3_calendar-page-restyle.md`

### Steps
- [ ] Step 1: Create `components/calendar/mobile-filter-drawer.tsx` using the standard `Sheet` component.
- [ ] Step 2: Configure `SheetContent` with `side="bottom"` for mobile behavior.
- [ ] Step 3: Extract shared filter selector components (Dept, Project, Role, Area) to avoid duplication with the desktop drawer (Task 1.2).
- [ ] Step 4: Add "Apply Filters" button to the bottom sheet to batch updates if necessary for better mobile UX.
- [ ] Step 5: Update `calendar-header.tsx` to use `useMediaQuery` or a CSS-based approach to toggle between Desktop Drawer (Task 1.2) and Mobile Sheet.
- [ ] Step 6: Verify the sheet handles height correctly and doesn't obscure the active filter tags on mobile.

### Done When
- [ ] Clicking "Filters" on mobile opens a bottom sheet instead of a right drawer.
- [ ] The bottom sheet contains the same 4 filter selectors as desktop.
- [ ] Filter selections made in the bottom sheet correctly update the calendar.
- [ ] The drawer is easily dismissible via swipe down or close button.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-09 | 1.0 | Checklist creation |
