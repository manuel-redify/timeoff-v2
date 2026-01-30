# Task Checklist - Task 4.2 - Auth Migration
**Version:** v1
**Date:** 2026-01-29
**Source:** doc/workflow/auth-migration/02_detailed_m4_v1.md

## ✅ Task Checklist - Task 4.2: Verify full authentication flow

### Steps
- [x] **Development Auth (Credentials):**
    - [x] Sign in with correct email/password (Dev only)
    - [x] Attempt sign in with incorrect password
    - [x] Attempt sign in with non-existent email
    - [x] Verify toast notifications for errors
- [x] **Production Auth (Google OAuth):**
    - [x] Click "Sign in with Google"
    - [x] Verify redirection to Google consent screen
    - [x] Verify successful redirection back to dashboard after approval
    - [x] Check `Account` table in Prisma Studio for linked Google account
- [x] **Session Verification:**
    - [x] Use `npx prisma studio` to inspect `Session` table
    - [x] Confirm a new record exists for logged-in user
    - [x] Verify `expires` date is set correctly (30 days ahead)
- [x] **Logout Flow:**
    - [x] Click Logout button
    - [x] Verify redirection to `/login`
    - [x] Verify `Session` record is deleted or updated in database
    - [x] Attempt to visit protected `/dashboard` after logout (should redirect)

### Testing
- [x] Manual end-to-end flow in local development environment
- [x] Manual end-to-end flow in staging/production (if available for OAuth)

### Done When
- [x] Both Credential and OAuth flows work as expected
- [x] Database sessions are correctly synchronized with login/logout actions
- [x] Protected routes are successfully blocked after logout
