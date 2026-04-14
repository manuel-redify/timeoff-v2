# Checklist Task 1.1: Update Bank Holiday model

- [x] Update `BankHoliday` in `prisma/schema.prisma`: add `year` (Int), `status` (String/Enum: 'PENDING', 'VALIDATED', defaulting to 'PENDING').
- [x] Add `isDeleted` (Boolean) to explicitly handle soft deletes for sync guards, or verify existing `deletedAt` suffices per project standards. (Verified: `deletedAt` is used per project standard)
- [x] Create a new migration file for the schema changes using `npx prisma migrate dev --name update_bank_holiday_schema` (manually generated due to remote drift to avoid resetting the database).
- [x] Update the generated migration SQL to backfill existing Bank Holidays.
- [x] Generate Prisma client (`npx prisma generate`).
- [x] Create/Update queries in `lib/holiday-service.ts` to fetch holidays by `country` and `year`.
- [x] Create a query `getActiveCountries(companyId: string, year: number)` that returns the `Company Country` + any `Employee Country` currently in use by active users.
- [x] Update existing `importHolidays` function signature/logic to accommodate new fields (`status: 'PENDING'`, `year`).
