# Detailed Phase - Milestone 4: Advanced Interactions & Quality
**Parent:** `02_task_plan_navigation-bar-restyling.md`
**Files Involved:** `components/ui/MainNavigation.tsx`, `app/globals.css`, `components/notifications/notification-drawer.tsx`

### Task 4.1: Implement Smart Header scroll behavior
1. [x] Implement a custom hook or scroll listener in `MainNavigation.tsx`.
2. [x] Add logic to:
    - Hide Navbar (transform: translateY(-100%)) when scrolling down after 100px offset.
    - Show Navbar instantly when scrolling up.
3. [x] Use CSS transitions or Framer Motion for smooth visibility toggling.
4. [x] Ensure `sticky top-0` is maintained when visible.

### Task 4.2: Apply 150ms transitions and micro-animations
1. [ ] Global sweep of `MainNavigation.tsx` to ensure all hover/active states use `150ms ease-in-out`.
2. [ ] Implement `scale-98` (or 95) contraction on `New Leave` button click.
3. [ ] Ensure smooth entry/exit animations for the Notification Drawer.
4. [ ] Verify neutral-100 to neutral-900 background/text transitions on links.

### Task 4.3: Accessibility (A11y) audit
1. [ ] Verify `role="navigation"` on the main container.
2. [ ] Audit `aria-label` for all icons (Notifications, Settings, New Leave).
3. [ ] Implement sequential focus management (Tab) for the Notification Drawer and Avatar Dropdown.
4. [ ] Ensure `Esc` key functionality for all overlays is robust.

## 🔄 Next Steps
- Create Task Checklist for Task 4.1 (`02_checklist_navigation-bar-restyling_t4.1.md`).
- Overwrite this file to mark tasks as `[x]` upon completion.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-09 | 1.0 | Milestone 4 breakdown |
