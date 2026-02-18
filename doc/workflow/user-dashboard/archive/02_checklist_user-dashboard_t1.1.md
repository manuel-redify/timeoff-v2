# Checklist - Task 1.1: Duration Calculation Helper
**Parent:** 02_detailed_m1_user-dashboard.md

### Steps
- [x] Step 1: Create `lib/calculateDuration.ts` file with function signature
- [x] Step 2: Implement day iteration between dateStart and dateEnd (inclusive of start, exclusive of end+1)
- [x] Step 3: Add Schedule model check - check if weekday has value 1 (working) or value 2 (non-working)
- [x] Step 4: Add BankHoliday check - query holidays filtered by companyId and country
- [x] Step 5: Handle half-day logic - if dayPartStart is MORNING, count 0.5; if dayPartEnd is AFTERNOON, count 0.5
- [x] Step 6: Export typed function for use in components
- [x] Step 7: Write unit tests for helper function

### Done When
- [x] Helper function correctly calculates working days excluding non-working weekdays
- [x] Helper function excludes bank holidays
- [x] Half-day values are correctly handled (0.5 increments)
- [x] Function is importable in React components

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-18 | 1.0 | Checklist creation |
| 2026-02-18 | 1.1 | All steps completed. Committed as dc655b1 |
