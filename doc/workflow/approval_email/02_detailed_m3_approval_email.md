# Detailed Phase - Milestone 3: Quick Approval Flow

**Parent:** 02_task_plan_approval_email.md
**Files Involved:** `app/actions/approve/page.tsx`, `app/api/approve/route.ts` (or Server Action)

## Task 3.1: Create GET /actions/approve/[token] landing page
- [ ] Create route `app/actions/approve/[token]/page.tsx`
- [ ] Validate token from URL params
- [ ] Check token is not expired
- [ ] Check request status is still NEW
- [ ] Display confirmation UI with request details
- [ ] Add "Approve Now" button (triggers POST)

## Task 3.2: Implement POST /api/approve (or Server Action)
- [ ] Create Server Action `approveRequest(token, managerId)`
- [ ] Re-validate token server-side
- [ ] Update LeaveRequest: status = APPROVED, decidedAt = now(), approverId = managerId
- [ ] Invalidate action token (set to null or mark as used)
- [ ] Handle race conditions (concurrent approval attempts)

## Task 3.3: Add audit log entry on approval
- [ ] Create Audit record: entityType = "LeaveRequest"
- [ ] Record attribute = "status", newValue = "APPROVED"
- [ ] Add comment = "Action via Email"
- [ ] Set byUserId = managerId

## Task 3.4: Build success feedback UI
- [ ] Show success message with request summary
- [ ] Use Lucide Check icon for visual feedback
- [ ] Display: employee name, dates, leave type, duration
- [ ] Add link to login for more actions

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Move to Milestone 4 after Task 3.4 is done.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-04-21 | 1.0 | Milestone breakdown |
