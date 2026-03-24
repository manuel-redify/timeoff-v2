# Detailed Phase - Milestone 3: Admin On-Behalf Flow

**Parent:** 02_task_plan_period_management_leave_request.md
**Files Involved:** 
- `components/requests/leave-request-form.tsx`
- `components/ui/combobox.tsx`
- `lib/services/leave-request.service.ts`
- `lib/services/user.service.ts`
- `lib/actions/leave-request.actions.ts`
- `prisma/schema.prisma`

## Task 3.1: Create Employee Combobox with Search

1. [x] **Add employee Combobox component**
   - Use existing `components/ui/command.tsx` (Combobox pattern)
   - Search employees by name/email within same company
   - Show employee name and department in dropdown

2. [x] **Implement search API**
   - Create endpoint or server action to search users
   - Filter by companyId and activated status
   - Support pagination for large organizations

3. [x] **Add admin mode toggle**
   - Detect if current user is admin
   - Show employee selector only for admins
   - Standard users skip to userId from session

**Effort:** M

## Task 3.2: Async Context Loading

1. [x] **Create user context loader**
   - When employee is selected, fetch:
     - Current allowance balance
     - Permitted leave types for user's contract
     - Project/Area associations

2. [x] **Update form state**
   - Replace leave types dropdown with user-specific options
   - Update balance display
   - Pre-populate relevant fields

3. [x] **Add loading states**
   - Show skeleton/spinner while loading
   - Handle errors gracefully

**Effort:** M

## Task 3.3: Privilege Override for Balance

1. [x] **Add admin override flag**
   - Add `forceCreate` parameter to create action
   - Admins can bypass allowance warning

2. [x] **Update validation logic**
   - Check user role before allowing override
   - Log override action for audit

3. [x] **UI feedback**
   - Show checkbox "Create even if balance exceeded"
   - Only visible to admins

**Effort:** S

## Task 3.4: Default APPROVED Status

1. [x] **Modify leave creation logic**
   - If created by admin (byUserId != userId), set status to APPROVED
   - Unless admin explicitly selects different status

2. [x] **Add status selector for admins**
   - Dropdown: APPROVED, NEW (pending), REJECTED
   - Default to APPROVED for admin-created requests

3. [x] **Skip approval workflow**
   - For admin-created APPROVED requests, skip approval steps
   - Set approverId to admin user

**Effort:** M

## Task 3.5: Audit Trail (byUserId, userId)

1. [x] **Add byUserId to schema**
   - Add `byUserId String? @map("by_user_id")` to LeaveRequest model
   - Create migration

2. [x] **Populate on create**
   - Set byUserId to current session user (admin)
   - Set userId to selected employee

3. [x] **Create audit records**
   - Log leave request creation in Audit model
   - Include both byUserId and userId
   - Track status changes

**Effort:** M

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Archive this checklist when Milestone 3 is finished.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-03-03 | 1.0 | Milestone breakdown |
