# Task Checklist - Task 1.4: Notification Event Bus
**Version:** v1
**Date:** 2026-01-25
**Source:** 02_detailed_m1_v1.md

## ✅ Task Checklist - Task 1.4

### Steps
- [x] Create `lib/services/notification.service.ts` with `NotificationService` class
- [x] Define `NotificationType` enum or literal types (e.g., `LEAVE_SUBMITTED`, `LEAVE_APPROVED`, `LEAVE_REJECTED`, `WELCOME`)
- [x] Implement `notify()` method:
  - Input: `userId`, `type`, `data` (payload for templates), `companyId` (optional)
  - Strategy:
    1. Fetch `NotificationPreference` for user and type
    2. If preference is `NONE`, skip
    3. If preference includes `IN_APP`, create `Notification` record in DB
    4. If preference includes `EMAIL`, render React Email template and send via Resend
    5. Log to `EmailAudit` if email sent
- [x] Implement helper to render templates to string (for `EmailAudit` and Resend)
- [x] Ensure the service handles errors gracefully (e.g., email failing shouldn't block notification record creation)

### Testing
- [x] Unit test or manual script calling `NotificationService.notify()`

### Done When
- [x] A functional notification service exists that can dispatch messages based on user preferences
- [x] Preferences are correctly fetched and respected
- [x] Emails are logged in `EmailAudit`

## Debug Log
**Date:** 2026-01-26
**Issue:** Runtime Error: Invalid response format: missing pagination.total in `hooks/use-notification-badge.ts`
**Root cause:** API endpoint `/api/notifications` returns data wrapped in `{ success: true, data: { ... } }` (standard `ApiResponse`), but the hook code `data.pagination` assumed a flat structure.
**Fix:** Updated `fetchUnreadCount` in `hooks/use-notification-badge.ts` to unwrap `response.data` if present (`const data = responseData.data || responseData`).
**Verified:** Code analysis confirms API returns wrapped structure. Fix logic accounts for both wrapped and unwrapped (safe fallback).
