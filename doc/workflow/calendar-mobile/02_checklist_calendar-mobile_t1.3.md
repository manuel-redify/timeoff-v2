# Checklist - Task 1.3
**Parent:** `02_detailed_m1_calendar-mobile.md`

### Steps
- [ ] Step 1: Open `components/charts/wall-chart-view.tsx`.
- [ ] Step 2: Ensure the table container has `overflow-auto` and `relative` positioning.
- [ ] Step 3: Implement `sticky left-0` and `z-[45]` for the Employee name cells (`td`).
- [ ] Step 4: Implement `sticky top-0` and `z-[50]` for the Days/Dates header row (`thead`).
- [ ] Step 5: Implement `sticky top-0 left-0` and `z-[60]` for the "People" intersection cell.
- [ ] Step 6: Verify cell height is consistent at `60px` (`h-[3.75rem]`) for mobile touch targets.
- [ ] Step 7: Conduct 2D scroll test: vertical scroll keeps header visible, horizontal scroll keeps names visible.

### Done When
- [ ] Intersection cell remains locked in both directions.
- [ ] Names remain visible while scrolling days horizontally.
- [ ] Dates remain visible while scrolling names vertically.
- [ ] Row height is exactly 60px on mobile viewports.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-10 | 1.0 | Checklist creation |
