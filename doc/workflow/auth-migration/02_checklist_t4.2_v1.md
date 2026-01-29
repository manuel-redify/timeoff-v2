# Task Checklist - Task 4.2 - Auth Migration
**Version:** v1
**Date:** 2026-01-29
**Source:** doc/workflow/auth-migration/02_detailed_m4_v1.md

## ✅ Task Checklist - Task 4.2: Verify full authentication flow

### Steps
- [ ] **Development Auth (Credentials):**
    - [ ] Sign in with correct email/password (Dev only)
    - [ ] Attempt sign in with incorrect password
    - [ ] Attempt sign in with non-existent email
    - [ ] Verify toast notifications for errors
- [ ] **Production Auth (Google OAuth):**
    - [ ] Click "Sign in with Google"
    - [ ] Verify redirection to Google consent screen
    - [ ] Verify successful redirection back to dashboard after approval
    - [ ] Check `Account` table in Prisma Studio for linked Google account
- [ ] **Session Verification:**
    - [ ] Use `npx prisma studio` to inspect the `Session` table
    - [ ] Confirm a new record exists for the logged-in user
    - [ ] Verify `expires` date is set correctly (30 days ahead)
- [ ] **Logout Flow:**
    - [ ] Click Logout button
    - [ ] Verify redirection to `/login`
    - [ ] Verify `Session` record is deleted or updated in the database
    - [ ] Attempt to visit protected `/dashboard` after logout (should redirect)

### Testing
- [ ] Manual end-to-end flow in local development environment
- [ ] Manual end-to-end flow in staging/production (if available for OAuth)

### Done When
- [ ] Both Credential and OAuth flows work as expected
- [ ] Database sessions are correctly synchronized with login/logout actions
- [ ] Protected routes are successfully blocked after logout
