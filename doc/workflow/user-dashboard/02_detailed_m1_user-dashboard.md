# Detailed Phase - Milestone 1: Foundation & Core Infrastructure
**Parent:** 02_task_plan_user-dashboard.md
**Files Involved:** TBD (likely `lib/`, `components/`, `prisma/`)

### Task 1.1: Create Duration Calculation Helper (F03)
**Effort:** L
1. [ ] Create `lib/calculateDuration.ts` helper function
2. [ ] Implement day iteration logic between dateStart and dateEnd
3. [ ] Add Schedule model check for weekday working status (value 1/2)
4. [ ] Add BankHoliday filter by companyId and country
5. [ ] Handle half-day logic (MORNING/AFTERNOON = 0.5)
6. [ ] Export function for use across components

### Task 1.2: Set up Prisma Queries (F13)
**Effort:** M
1. [ ] Create query for fetching user's leave requests with includes
2. [ ] Ensure leaveType relation is included
3. [ ] Ensure approvalSteps relation is included and ordered by sequenceOrder
4. [ ] Add query methods for Hero Card (next leave)
5. [ ] Add query methods for KPI calculations

### Task 1.3: Implement Skeleton Screen Components (F14)
**Effort:** S
1. [ ] Create `SkeletonCard.tsx` component
2. [ ] Create `SkeletonTable.tsx` component
3. [ ] Integrate skeletons into dashboard page loading state

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Archive this checklist when Task 1.1-1.3 are finished.
- Proceed to Milestone 2: Dashboard Layout & Hero Card

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-18 | 1.0 | Milestone breakdown |
