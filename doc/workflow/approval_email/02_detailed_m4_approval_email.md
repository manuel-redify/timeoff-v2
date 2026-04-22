# Detailed Phase - Milestone 4: Rejection Flow

**Parent:** 02_task_plan_approval_email.md
**Files Involved:** `app/actions/reject/[token]/page.tsx`, `app/api/reject/route.ts` (Server Action)

## Task 4.1: Create GET /actions/reject/[token] page with Shadcn form
- [x] Create route `app/actions/reject/[token]/page.tsx`
- [x] Validate token from URL params
- [x] Check token is not expired
- [x] Check request status is still NEW
- [x] Display request data summary (employee, dates, duration in minutes/hours)
- [x] Add Shadcn UI form with mandatory textarea for approverComment
- [x] Add "Confirm Rejection" button

## Task 4.2: Add mandatory textarea for approverComment
- [x] Add Shadcn `Textarea` component
- [x] Set as required field with validation
- [x] Add validation: minimum length (e.g., 10 characters) for meaningful feedback
- [x] Style for mobile-friendly input
- [x] Show character count or remaining characters

## Task 4.3: Implement POST rejection logic
- [x] Create Server Action `rejectRequest(token, managerId, comment)`
- [x] Re-validate token server-side (existence, expiry, request status)
- [x] Update LeaveRequest: status = REJECTED, approverComment = input, decidedAt = now()
- [x] Invalidate action token (set to null or mark as used)
- [x] Handle race conditions (concurrent rejection attempts)

## Task 4.4: Build confirmation/redirect UI
- [x] Redirect to success confirmation page after rejection
- [x] Show rejection confirmation with summary
- [x] Use Lucide X icon for visual feedback
- [x] Display: employee name, dates, leave type, duration, and supervisor comment
- [x] Add link to login for more actions