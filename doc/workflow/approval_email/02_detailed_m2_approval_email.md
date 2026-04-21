# Detailed Phase - Milestone 2: Email Template Update

**Parent:** 02_task_plan_approval_email.md
**Files Involved:** `emails/` (email templates), `lib/email.ts`

## Task 2.1: Update email template with new HTML layout
- [ ] Locate existing leave request email template
- [ ] Replace with new HTML layout from PRD Section 7
- [ ] Verify all CSS styles are inline (email client compatibility)

## Task 2.2: Implement dynamic data mapping
- [ ] Map `User.name` + `User.lastname` → `{{userName}}`
- [ ] Map `LeaveRequest.dateStart` → `{{startDate}}`
- [ ] Map `LeaveRequest.dateEnd` → `{{endDate}}`
- [ ] Map `LeaveType.name` → `{{leaveType}}`
- [ ] Implement duration formatter:
  - If durationMinutes == minutesPerDay → "1 Day" or "Full Day"
  - If durationMinutes > minutesPerDay → calculate total days
  - If durationMinutes < minutesPerDay → show hours/minutes or DayPart
- [ ] Map `LeaveRequest.employeeComment` → `{{userNotes}}`

## Task 2.3: Add Approve/Reject CTA URLs with tokens
- [ ] Generate action token when email is triggered
- [ ] Build `{{approveUrl}}`: `/actions/approve/[token]`
- [ ] Build `{{rejectUrl}}`: `/actions/reject/[token]`
- [ ] Store token in LeaveRequest record

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Move to Milestone 3 after Task 2.3 is done.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-04-21 | 1.0 | Milestone breakdown |
