# Checklist - Task 4.2: Apply 150ms transitions and micro-animations
**Parent:** `02_detailed_m4_navigation-bar-restyling.md`

### Steps
- [ ] Step 1: Ensure `transition-all duration-150 ease-in-out` classes are applied to all interactive elements in `MainNavigation.tsx` (links, buttons, icons).
- [ ] Step 2: Implement `active:scale-98` utility for the "New Leave" button.
- [ ] Step 3: Implement `active:scale-95` or similar micro-interaction for Navbar icons (Bell, Settings).
- [ ] Step 4: Configure `hover` states for nav links to use `neutral-100` background and `neutral-900` text with smooth color transition.
- [ ] Step 5: Verify that the Notification Drawer entry/exit animations are consistent with the 150ms duration (using Framer Motion or Radix/Headless primitives).
- [ ] Step 6: Audit the entire Navbar for any "snappy" (0ms) state changes and fix them.

### Done When
- [ ] All hover and active states feature a `150ms` ease-in-out transition.
- [ ] "New Leave" button has a tactile scale-down effect on click.
- [ ] Link color transitions appear fluid and professional.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-09 | 1.0 | Checklist creation |
