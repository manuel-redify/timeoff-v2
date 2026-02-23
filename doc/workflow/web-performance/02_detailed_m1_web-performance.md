# Detailed Phase - Milestone 1: Database & Query Optimizations

**Parent:** 02_task_plan_web-performance.md
**Files Involved:** 
- `app/(dashboard)/page.tsx`
- `lib/services/leave-request.service.ts`
- `lib/allowance-service.ts`

### Task 1.1: Implement DB-level pagination in dashboard page

1. [x] Modify `app/(dashboard)/page.tsx` to move filtering from JavaScript to Prisma where clause
2. [x] Add `skip` and `take` parameters for pagination at database level
3. [x] Use Prisma `count()` to get total items for pagination controls
4. [x] Remove in-memory `.filter()` call for year/status filtering

**Effort:** M

**Status:** Completed - DB-level pagination implemented with Prisma where clause, skip/take pagination, and parallel count query.

### Task 1.2: Add Promise.all() for parallel database queries

1. [x] Refactor sequential `await` calls in `app/(dashboard)/page.tsx` to use `Promise.all()`
2. [x] Parallelize: AllowanceService, LeaveRequestService calls (5 queries total)

**Effort:** S

**Status:** Completed - 5 sequential queries now run in parallel with Promise.all()

### Task 1.3: Add database indexes for common queries (if needed)

1. [x] Review Prisma schema for existing indexes on LeaveRequest table
2. [x] Add index on `userId` + `dateStart` if not present for year filtering
3. [x] Add index on `status` for status filtering

**Effort:** M

**Status:** Completed - Existing indexes cover query patterns (userId, status, dateStart, deletedAt). No new indexes needed.

---

## 🔄 Next Steps
- Complete all tasks in this milestone.
- Update Master Plan for each completion (mark tasks [x]).
- Create Detailed Phase for Milestone 2 after completing Milestone 1.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-23 | 1.0 | Milestone breakdown |
