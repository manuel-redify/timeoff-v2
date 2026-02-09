# Checklist - Task 3.1: Implement Notification Bell + Slide-out Drawer
**Parent:** `02_detailed_m3_navigation-bar-restyling.md`

### Steps
- [x] Step 1: Create `components/notifications/notification-drawer.tsx` using a sliding overlay (e.g., `Sheet` from a UI library or custom CSS).
- [x] Step 2: Implement the "Slide-out from Right" animation.
- [x] Step 3: Redesign the **Notification Bell** trigger:
    - Replace existing ghost button with designed transparent trigger.
    - Set badge background to neon lime (`#e2f337`) and text to black.
    - Ensure badge only appears when count > 0 (avoid flicker).
- [x] Step 4: Implement Drawer Content:
    - Sticky Header with "Notifications" and Close button (X).
    - Map `notification-list.tsx` inside the drawer body.
    - Implement the "Empty State" UI (BellOff icon + neutral-400 text).
- [x] Step 5: Update `MainNavigation.tsx` to use `NotificationDrawer` instead of `NotificationCenter`.
- [x] Step 6: Verify opening/closing interaction and responsiveness.

### Done When
- [x] Notification Bell features a neon lime badge.
- [x] Clicking the bell slides out a drawer from the right side of the screen.
- [x] Empty state is visually correct when no notifications are present.
- [x] Drawer closes successfully via close button, backdrop click, or `Esc`.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-09 | 1.0 | Checklist creation |
