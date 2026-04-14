# Checklist Task 3.2: Add/Refine Country filtering dropdown

- [x] Validate that the existing Country dropdown (`<Select value={selectedCountry} ...>`) in `app/(dashboard)/settings/holidays/page.tsx` defaults to the `Company Country`.
- [x] Ensure it fetches and populates only **Active Countries** (from the new `getActiveCountries` query).