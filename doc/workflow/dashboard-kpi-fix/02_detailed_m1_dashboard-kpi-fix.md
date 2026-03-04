# Detailed Phase - Milestone 1
**Parent:** 02_task_plan_dashboard-kpi-fix.md
**Files Involved:** 
- `lib/services/leave-request.service.ts`
- `lib/allowance-service.ts`
- `app/(dashboard)/page.tsx`

### Task [1.1]: Fix `LeaveStatus` and `DayPart` casing in `LeaveRequestService.ts`
1. [ ] Correct `status` literals to lowercase in `getLeaveRequests`, `getNextLeave`, `getLeavesTakenYTD`, `getPendingRequests`, `getUpcomingCount`, `getLeaveRequestsWithDuration`, `checkOverlap`.
2. [ ] Use the `LeaveStatus` and `DayPart` enums from `@/lib/generated/prisma/enums` instead of string literals.

### Task [1.2]: Fix `LeaveStatus` casing in `AllowanceService.ts`
1. [ ] Update raw SQL query in `calculateConsumption` to use lowercase status strings (already lowercase, but verify consistency).
2. [ ] Update TypeScript logic using `LeaveStatus`.

### Task [1.3]: Audit and fix other occurrences
1. [ ] Scan `app/api/` for case-sensitive status checks.
2. [ ] Scan `components/` for case-sensitive status checks.

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Archive this checklist when task 1.1 is finished.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-03-04 | 1.0 | Milestone breakdown |
