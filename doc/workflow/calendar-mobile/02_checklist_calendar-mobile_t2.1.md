# Checklist - Task 2.1
**Parent:** `02_detailed_m2_calendar-mobile.md`

### Steps
- [ ] Step 1: Open `components/charts/wall-chart-view.tsx`.
- [ ] Step 2: Locate the outer scrollable container (the one wrapping the `table`).
- [ ] Step 3: Add `scroll-snap-type: x proximity` to that container's classes.
- [ ] Step 4: Add `scroll-snap-align: start` to the `th` elements in the `thead` (excluding the sticky people column if necessary, or including it).
- [ ] Step 5: Add `scroll-snap-align: start` to the `td` elements in the `tbody`.
- [ ] Step 6: Verify horizontal scrolling on a mobile simulator/device: swiping should lock to the edge of the nearest day column.

### Done When
- [ ] Horizontal scroll container has `scroll-snap-type: x proximity`.
- [ ] Grid cells have `scroll-snap-align: start`.
- [ ] Grid "snaps" to day boundaries during horizontal scroll on mobile.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-10 | 1.0 | Checklist creation |
