# Checklist - Task 3.2
**Parent:** `02_detailed_m3_calendar-mobile.md`

### Steps
- [ ] Step 1: Open `components/calendar/mobile-filter-sheet.tsx`.
- [ ] Step 2: In `FilterContent`, verify that `projectOptions` calculation uses the `wouldIncludeUser` helper with `draftFilters`.
- [ ] Step 3: Ensure `wouldIncludeUser` correctly chains filter logic (if Dept is selected, only users in that Dept are considered for Project counts).
- [ ] Step 4: Verify `useMemo` dependencies for `projectOptions` include all relevant `draftFilters` to trigger re-renders on selection.
- [ ] Step 5: Test faceted filtering: select a Department and confirm Project list shrinks to only relevant projects.
- [ ] Step 6: Handle "No results" state: if no users match the current combination, ensure the filter UI shows clear empty state or resets correctly.

### Done When
- [ ] Selecting a Department instantly updates the available Projects in the Filter panel.
- [ ] Project counts correctly reflect the filtered subset of users.
- [ ] UI remains responsive during real-time filtering updates.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-10 | 1.0 | Checklist creation |
