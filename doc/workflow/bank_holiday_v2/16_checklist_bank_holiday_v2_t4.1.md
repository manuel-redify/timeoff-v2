# Checklist Task 4.1: Update Team View context

- [x] Identify the main query powering the Team/Calendar view that fetches holidays.
- [x] Modify the data fetching logic to pull bank holidays based on the **Employee Country** for each user row, rather than just the Company Country.
- [x] If the current view groups holidays globally, refactor it to map `User.country -> BankHoliday` so that a UK user sees UK holidays, and an IT user sees IT holidays on the same calendar.