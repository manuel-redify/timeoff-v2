# Checklist - Task 4.1: Implement Smart Header scroll behavior
**Parent:** `02_detailed_m4_navigation-bar-restyling.md`

### Steps
- [x] Step 1: Create a custom React hook (e.g., `hooks/use-scroll-direction.ts`) to track 'up' vs 'down' scroll direction and offset.
- [x] Step 2: Implement visibility state logic in `MainNavigation.tsx` based on the scroll hook.
- [x] Step 3: Apply CSS transition classes or Framer Motion variant to the `<nav>` container for the `translate-y` transform.
- [x] Step 4: Ensure the `100px` scroll offset threshold is correctly respected (don't hide immediately at the top).
- [x] Step 5: Verify the "show on scroll up" behavior is instantaneous and responsive.
- [x] Step 6: Test intersection with sticky elements or modals to ensure no layering issues.

### Done When
- [x] Navbar hides when scrolling down (>100px).
- [x] Navbar reappears immediately when scrolling up.
- [x] The transition is smooth (ease-in-out) and doesn't jitter.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-09 | 1.0 | Checklist creation |
