# Detailed Phase - Milestone 3: Quick Approval Flow

**Parent:** 02_task_plan_approval_email.md
**Files Involved:** `app/actions/approve/[token]/page.tsx`, `app/api/approve/route.ts` (Server Action)

## Task 3.1: Create GET /actions/approve/[token] landing page
- [x] Create route `app/actions/approve/[token]/page.tsx`
- [x] Validate token from URL params
- [x] Check token is not expired
- [x] Check request status is still NEW
- [x] Display confirmation UI with request details
- [x] Add "Approve Now" button (triggers POST)

## Task 3.2: Implement POST /api/approve (or Server Action)
- [x] Create Server Action `approveRequest(token, managerId)`
- [x] Re-validate token server-side
- [x] Update LeaveRequest: status = APPROVED, decidedAt = now(), approverId = managerId
- [x] Invalidate action token (set to null or mark as used)
- [x] Handle race conditions (concurrent approval attempts)

## Task 3.3: Add audit log entry on approval
- [x] Create Audit record: entityType = "LeaveRequest"
- [x] Record attribute = "status", newValue = "APPROVED"
- [x] Add comment = "Action via Email"
- [x] Set byUserId = managerId

## Task 3.4: Build success feedback UI
- [x] Show success message with request summary
- [x] Use Lucide Check icon for visual feedback
- [x] Display: employee name, dates, leave type, duration
- [x] Add link to login for more actions