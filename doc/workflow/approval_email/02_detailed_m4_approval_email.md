# Detailed Phase - Milestone 4: Rejection Flow

**Parent:** 02_task_plan_approval_email.md
**Files Involved:** `app/actions/reject/[token]/page.tsx`, `app/api/reject/route.ts` (or Server Action)

## Task 4.1: Create GET /actions/reject/[token] page with Shadcn form
- [ ] Create route `app/actions/reject/[token]/page.tsx`
- [ ] Validate token from URL params
- [ ] Check token is not expired
- [ ] Check request status is still NEW
- [ ] Display request data summary (employee, dates, duration in minutes/hours)

## Task 4.2: Add mandatory textarea for approverComment
- [ ] Add Shadcn `Textarea` component
- [ ] Set as required field
- [ ] Add validation: minimum length or meaningful error message
- [ ] Style for mobile-friendly input

## Task 4.3: Implement POST rejection logic
- [ ] Create Server Action `rejectRequest(token, managerId, comment)`
- [ ] Re-validate token server-side
- [ ] Update LeaveRequest: status = REJECTED, approverComment = input, decidedAt = now()
- [ ] Invalidate action token

## Task 4.4: Build confirmation/redirect UI
- [ ] Redirect to success confirmation page
- [ ] Show rejection confirmation with summary
- [ ] Use Lucide X icon for visual feedback
- [ ] Add link to login for more actions

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Move to Milestone 5 after Task 4.4 is done.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-04-21 | 1.0 | Milestone breakdown |