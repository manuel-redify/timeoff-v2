# Task Checklist - Task 4.3 - Auth Migration
**Version:** v1
**Date:** 2026-01-29
**Source:** doc/workflow/auth-migration/02_detailed_m4_v1.md

## ✅ Task Checklist - Task 4.3: Verify access revocation and RBAC

### Steps
- [ ] **Access Revocation:**
    - [ ] Log in as a test user.
    - [ ] Open Prisma Studio and delete the user's active session.
    - [ ] Refresh the application page and verify immediate redirect to `/login`.
    - [ ] Set `active: false` for the user in the database.
    - [ ] Attempt to log in again and verify that the `signIn` callback prevents access.
- [ ] **Admin Protection (RBAC):**
    - [ ] Log in as a user with the `USER` role.
    - [ ] Manually navigate to `/admin` or any admin sub-route.
    - [ ] Verify that the user is redirected or sees an "Access Denied" message.
    - [ ] Verify that admin-only server actions reject requests from non-admin users.
- [ ] **Multi-Tenancy (Company Isolation):**
    - [ ] Log in as User A from Company 1.
    - [ ] Attempt to access a resource (e.g., a specific leave request ID) belonging to Company 2 via direct URL.
    - [ ] Verify that the application returns a 404 or unauthorized error.
- [ ] **Contract Dates Enforcement:**
    - [ ] Set a user's `contractEnd` date to yesterday.
    - [ ] Attempt to log in and verify that the `signIn` callback blocks the session.

### Testing
- [ ] Role-switching tests (change roles in database and verify UI updates).
- [ ] Direct API testing (Postman/Curl) to ensure server actions validate session roles.

### Done When
- [ ] Permission changes in the database result in immediate access updates.
- [ ] Admin routes and actions are strictly protected.
- [ ] Users are successfully isolated within their own company data.
- [ ] Expired contracts automatically block authentication.
