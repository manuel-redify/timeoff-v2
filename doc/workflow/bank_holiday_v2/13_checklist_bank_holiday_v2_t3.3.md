# Checklist Task 3.3: Implement Year navigation massive import trigger

- [x] In `app/(dashboard)/settings/holidays/page.tsx`, intercept the Year navigation (`setCurrentYear`).
- [x] When a user navigates to a new year, trigger the `importHolidaysForActiveCountries` action (created in Task 2.5) BEFORE loading the holidays for that year.
- [x] Wait for the background import to finish before fetching and displaying the table data, or show a loading state while the import syncs.