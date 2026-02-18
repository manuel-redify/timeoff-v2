# Detailed Phase - Milestone 3: KPI Satellite Cards
**Parent:** 02_task_plan_user-dashboard.md
**Files Involved:** `components/`, `lib/`

### Task 3.1: Satellite Card - Leaves Taken YTD (F02.1) ✅
**Effort:** S
1. [x] Create `KPICard.tsx` base component for satellite cards
2. [x] Implement Leaves Taken YTD calculation (sum of approved days in current calendar year)
3. [x] Connect to Prisma query from Task 1.2
4. [x] Display with semibold label value

### Task 3.2: Satellite Card - Pending Requests (F02.2) ✅
**Effort:** S
1. [x] Implement count query for status NEW or PENDING_REVOKE
2. [x] Add Neon Lime dot (#e2f337) in card corner when count > 0
3. [x] Position dot in top-right corner of card

### Task 3.3: Satellite Card - Upcoming Count (F02.3) ✅
**Effort:** S
1. [x] Implement count query for approved requests with future dateStart
2. [x] Display count in standard KPI card format

### Task 3.4: Satellite Card - Balance (Conditional) (F02.4) ✅
**Effort:** M
1. [x] Check if Company.defaultAllowance or Department.allowance != NULL
2. [x] Calculate: Allowance - Taken
3. [x] Only render card when allowance is defined
4. [x] Apply semibold styling for value

### Task 3.5: Grid Reflow Handling (F02.4) ✅
**Effort:** S
1. [x] When Balance card is hidden, expand Hero Card or recompact grid
2. [x] Ensure responsive layout handles dynamic card visibility

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Archive this checklist when Task 3.1-3.5 are finished.
- Proceed to Milestone 4: Requests Table

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-18 | 1.0 | Milestone breakdown |
| 2026-02-18 | 1.1 | Task 3.1 completed |
| 2026-02-18 | 1.2 | Task 3.2 completed |
| 2026-02-18 | 1.3 | Task 3.3 completed |
| 2026-02-18 | 1.4 | Task 3.4 completed |
| 2026-02-18 | 1.5 | Task 3.5 completed - Milestone 3 complete |
