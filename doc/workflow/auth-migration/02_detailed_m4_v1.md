# Detailed Phase - Milestone 4 - Auth Migration
**Version:** v1
**Date:** 2026-01-29
**Source:** doc/workflow/auth-migration/02_task_plan_v1.md, doc/workflow/auth-migration/01_prd_analysis_v1.md

## 📝 Detailed Phase - Milestone 4: Cleanup & Verification

### Task 4.1: Remove Clerk dependencies and code references
1. [ ] Uninstall `@clerk/nextjs` package
2. [ ] Perform a global search for `clerk` and remove all remaining imports and logic
3. [ ] Remove Clerk-related environment variables from `.env.example` and documentation
4. [ ] Remove any Clerk-specific middleware or configuration files (e.g., `middleware.ts` if replaced by `proxy.ts`)

**Effort:** S | **Skills:** node.js, git

### Task 4.2: Verify full authentication flow
1. [ ] Verify Dev login: Test email/password flow with valid and invalid credentials
2. [ ] Verify OAuth login: Test Google Sign-In flow (ensure redirection and user creation work)
3. [ ] Verify Session Management: Check `Session` table in Prisma Studio after login
4. [ ] Verify Logout: Ensure session is revoked in database and user redirected to `/login`

**Effort:** M | **Skills:** auth.js, testing

### Task 4.3: Verify access revocation and RBAC
1. [ ] Test Access Revocation: Manually delete a session or set `active: false` on a user and verify immediate blocking
2. [ ] Test Admin Protection: Ensure `/admin/*` routes are inaccessible to `USER` role
3. [ ] Test Company Isolation: Verify users cannot access data from other companies via API or UI
4. [ ] Test Contract Enforcement: Verify login fails if `contractEnd` date is in the past

**Effort:** M | **Skills:** auth.js, prisma

### Task 4.4: Update documentation
1. [ ] Update `README.md` with new Auth.js setup instructions and environment variables
2. [ ] Create `doc/05_google_oauth_setup.md` with steps for Google Cloud Console configuration
3. [ ] Document the new "Invite-only" user provisioning workflow for admins

**Effort:** S | **Skills:** documentation
