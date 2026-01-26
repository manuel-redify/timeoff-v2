# Task Checklist - Implement Watcher Rules Logic
**Version:** v1
**Date:** 2026-01-25
**Source:** 02_detailed_m3_v1.md

## ✅ Task Checklist - Task 3.3

### Steps
- [ ] Create `lib/services/watcher.service.ts`.
- [ ] Implement `getWatchersForRequest(leaveRequestId, companyId)`:
    - [ ] Fetch the `LeaveRequest` with `User`, `Department`, `Project` (through `UserProject`?).
    - [ ] Fetch all `WatcherRule`s for the `companyId`.
    - [ ] Filter rules that match:
        - `requestType` (or ALL)
        - `departmentId` matching user's department (if rule has `teamId` constraint? Schema says `teamId`, `projectId`, `roleId`).
        - `projectId` matching user's active projects for this leave?
    - [ ] Resolve `WatcherRule` targets:
        - If `roleId` is set, find all users with that `Role` in the company.
        - If `teamScopeRequired`, filter those users to be in the same `Team`/`Department`?
- [ ] Deduplicate list of `userId`s.
- [ ] Remove `requesterId` and `approverId` from the list (don't notify them as watchers of their own action).
- [ ] Implement `notifyWatchers(requestId, type)`:
    - [ ] Call `getWatchersForRequest`.
    - [ ] Loop and call `NotificationService.notify`.

### Testing
- [ ] Create a `WatcherRule` (e.g., Role=HR gets all notifications).
- [ ] Submit a request.
- [ ] Verify HR user receives notification.
- [ ] Create a Department-scoped rule.
- [ ] Verify HR in *other* department does NOT receive it (if scoped).

### Done When
- [ ] `WatcherRule`s are effectively applied to notification distribution.
- [ ] Arbitrary users defined by rules receive updates.
