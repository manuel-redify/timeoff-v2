# Checklist Task 4.2: Enforce 1-year future navigation limit

- [x] Locate the Year navigation controls in the Team/Calendar view (`components/calendar/calendar-header.tsx` or similar).
- [x] Add a `disabled` condition to the "Next Year" button if `currentViewYear >= new Date().getFullYear() + 1`.
- [x] Add visual feedback (tooltip or muted button) to indicate the limit has been reached.