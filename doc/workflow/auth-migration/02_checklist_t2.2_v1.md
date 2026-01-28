# Task Checklist - Task 2.2: Configure Environment Variables
**Version:** v1
**Date:** 2026-01-28
**Source:** doc/workflow/auth-migration/02_detailed_m2_v1.md

## ✅ Task Checklist - Task 2.2

### Steps
- [ ] 1. Generate `AUTH_SECRET` by running `openssl rand -base64 33` in terminal.
- [ ] 2. Update `.env` file with `AUTH_SECRET="<generated-value>"`.
- [ ] 3. Add Google OAuth placeholders to `.env`:
  ```bash
  AUTH_GOOGLE_ID="placeholder-id"
  AUTH_GOOGLE_SECRET="placeholder-secret"
  ```
- [ ] 4. Add SMTP2GO placeholder to `.env`: `SMTP2GO_API_KEY="placeholder-key"`
- [ ] 5. Add dev-specific variables to `.env`:
  ```bash
  # Application Logic
  DEV_DEFAULT_PASSWORD="Welcome2024!"
  ENABLE_OAUTH_IN_DEV="false"
  ```
- [ ] 6. Check if `.env.local` exists and ensure it doesn't conflict (or consolidate into `.env` if preferred for this stack).
- [ ] 7. Create/Update `.env.example` to reflect new required schema (retaining standard keys like `DATABASE_URL` but removing Clerk keys).

### Testing
- [ ] Verify `process.env.AUTH_SECRET` is accessible (can be done via a quick temp script or checking next dev startup logs if verbose).

### Done When
- [ ] `.env` has all Auth.js required keys.
- [ ] `.env.example` is updated for team sharing.
