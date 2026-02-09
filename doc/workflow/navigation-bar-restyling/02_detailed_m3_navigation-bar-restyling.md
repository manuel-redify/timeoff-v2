# Detailed Phase - Milestone 3: Dynamic Logic & Feedback
**Parent:** `02_task_plan_navigation-bar-restyling.md`
**Files Involved:** `components/ui/MainNavigation.tsx`, `components/notifications/notification-drawer.tsx` (NEW), `lib/actions/approvals.ts` (context), `prisma/schema.prisma`

### Task 3.1: Implement Notification Bell + Slide-out Drawer
1. [x] Redesign **Notification Bell** icon with a neon lime badge.
2. [x] Create `NotificationDrawer.tsx`:
    - Slide-out animation from the right.
    - Overlay (backdrop) behavior.
    - Header with "Notifications" title and close icon.
    - List of notification items with `0.0625rem` bottom border.
    - **Empty state:** Display `BellOff` icon and "You have no new notifications".

### Task 3.2: Implement dynamic visibility logic
1. [x] Implement Prisms-based logic for the "Approvals" link:
    - Visible if `pendingApprovalsCount > 0` OR `isSupervisor === true`.
2. [x] Ensure the "Settings" icon and "Users" link only appear for `isAdmin === true`.
3. [x] Integrate this logic into `MainNavigation.tsx` (Server Action or use existing data if available).

### Task 3.3: Add Skeleton states for async components
1. [x] Create/Update Skeleton components (`neutral-100` bg, pill/circle shapes).
2. [x] Apply skeletons to:
    - User Avatar while initials/image load.
    - Dynamic Nav Links (Approvals, Users) if permissions query takes >200ms.
    - Notification Badge (prevent flicker).

## 🔄 Next Steps
- Milestone 3 Complete. Proceed to Milestone 4.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-09 | 1.0 | Milestone 3 breakdown |
