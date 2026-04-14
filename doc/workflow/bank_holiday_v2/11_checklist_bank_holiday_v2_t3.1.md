# Checklist Task 3.1: Build initial manual import UI trigger

- [x] Check existing manual import trigger in `app/(dashboard)/settings/holidays/page.tsx`.
- [x] Ensure the manual import correctly passes the `Company Country` initially.
- [x] If the current list of countries in the dropdown is not populated from active countries, modify `loadCountries()` API or action to fetch distinct `country` from `User` joined with `Company Country`.