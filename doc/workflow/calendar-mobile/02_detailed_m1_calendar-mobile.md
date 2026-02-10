# Detailed Phase - Milestone 1
**Parent:** `02_task_plan_calendar-mobile.md`
**Files Involved:** `app/calendar/page.tsx`, `components/calendar/ControlBar.tsx`, `components/calendar/TimelineGrid.tsx` (hypothetical, need to verify)

### Task 1.1: Mobile container setup & CSS isolation
- [x] 1.1.1: Identify root calendar layout and add `md:hidden` / `initial` display logic for mobile.
- [x] 1.1.2: Research existing Tailwind breakpoints and ensure compatibility.
- [x] 1.1.3: Set viewport meta tag in the page layout (specifically for Calendar).
*Effort:* S | *Source:* `F01`, `F09`

### Task 1.2: Responsive Header Stack
- [x] 1.2.1: Modify `ControlBar` to use Flexbox stack on mobile (`flex-col`).
- [x] 1.2.2: Implement 2-row layout: Row 1 (Title + Filters), Row 2 (Nav + Today).
- [x] 1.2.3: Adjust styling for `rounded-lg` and button padding (`rounded-sm`).
*Effort:* M | *Source:* `F02`

### Task 1.3: Sticky 2D Grid implementation
- [x] 1.3.1: Verify `sticky` classes on the Employee Column.
- [x] 1.3.2: Verify `sticky` classes on the Days/Dates Header.
- [x] 1.3.3: Ensure the intersection cell (Employee header) is `sticky top left`.
*Effort:* M | *Source:* `F05`

### Task 1.4: Sticky Edge Visual Indicator
- [x] 1.4.1: Add `border-r` or `linear-gradient` to employee sticky column.
- [x] 1.4.2: Ensure indicator only shows on mobile/small screens.
*Effort:* S | *Source:* `F05`

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Archive this checklist when task 1.Y is finished.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-10 | 1.0 | Milestone breakdown for Layout & Header |
