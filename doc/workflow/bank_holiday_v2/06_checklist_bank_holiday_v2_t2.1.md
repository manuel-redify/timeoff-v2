# Checklist Task 2.1: Implement API integration

- [x] Update `importHolidays` in `lib/holiday-service.ts` to accept `year` as a parameter.
- [x] Integrate with an external API (like Nager.Date: `https://date.nager.at/api/v3/PublicHolidays/{year}/{countryCode}`) or expand the static dictionary if an external API is not feasible. Ensure it dynamically fetches data for the requested year.
- [x] Map the API response to the `BankHoliday` Prisma structure (handling date conversion and defaulting `status` to `PENDING`).