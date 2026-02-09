# Checklist - Task 3.2: Implement dynamic visibility logic
**Parent:** `02_detailed_m3_navigation-bar-restyling.md`

### Steps
- [x] Step 1: Research/Confirm the `isAnySupervisor` logic in `lib/rbac.ts`.
- [x] Step 2: Implement `pendingApprovalsCount` logic (Prisma query in `app/(dashboard)/layout.tsx` or a dedicated action).
- [x] Step 3: Update `DashboardLayout` in `app/(dashboard)/layout.tsx` to pass `hasPendingApprovals` to `MainNavigation`.
- [x] Step 4: Update `MainNavigation.tsx` to accept the new prop and refine the `Approvals` link visibility:
    - Visible if `isAdmin || isSupervisor || hasPendingApprovals`.
- [x] Step 5: Verify RBAC constraints for "Settings" and "Users" (must be `isAdmin` only).
- [x] Step 6: Verify the "Approvals" link correctly appears/disappears based on real data for different users.

### Done When
- [x] "Approvals" link visibility matches PRD §2.A.5 logic.
- [x] "Settings" and "Users" links are strictly reserved for Admins.
- [x] Navigation logic is robust and derived from Single Source of Truth database state.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-09 | 1.0 | Checklist creation |
