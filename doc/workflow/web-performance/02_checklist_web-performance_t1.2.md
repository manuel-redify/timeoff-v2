# Checklist - Task 1.2: Add Promise.all() for parallel database queries

**Parent:** 02_detailed_m1_web-performance.md

### Steps

- [x] 1. Read current implementation to identify sequential queries
- [x] 2. Refactor 5 sequential service calls to use Promise.all()
- [x] 3. Verify no type errors after refactoring

### Done When

- [x] AllowanceService and LeaveRequestService calls run in parallel
- [ ] Build succeeds without errors

## 🔄 Next Steps (Agent Instructions)

1. Complete steps autonomously and update live.
2. Upon completion: Update Master Plan (mark 1.2 [x]), then proceed to Task 1.3.

**Note:** Build has a pre-existing error in `app/(dashboard)/approvals/page.tsx` (unrelated to this task).

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-23 | 1.0 | Checklist creation |
| 2026-02-23 | 1.1 | Refactored 5 sequential queries to use Promise.all() |
