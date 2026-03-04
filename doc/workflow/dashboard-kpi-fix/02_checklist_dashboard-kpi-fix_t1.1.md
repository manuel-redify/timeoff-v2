# Checklist - Task [1.1]
**Parent:** 02_detailed_m1_dashboard-kpi-fix.md

### Steps
- [ ] Step 1: Replace `'APPROVED'` with `LeaveStatus.APPROVED` in `LeaveRequestService.ts`.
- [ ] Step 2: Replace `'NEW'` with `LeaveStatus.NEW` in `LeaveRequestService.ts`.
- [ ] Step 3: Replace `'PENDING_REVOKE'` with `LeaveStatus.PENDING_REVOKE` in `LeaveRequestService.ts`.
- [ ] Step 4: Verify `DayPart` usage and ensure it matches `DayPart.ALL`, `DayPart.MORNING`, `DayPart.AFTERNOON`.
- [ ] Step 5: Check `getLeavesTakenYTD` specifically for any other hardcoded strings.

### Done When
- [ ] `LeaveRequestService.ts` uses enums for all status and daypart checks.
- [ ] Code compiles without type errors.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-03-04 | 1.0 | Checklist creation |
