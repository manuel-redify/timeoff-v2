# Detailed Phase - Milestone 1
**Parent:** 02_task_plan_bank_holiday_v2.md
**Files Involved:** 
- `prisma/schema.prisma`
- `prisma/migrations/*`
- `lib/holiday-service.ts`
- `lib/actions/user.ts`
- `lib/company-service.ts`

### Task 1.1: Update Bank Holiday model
1. [ ] Update `BankHoliday` in `prisma/schema.prisma`: add `year` (Int), `status` (String/Enum: 'PENDING', 'VALIDATED', defaulting to 'PENDING').
2. [ ] Add `isDeleted` (Boolean) to explicitly handle soft deletes for sync guards, or verify existing `deletedAt` suffices per project standards.
3. [ ] Generate Prisma client (`npx prisma generate`).

### Task 1.2: Ensure User and Company models support Country mapping
1. [ ] Verify `Company` model has `country` field (Already exists as `String @db.Char(2)`).
2. [ ] Verify `User` model has `country` field (Already exists as `String? @db.Char(2)`).
3. [ ] No database changes required here, just validating schema alignment with PRD.

### Task 1.3: Create database migrations
1. [ ] Create a new migration file for the schema changes using `npx prisma migrate dev --name update_bank_holiday_schema`.
2. [ ] Update the generated migration SQL to backfill existing Bank Holidays (e.g. `UPDATE bank_holidays SET year = EXTRACT(YEAR FROM date), status = 'VALIDATED'`).

### Task 1.4: Implement data access layer queries
1. [ ] Create/Update queries in `lib/holiday-service.ts` to fetch holidays by `country` and `year`.
2. [ ] Create a query `getActiveCountries(companyId: string, year: number)` that returns the `Company Country` + any `Employee Country` currently in use by active users.
3. [ ] Update existing `importHolidays` function signature/logic to accommodate new fields (`status: 'PENDING'`, `year`).

## 🔄 Next Steps
- Complete all tasks sequentially. Create the checklist for Task 1.1 first (`02_checklist_bank_holiday_v2_t1.1.md`), execute it, commit, then proceed to the next.
- Update Master Plan for each completion.
- Archive each checklist when its task is finished.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-04-10 | 1.0 | Milestone breakdown |
