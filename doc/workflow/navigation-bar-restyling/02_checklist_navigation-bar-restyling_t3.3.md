# Checklist - Task 3.3: Add Skeleton states for async components
**Parent:** `02_detailed_m3_navigation-bar-restyling.md`

### Steps
- [x] Step 1: Create a reusable `Skeleton` component (if not already present in `components/ui/skeleton.tsx`).
- [x] Step 2: Implement circular skeleton for the User Avatar in `MainNavigation.tsx`.
- [x] Step 3: Implement pill-shaped skeletons for dynamic navigation links (Approvals, Users).
- [x] Step 4: Add logic to show skeletons if permissions/data query takes >200ms (or show by default during initial load).
- [x] Step 5: Implement skeleton for the Notification Badge to prevent flicker/CLS.
- [x] Step 6: Verify visual consistency of skeletons (neutral-100 background, pulsing animation).
- [x] Step 7: Test transitions from skeleton to content on different connection speeds (using Throttling if needed).

### Done When
- [x] User Avatar shows a circular skeleton during load.
- [x] Dynamic nav links show pill skeletons during permission checks.
- [x] Notification Badge does not flicker from 0 to N during load.
- [x] All skeletons follow the Redify neutral-100 palette.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-09 | 1.0 | Checklist creation |
