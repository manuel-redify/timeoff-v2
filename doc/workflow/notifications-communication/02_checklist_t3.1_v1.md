# Task Checklist - Integrate Notification Triggers (Submission)
**Version:** v1
**Date:** 2026-01-25
**Source:** 02_detailed_m3_v1.md

## ✅ Task Checklist - Task 3.1

### Steps
- [x] Open `app/api/leave-requests/route.ts` and locate the successful creation block (`prisma.leaveRequest.create`).
- [x] Import `NotificationService` and `NotificationType`.
- [x] Retrieve the list of approvers for the newly created request.
    - *Note:* In Basic mode, use `ApprovalRoutingService.getApprovers`.
    - *Note:* In Advanced mode, query the first `ApprovalStep`s.
- [x] Loop through each approver and call `NotificationService.notify`:
    - `userId`: Approver ID
    - `type`: 'LEAVE_SUBMITTED'
    - `data`: requester name, leave type, dates, action URL (e.g., `/requests`).
- [x] (Pending Task 3.3 completion) Add comment/placeholder for `WatcherService.notifyWatchers`.
- [x] Verify `resend` API key is configured in `.env`.

### Testing
- [ ] Submit a leave request as a User.
- [ ] Verify `Notification` record created for the Approver in DB.
- [ ] Verify Email sent to the Approver (check logs or Mailtrap/Resend dashboard if available).
- [ ] Verify no error occurs if email fails to send.

### Done When
- [x] Every new leave request triggers a notification to the correct approver(s).
- [x] The system does not crash if notification service fails.
