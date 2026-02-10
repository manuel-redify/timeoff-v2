# Checklist - Task 4.3
**Parent:** `02_detailed_m4_calendar-mobile.md`

### Steps
- [ ] Step 1: Open `app/layout.tsx` or the specific calendar page/layout file.
- [ ] Step 2: Implement or verify the `viewport` meta tag using Next.js Metadata API: `viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"`.
- [ ] Step 3: Open `components/calendar/calendar-header.tsx`, `components/charts/wall-chart-view.tsx`, and `components/calendar/mobile-filter-sheet.tsx`.
- [ ] Step 4: Harmonize `Z-Index` values:
    - `SheetContent` (Mobile Filter): `z-[100]`
    - `CalendarHeader` (Sticky): `z-[50]`
    - Sticky Day Header row: `z-[50]`
    - Sticky People Column: `z-[45]`
    - Grid intersection cell: `z-[60]`
- [ ] Step 5: Verify that the filter sheet covers everything, and sticky elements don't peek through or overlap incorrectly.
- [ ] Step 6: Test scroll performance on mobile: ensure no jitter when both vertical and horizontal sticky elements are active.

### Done When
- [ ] Viewport meta tag prevents accidental zooming on mobile.
- [ ] Z-index hierarchy is consistent and follows the plan.
- [ ] Scrolling is smooth with no visual layering bugs.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-10 | 1.0 | Checklist creation |
