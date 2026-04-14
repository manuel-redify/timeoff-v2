# Checklist Task 3.4: Implement UI for "Validate All"

- [x] Add a "Validate All" button near the Year/Country selector.
- [x] This button should only be enabled if there are holidays with `status: 'PENDING'` currently displayed in the table.
- [x] Create a server action `validateHolidays(companyId, country, year)` that updates all `PENDING` holidays matching the criteria to `VALIDATED`.
- [x] Bind the button to this action, showing a toast on success and reloading the table.