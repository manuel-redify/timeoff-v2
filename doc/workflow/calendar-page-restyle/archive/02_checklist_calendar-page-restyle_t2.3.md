# Checklist - Task 2.3
**Parent:** `02_detailed_m2_calendar-page-restyle.md`

### Steps
- [x] Step 1: Create `components/calendar/absence-pill.tsx` or refactor `calendar-absence-badge.tsx` into a more robust component.
- [x] Step 2: Implement Lucide icon mapping for leave types (e.g., Sun for holiday, Briefcase for work, etc.).
- [x] Step 3: Integrate `@radix-ui/react-popover` for the detail view on hover/click.
- [x] Step 4: Apply Redify styling to the pill (rounded-md, shadow-sm, translucent backgrounds).
- [x] Step 5: Refactor half-day logic in `WallChartView.tsx` to use the new pill's positioning props.
- [x] Step 6: Verify popover content includes User Name, Leave Type, Dates, and Status.
- [x] Step 7: Test pill rendering for various leave statuses (Approved, Pending, Canceled).

### Done When
- [x] Absence pills are consistently styled across the grid.
- [x] Pills include meaningful Lucide icons.
- [x] Clicking/Hovering on a pill opens a Radix Popover with absence details.
- [x] Half-day absences (morning/afternoon) are visually accurate in the grid.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-09 | 1.0 | Checklist creation |
