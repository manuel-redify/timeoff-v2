# Checklist Task 2.3: Trigger imports on User Creation/Update

- [x] In `lib/actions/user.ts` (`createUser` function), check if the `params.country` is provided.
- [x] If provided, check if any bank holidays exist for that country in the current year.
- [x] If no holidays exist, trigger `importHolidays(companyId, country, currentYear)` asynchronously.
- [x] Implement the same logic for User Update (if a user's country is changed) within the respective update action.
- [x] Return a flag or trigger a toast notification payload to inform the admin ("Imported X holidays for new country: Y").