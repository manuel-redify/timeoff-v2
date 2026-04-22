# Detailed Phase - Milestone 2: Email Template Update

**Parent:** 02_task_plan_approval_email.md
**Files Involved:** `emails/` (email templates), `lib/email.ts`

## Task 2.1: Update email template with new HTML layout
- [x] Locate existing leave request email template (LeaveRequestSubmitted.tsx)
- [x] Replace with new HTML layout from PRD Section 7
- [x] Verify all CSS styles are inline (email client compatibility)
- [x] Update LeaveRequestDecision.tsx if needed for consistency

## Task 2.2: Implement dynamic data mapping
- [x] Map `User.name` + `User.lastname` → `{{userName}}` in email template
- [x] Map `LeaveRequest.dateStart` → `{{startDate}}`
- [x] Map `LeaveRequest.dateEnd` → `{{endDate}}`
- [x] Map `LeaveType.name` → `{{leaveType}}`
- [x] Implement duration formatter in template or service:
  - If durationMinutes == minutesPerDay → "1 Day" or "Full Day"
  - If durationMinutes > minutesPerDay → calculate total days
  - If durationMinutes < minutesPerDay → show hours/minutes or DayPart
- [x] Map `LeaveRequest.employeeComment` → `{{userNotes}}`

## Task 2.3: Add Approve/Reject CTA URLs with tokens
- [x] Create email utility service to generate action tokens
- [x] Modify leave request creation flow to generate token when email is triggered
- [x] Build `{{approveUrl}}`: `/actions/approve/[token]`
- [x] Build `{{rejectUrl}}`: `/actions/reject/[token]`
- [x] Store token in LeaveRequest record (already done in Milestone 1)
- [x] Pass tokens to email template as variables

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Move to Milestone 3 after Task 2.3 is done.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-04-21 | 1.0 | Milestone breakdown |
