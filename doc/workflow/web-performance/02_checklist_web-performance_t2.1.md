# Checklist - Task 2.1: Add virtualization to Approvals Dashboard

**Parent:** 02_detailed_m2_web-performance.md

### Steps

- [x] 1. Install `@tanstack/react-virtual` package
- [x] 2. Read current implementation in `app/(dashboard)/approvals/approvals-dashboard.tsx`
- [x] 3. Import `useVirtualizer` and `useRef` from react-virtual
- [x] 4. Refactor `approvals.map()` to use virtualized list with `useVirtualizer`
- [x] 5. Add fixed height container with overflow for virtual scroll
- [x] 6. Configure overscan for smooth scrolling
- [x] 7. Verify build succeeds

### Done When

- [x] Virtual scrolling implemented for approval list
- [x] Only visible items are rendered in DOM (via virtualizer)
- [x] Fixed height container with overflow for virtual scroll
- [x] Overscan configured for smooth scrolling

**Note:** Build has pre-existing error in `app/(dashboard)/approvals/page.tsx` (missing `user`/`leaveType` in query result) - unrelated to this virtualization change.

## 🔄 Next Steps (Agent Instructions)

1. Complete steps autonomously and update live.
2. Upon completion: Update Master Plan (mark 2.1 [x]), then proceed to Task 2.2.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-23 | 1.0 | Checklist creation |
| 2026-02-23 | 1.1 | Implemented virtualization with @tanstack/react-virtual |
