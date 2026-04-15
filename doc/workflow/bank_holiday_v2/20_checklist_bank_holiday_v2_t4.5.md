# Checklist Task 4.5: Admin Email Reminder CRON

- [x] Create a new API route (e.g., `app/api/cron/holiday-reminder/route.ts`) designed to be hit by a Cron scheduler.
- [x] The logic should check if the current date is ~November 1st (2 months before year-end).
- [x] If true, fetch all Admins for all companies.
- [x] Send an automated email using `lib/smtp2go.ts`: *"Reminder: Please validate Bank Holidays for [Upcoming Year] across all active countries."*
- [x] Document the required cron schedule configuration (e.g., `0 0 1 11 *`) in the deployment/infrastructure docs.