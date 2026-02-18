# Checklist - Task 1.2: Prisma Queries Setup
**Parent:** 02_detailed_m1_user-dashboard.md

### Steps
- [x] Step 1: Explore existing Prisma schema to understand LeaveRequest, LeaveType, ApprovalStep models
- [x] Step 2: Create repository/service file for leave request queries (e.g., `lib/leave-request.ts`)
- [x] Step 3: Implement `getLeaveRequests` with `include` for `leaveType` and `approvalSteps` (ordered by sequenceOrder)
- [x] Step 4: Implement `getNextLeave` query - dateEnd >= TODAY, status APPROVED/NEW, ordered by dateStart ASC
- [x] Step 5: Implement `getLeavesTakenYTD` - sum approved days for current calendar year
- [x] Step 6: Implement `getPendingRequests` - count where status is NEW or PENDING_REVOKE
- [x] Step 7: Implement `getUpcomingCount` - count approved requests with future dateStart
- [x] Step 8: Implement `getUserAllowance` - fetch Company.defaultAllowance or Department.allowance
- [x] Step 9: Add TypeScript types for query return values

### Done When
- [x] All queries return properly typed data
- [x] leaveType and approvalSteps relations are included
- [x] approvalSteps are ordered by sequenceOrder
- [x] Queries can be imported and used in API routes/components

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-18 | 1.0 | Checklist creation |
