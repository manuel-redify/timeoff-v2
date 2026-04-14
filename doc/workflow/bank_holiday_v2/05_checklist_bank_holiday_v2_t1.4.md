# Checklist Task 1.4: Implement data access layer queries

- [x] Create/Update queries in `lib/holiday-service.ts` to fetch holidays by `country` and `year`. (Created `getHolidays`)
- [x] Create a query `getActiveCountries(companyId: string, year: number)` that returns the `Company Country` + any `Employee Country` currently in use by active users.
- [x] Update existing `importHolidays` function signature/logic to accommodate new fields (`status: 'PENDING'`, `year`).