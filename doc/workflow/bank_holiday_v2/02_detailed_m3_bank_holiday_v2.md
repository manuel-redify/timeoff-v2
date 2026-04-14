# Detailed Phase - Milestone 3
**Parent:** 02_task_plan_bank_holiday_v2.md
**Files Involved:** 
- `app/(dashboard)/settings/holidays/page.tsx`
- `app/api/holidays/route.ts` (API route for handling holidays)
- `lib/actions/holiday.ts` (Server actions)

### Task 3.1: Build initial manual import UI trigger
1. [x] Check existing manual import trigger in `app/(dashboard)/settings/holidays/page.tsx`.
2. [x] Ensure the manual import correctly passes the `Company Country` initially.
3. [x] If the current list of countries in the dropdown is not populated from active countries, modify `loadCountries()` API or action to fetch distinct `country` from `User` joined with `Company Country`.

### Task 3.2: Add/Refine Country filtering dropdown
1. [x] Validate that the existing Country dropdown (`<Select value={selectedCountry} ...>`) in `app/(dashboard)/settings/holidays/page.tsx` defaults to the `Company Country`.
2. [x] Ensure it fetches and populates only **Active Countries** (from the new `getActiveCountries` query).

### Task 3.3: Implement Year navigation massive import trigger
1. [x] In `app/(dashboard)/settings/holidays/page.tsx`, intercept the Year navigation (`setCurrentYear`).
2. [x] When a user navigates to a new year, trigger the `importHolidaysForActiveCountries` action (created in Task 2.5) BEFORE loading the holidays for that year.
3. [x] Wait for the background import to finish before fetching and displaying the table data, or show a loading state while the import syncs.

### Task 3.4: Implement UI for "Validate All"
1. [x] Add a "Validate All" button near the Year/Country selector.
2. [x] This button should only be enabled if there are holidays with `status: 'PENDING'` currently displayed in the table.
3. [x] Create a server action `validateHolidays(companyId, country, year)` that updates all `PENDING` holidays matching the criteria to `VALIDATED`.
4. [x] Bind the button to this action, showing a toast on success and reloading the table.

### Task 3.5: Implement Soft Delete and Manual Addition
1. [x] Update the `onDelete` function/API in `app/(dashboard)/settings/holidays/page.tsx` to perform a soft delete (`isDeleted: true` or set `deletedAt`) instead of a physical deletion.
2. [x] Ensure the UI Table filters out soft-deleted holidays.
3. [x] Ensure the "Add Holiday" form correctly tags manually added holidays as `VALIDATED` (so they bypass the Sync Guard logic).

## 🔄 Next Steps
- Complete all tasks sequentially. Update Master Plan for each completion.
- Archive this checklist when tasks 3.1 - 3.5 are finished.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-04-10 | 1.0 | Milestone 3 breakdown |
