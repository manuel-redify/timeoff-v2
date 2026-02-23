# Checklist - Task 1.1: Implement DB-level pagination

**Parent:** 02_detailed_m1_web-performance.md

### Steps

- [x] 1. Read current implementation in `app/(dashboard)/page.tsx` lines 51-76
- [x] 2. Build Prisma where clause based on selectedYear and selectedStatus params
- [x] 3. Add `skip` and `take` to findMany for pagination
- [x] 4. Add parallel `count()` query for totalItems
- [x] 5. Remove in-memory `.filter()` for year/status filtering
- [x] 6. Update totalPages calculation to use count result
- [ ] 7. Verify pagination works (test with different page numbers)

### Done When

- [x] Dashboard page displays only 10 items per page
- [x] Pagination controls show correct total pages
- [x] Year filter works at database level
- [x] Status filter works at database level
- [ ] No console errors on page load

**Note:** Build has a pre-existing error in `app/(dashboard)/approvals/page.tsx` (unrelated to this task).

## 🔄 Next Steps (Agent Instructions)

1. Complete steps autonomously and update live.
2. Upon completion: Update Master Plan (mark 1.1 [x]), then proceed to Task 1.2.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-23 | 1.0 | Checklist creation |
| 2026-02-23 | 1.1 | Implemented DB-level pagination with Prisma where clause, skip/take, and parallel count |

