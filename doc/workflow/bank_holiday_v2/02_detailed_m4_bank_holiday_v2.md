# Detailed Phase - Milestone 4
**Parent:** 02_task_plan_bank_holiday_v2.md
**Files Involved:** 
- `app/(dashboard)/calendar/page.tsx` or related calendar view components
- `components/calendar/calendar-header.tsx`
- Cron job configuration / API route (`app/api/cron/reminders/route.ts` or similar)

### Task 4.1: Update Team View context
1. [x] Identify the main query powering the Team/Calendar view that fetches holidays.
2. [x] Modify the data fetching logic to pull bank holidays based on the **Employee Country** for each user row, rather than just the Company Country.
3. [x] If the current view groups holidays globally, refactor it to map `User.country -> BankHoliday` so that a UK user sees UK holidays, and an IT user sees IT holidays on the same calendar.

### Task 4.2: Enforce 1-year future navigation limit
1. [x] Locate the Year navigation controls in the Team/Calendar view (`components/calendar/calendar-header.tsx` or similar).
2. [x] Add a `disabled` condition to the "Next Year" button if `currentViewYear >= new Date().getFullYear() + 1`.
3. [x] Add visual feedback (tooltip or muted button) to indicate the limit has been reached.

### Task 4.3: Missing data placeholder state
1. [x] In the Team View, check if the fetched bank holidays for the currently viewed year and countries have a `VALIDATED` status.
2. [x] If a user's country has no validated holidays for the viewed year, render a specific UI placeholder/banner: *"Bank Holidays for [Year] have not been confirmed for your country yet. Please contact your administrator."*
3. [x] Ensure this warning is non-blocking but highly visible.

### Task 4.4: In-app toast notifications for background imports
1. [x] Review the User Creation/Update flow (`lib/actions/user.ts` modified in Task 2.3).
2. [x] Ensure that when an automatic import is triggered and completes, a toast notification payload is sent back to the client-side component to display: "Imported X holidays for new country: Y".
3. [x] Note: Since Next.js server actions are request-scoped, this might require returning a flag in the action response and triggering the toast in the client component's `onSuccess` handler.

### Task 4.5: Admin Email Reminder CRON
1. [x] Create a new API route (e.g., `app/api/cron/holiday-reminder/route.ts`) designed to be hit by a Cron scheduler.
2. [x] The logic should check if the current date is ~November 1st (2 months before year-end).
3. [x] If true, fetch all Admins for all companies.
4. [x] Send an automated email using `lib/smtp2go.ts`: *"Reminder: Please validate Bank Holidays for [Upcoming Year] across all active countries."*
5. [x] Document the required cron schedule configuration (e.g., `0 0 1 11 *`) in the deployment/infrastructure docs.

## 🔄 Next Steps
- Start executing the Master Plan by picking up Task 1.1.
- Archive this checklist when tasks 4.1 - 4.5 are finished.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-04-10 | 1.0 | Milestone 4 breakdown |
