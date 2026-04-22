# Checklist - Task 2.2

**Parent:** 02_detailed_m2_approval_email.md

## Steps
- [x] Step 1: Map `User.name` + `User.lastname` → `{{userName}}` in email template
- [x] Step 2: Map `LeaveRequest.dateStart` → `{{startDate}}`
- [x] Step 3: Map `LeaveRequest.dateEnd` → `{{endDate}}`
- [x] Step 4: Map `LeaveType.name` → `{{leaveType}}`
- [x] Step 5: Implement duration formatter in template or service
- [x] Step 6: Map `LeaveRequest.employeeComment` → `{{userNotes}}`

## Done When
- [x] Email templates correctly display user's full name
- [x] Email templates correctly display start and end dates
- [x] Email templates correctly display leave type
- [x] Email templates correctly display formatted duration (days/hours/minutes)
- [x] Email templates correctly display user notes/comments
- [x] All data mapping works in both LeaveRequestSubmitted and LeaveRequestDecision emails

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-04-21 | 1.0 | Checklist creation |