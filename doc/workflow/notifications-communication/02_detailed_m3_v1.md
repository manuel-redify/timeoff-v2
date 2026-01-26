# Detailed Phase - Milestone 3: Integration & Workflow
**Version:** v1
**Date:** 2026-01-25
**Source:** 02_task_plan_v1.md

## 📝 Detailed Phase - Milestone 3

### Task 3.1: Integrate notification triggers into Leave Request submission
1. [x] Identify submission points in `app/api/leave-requests/route.ts`.
2. [x] Retrieve approvers for the new request (using `ApprovalRoutingService` or `ApprovalStep`s).
3. [x] Call `NotificationService.notify` for each approver (Type: `LEAVE_SUBMITTED`).
4. [x] Integrate Watcher logic (see Task 3.3) to notify relevant watchers.

**Effort:** M | **Skills:** `backend.md`

### Task 3.2: Integrate notification triggers into Approval/Rejection/Cancellation flows
1. [x] Update `app/api/leave-requests/[id]/approve/route.ts`:
    - Notify requester (Type: `LEAVE_APPROVED`).
    - Notify watchers (Type: `LEAVE_APPROVED`).
2. [x] Update `app/api/leave-requests/[id]/reject/route.ts`:
    - Notify requester (Type: `LEAVE_REJECTED`).
    - Notify watchers (Type: `LEAVE_REJECTED`).
3. [x] Update `app/api/leave-requests/[id]/cancel/route.ts`:
    - Notify approver(s) if request was pending? (Or notify watchers).
4. [x] Ensure notifications respect the final status (e.g. only notify APPROVED when *fully* approved in multi-step).

**Effort:** M | **Skills:** `backend.md`

### Task 3.3: Implement `watcher_rules` logic in the notification service
1. [x] Create `lib/services/watcher.service.ts` (or add to `NotificationService`).
2. [x] Implement `getWatchersForRequest(leaveRequestId: string)`:
    - Query `WatcherRule` table.
    - Match rules based on:
        - `requestType` (leave type or generic)
        - `companyId`
        - `departmentId` / `teamId` (of requester)
        - `projectId` (if applicable)
3. [x] Create `notifyWatchers(leaveRequestId: string, type: NotificationType)` helper.
4. [ ] Add unit/service tests for watcher resolution logic.

**Effort:** L | **Skills:** `backend.md`

### Task 3.4: Complete `EmailAudit` integration for all sent communications
1. [x] Review `NotificationService` to ensure `EmailAudit.create` captures all email attempts.
2. [x] Verify `userId` and `companyId` are correctly populated in audit logs.
3. [ ] Add `EmailAudit` UI or check if it exists in Admin panel (optional, scope check).
4. [x] Ensure `resend` errors are logged but don't crash the main flow.

**Effort:** S | **Skills:** `backend.md`
