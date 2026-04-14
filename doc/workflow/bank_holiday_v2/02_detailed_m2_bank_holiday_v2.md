# Detailed Phase - Milestone 2
**Parent:** 02_task_plan_bank_holiday_v2.md
**Files Involved:** 
- `lib/holiday-service.ts`
- `lib/actions/user.ts` (User creation/update)
- `lib/actions/holiday.ts` (Server actions for holidays - to be created/updated)

### Task 2.1: Implement API integration
1. [x] Update `importHolidays` in `lib/holiday-service.ts` to accept `year` as a parameter.
2. [x] Integrate with an external API (like Nager.Date: `https://date.nager.at/api/v3/PublicHolidays/{year}/{countryCode}`) or expand the static dictionary if an external API is not feasible. Ensure it dynamically fetches data for the requested year.
3. [x] Map the API response to the `BankHoliday` Prisma structure (handling date conversion and defaulting `status` to `PENDING`).

### Task 2.2: Implement import logic with Sync Guard
1. [x] In `lib/holiday-service.ts`, fetch existing holidays for the given `companyId`, `country`, and `year`.
2. [x] Implement the "Sync Guard": when syncing, ignore (do not overwrite/delete) any existing holiday date that has `isDeleted: true` (or `deletedAt !== null`) OR has `status: 'VALIDATED'` (or any custom manual overrides).
3. [x] Only insert new dates that do not exist yet, defaulting them to `PENDING`.

### Task 2.3: Trigger imports on User Creation/Update
1. [x] In `lib/actions/user.ts` (`createUser` function), check if the `params.country` is provided.
2. [x] If provided, check if any bank holidays exist for that country in the current year.
3. [x] If no holidays exist, trigger `importHolidays(companyId, country, currentYear)` asynchronously.
4. [x] Implement the same logic for User Update (if a user's country is changed) within the respective update action.
5. [x] Return a flag or trigger a toast notification payload to inform the admin ("Imported X holidays for new country: Y").

### Task 2.4: Implement batch processing for Bulk Uploads
1. [x] Locate or create the Bulk User Upload logic.
2. [x] Before processing, extract all unique `country` codes from the uploaded batch.
3. [x] Check which of these unique countries have missing holidays for the current year.
4. [x] Run `importHolidays` once per missing country to avoid redundant calls, then proceed with user creation.

### Task 2.5: Implement year-transition massive automated import
1. [x] In `lib/holiday-service.ts`, create a new function `importHolidaysForActiveCountries(companyId, year)`.
2. [x] This function should use the `getActiveCountries` query (from Task 1.4) to get all active countries.
3. [x] Loop through each active country and call the protected `importHolidays(companyId, country, year)` method.
4. [x] Expose this via a server action in `lib/actions/holiday.ts` so it can be called from the frontend when navigating to a new year.

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Archive this checklist when tasks 2.1 - 2.5 are finished.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-04-10 | 1.0 | Milestone 2 breakdown |
