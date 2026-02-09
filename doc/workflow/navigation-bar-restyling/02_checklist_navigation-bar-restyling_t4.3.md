# Checklist - Task 4.3: Accessibility (A11y) audit
**Parent:** `02_detailed_m4_navigation-bar-restyling.md`

### Steps
- [ ] Step 1: Verify `<nav>` element has `role="navigation"` and a descriptive `aria-label`.
- [ ] Step 2: Ensure all icon-only buttons (Notifications, Settings, Mobile Plus) have explicit `aria-label` (e.g., "Open notifications").
- [ ] Step 3: Implement/Verify "Focus Trap" for the Notification Drawer when open.
- [ ] Step 4: Ensure the User Avatar Dropdown manages focus correctly (focus returns to trigger on close).
- [ ] Step 5: Verify all overlays (Drawer, Dropdown) close on `Esc` key press.
- [ ] Step 6: Perform a manual Keyboard navigation test:
    - Tab through all links and buttons.
    - Confirm logical focus order (Logo -> Links -> Actions -> Profile).
- [ ] Step 7: Check color contrast for the Neon Lime (#e2f337) on white/dark backgrounds and adjust text color (Black) for AA compliance.

### Done When
- [ ] Navbar is fully navigable via keyboard.
- [ ] Non-textual elements have correct ARIA labels.
- [ ] Focus management for overlays follows WAI-ARIA best practices.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-09 | 1.0 | Checklist creation |
