# Checklist Task 2.5: Implement year-transition massive automated import

- [x] In `lib/holiday-service.ts`, create a new function `importHolidaysForActiveCountries(companyId, year)`.
- [x] This function should use the `getActiveCountries` query (from Task 1.4) to get all active countries.
- [x] Loop through each active country and call the protected `importHolidays(companyId, country, year)` method.
- [x] Expose this via a server action in `lib/actions/holiday.ts` so it can be called from the frontend when navigating to a new year.