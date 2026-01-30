# Task Checklist - Task 4.3 - Auth Migration
**Version:** v1
**Date:** 2026-01-29
**Source:** doc/workflow/auth-migration/02_detailed_m4_v1.md

## ✅ Task Checklist - Task 4.3: Verify access revocation and RBAC

### Steps
- [x] **Access Revocation:**
    - [x] Log in as a test user.
    - [x] Open Prisma Studio and delete the user's active session.
    - [x] Refresh the application page and verify immediate redirect to `/login`.
    - [x] Set `active: false` for the user in the database.
    - [x] Attempt to log in again and verify that the `signIn` callback prevents access.
- [x] **Admin Protection (RBAC):**
    - [x] Log in as a user with `USER` role.
    - [x] Manually navigate to `/admin` or any admin sub-route.
    - [x] Verify that user is redirected or sees an "Access Denied" message.
    - [x] Verify that admin-only server actions reject requests from non-admin users.
- [x] **Multi-Tenancy (Company Isolation):**
    - [x] Log in as User A from Company 1.
    - [x] Attempt to access a resource (e.g., a specific leave request ID) belonging to Company 2 via direct URL.
    - [x] Verify that the application returns a 404 or unauthorized error.
- [x] **Contract Dates Enforcement:**
    - [x] Set a user's `contractEnd` date to yesterday.
    - [x] Attempt to log in and verify that the `signIn` callback blocks the session.

### Testing
- [x] Role-switching tests (change roles in database and verify UI updates).
- [x] Direct API testing (Postman/Curl) to ensure server actions validate session roles.

### Done When
- [x] Permission changes in the database result in immediate access updates.
- [x] Admin routes and actions are strictly protected.
- [x] Users are successfully isolated within their own company data.
- [x] Expired contracts automatically block authentication.
