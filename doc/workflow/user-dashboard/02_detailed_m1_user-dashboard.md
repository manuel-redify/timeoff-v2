# Detailed Phase - Milestone 1: Foundation & Core Infrastructure
**Parent:** 02_task_plan_user-dashboard.md
**Files Involved:** TBD (likely `lib/`, `components/`, `prisma/`)

### Task 1.1: Create Duration Calculation Helper (F03) ✅
**Effort:** L
1. [x] Create `lib/calculateDuration.ts` helper function
2. [x] Implement day iteration logic between dateStart and dateEnd
3. [x] Add Schedule model check for weekday working status (value 1/2)
4. [x] Add BankHoliday filter by companyId and country
5. [x] Handle half-day logic (MORNING/AFTERNOON = 0.5)
6. [x] Export function for use across components

### Task 1.2: Set up Prisma Queries (F13) ✅
**Effort:** M
1. [x] Create query for fetching user's leave requests with includes
2. [x] Ensure leaveType relation is included
3. [x] Ensure approvalSteps relation is included and ordered by sequenceOrder
4. [x] Add query methods for Hero Card (next leave)
5. [x] Add query methods for KPI calculations

### Task 1.3: Implement Skeleton Screen Components (F14) ✅
**Effort:** S
1. [x] Create `SkeletonCard.tsx` component
2. [x] Create `SkeletonTable.tsx` component
3. [x] Integrate skeletons into dashboard page loading state

## 🔄 Next Steps
- ~~Complete all tasks. Update Master Plan for each completion.~~
- ~~Archive this checklist when Task 1.1-1.3 are finished.~~
- **Milestone 1 complete. Proceed to Milestone 2: Dashboard Layout & Hero Card**

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-18 | 1.0 | Milestone breakdown |
| 2026-02-18 | 1.1 | Task 1.1 completed |
| 2026-02-18 | 1.2 | Tasks 1.2-1.3 completed. Milestone 1 finished |
