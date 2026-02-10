# Checklist - Task 2.3
**Parent:** `02_detailed_m2_calendar-mobile.md`

### Steps
- [ ] Step 1: Open `components/calendar/absence-pill.tsx`.
- [ ] Step 2: In the `PopoverContent`, set `side="top"` and `align="center"` (already there, but confirm).
- [ ] Step 3: Add `collisionBoundary` or `avoidCollisions={true}` to the `PopoverContent` to prevent it from bleeding off-screen.
- [ ] Step 4: Add mobile-specific padding/margin to the popover to ensure it doesn't touch the screen edges (e.g., `sm:m-2` equivalent).
- [ ] Step 5: Verify the popover content is readable and not too wide for mobile viewports (e.g., `max-w-[calc(100vw-2rem)]`).
- [ ] Step 6: Verify the popover closes correctly when tapping outside or on another pill.

### Done When
- [ ] Popover is centered above the absence pill on mobile.
- [ ] Popover never overflows the viewport edges.
- [ ] UI is clear and legible on small screens.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-10 | 1.0 | Checklist creation |
