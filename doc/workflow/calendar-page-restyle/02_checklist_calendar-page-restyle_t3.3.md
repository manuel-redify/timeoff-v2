# Checklist - Task 3.3
**Parent:** `02_detailed_m3_calendar-page-restyle.md`

### Steps
- [ ] Step 1: Add a right-side shadow effect to the sticky "Employee" column in `WallChartView.tsx`.
- [ ] Step 2: Use a `Linear Gradient` CSS background or a pseudo-element (`::after`) for the shadow.
- [ ] Step 3: Implement logic (via CSS or JS scroll listener) to only show the shadow when there is content scrolled behind the sticky column.
- [ ] Step 4: Ensure the shadow respects the 1px neutral border system.
- [ ] Step 5: Test the visual "depth" effect with different data densities.
- [ ] Step 6: Verify z-index ensures the shadow stays below interactive elements like absence pills.

### Done When
- [ ] A subtle vertical shadow appears between the "Employee" name and the grid when scrolling.
- [ ] The shadow is only visible when horizontal scroll position is > 0.
- [ ] The shadow enhances the "sticky" depth without looking muddy or distracting.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-09 | 1.0 | Checklist creation |
