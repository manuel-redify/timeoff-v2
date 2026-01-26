# Task Checklist - Integrate Notification Triggers (Decisions)
**Version:** v1
**Date:** 2026-01-25
**Source:** 02_detailed_m3_v1.md

## ✅ Task Checklist - Task 3.2

### Steps
- [x] **Approval:** Open `app/api/leave-requests/[id]/approve/route.ts`.
    - [x] Locate the final approval update (status becomes `APPROVED`).
    - [x] Call `NotificationService.notify` for Requester (`LEAVE_APPROVED`).
    - [x] Call `WatcherService.notifyWatchers`.
- [x] **Rejection:** Open `app/api/leave-requests/[id]/reject/route.ts`.
    - [x] Locate the rejection update.
    - [x] Call `NotificationService.notify` for the Requester (`LEAVE_REJECTED`).
    - [x] Call `WatcherService.notifyWatchers`.
- [x] **Cancellation:** Open `app/api/leave-requests/[id]/cancel/route.ts`.
    - [x] If canceled by user, notify pending approvers? (Optional but good UX).
    - [x] If canceled by user, notify watchers? (Optional).
- [x] Check `process.env.NEXT_PUBLIC_APP_URL` or similar for constructing action URLs.

### Testing
- [ ] Approve a request as Manager -> Check `Notification` for User.
- [ ] Reject a request as Manager -> Check `Notification` for User.
- [ ] Verify email content contains correct dynamic data (Start Date, End Date, Comment).

### Done When
- [x] Users receive immediate feedback via email/in-app when their request status changes.
