# Checklist - Task 2.2
**Parent:** `02_detailed_m2_calendar-mobile.md`

### Steps
- [ ] Step 1: Open `components/calendar/absence-pill.tsx`.
- [ ] Step 2: Verify `PopoverTrigger` uses `asChild`.
- [ ] Step 3: Ensure the inner `div` has `cursor-pointer` and no `title` attributes that might trigger native browser tooltips on long-press.
- [ ] Step 4: Verify `touch-action: manipulation` or other CSS properties to prevent double-tap zoom delay on the pill.
- [ ] Step 5: Test tap interaction on mobile browser: verify popover opens reliably on first tap.

### Done When
- [ ] Absence pills open popovers on single tap on mobile.
- [ ] No native browser tooltips appear on mobile interaction.
- [ ] Tap interaction is responsive and lacks delay.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-10 | 1.0 | Checklist creation |
