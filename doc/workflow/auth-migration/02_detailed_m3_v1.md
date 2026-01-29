# Detailed Phase - Milestone 3 - Auth Migration
**Version:** v1
**Date:** 2026-01-29
**Source:** doc/workflow/auth-migration/02_task_plan_v1.md, doc/prd/prd_auth_migration.md

## 📝 Detailed Phase - Milestone 3: User Management & Admin Features

### Task 3.1: Implement `createUser` server action
1. [ ] Create `lib/actions/user.ts` (or append to existing actions)
2. [ ] Implement `createUser` with `auth()` session check (must be Admin)
3. [ ] Implement database transaction:
   - Create `User` record (with `password` hash in dev, null in prod)
   - Create initial `UserRoleArea` mapping
   - Create `Audit` log entry
4. [ ] Add company isolation: `companyId` must come from the admin's session
5. [ ] Add email uniqueness and role/area/department validity checks

**Effort:** M | **Skills:** auth.js, prisma

### Task 3.2: Implement SMTP2GO email service integration
1. [ ] Refine `lib/smtp2go.ts` to include `sendWelcomeEmail` function
2. [ ] Implement HTML email template with instructions:
   - Dev: Temporary password + link
   - Prod: Google OAuth instructions + link
3. [ ] Integrate `sendWelcomeEmail` at the end of `createUser` action
4. [ ] Log email delivery to `EmailAudit` table

**Effort:** S | **Skills:** smtp2go

### Task 3.3: Update Admin User Management UI
1. [ ] Locate the "Create User" form in the admin dashboard
2. [ ] Update form to use `useFormStatus` or `useActionState` for the `createUser` action
3. [ ] Add client-side validation and toast notifications for success/error
4. [ ] Ensure form fields match the `createUser` parameters (Department, Role, Area)

**Effort:** M | **Skills:** react, tailwind

### Task 3.4: Implement Login Page UI
1. [ ] Create or update `app/login/page.tsx`
2. [ ] Implement Credentials form (visible only in development)
3. [ ] Implement "Sign in with Google" button (always in prod, toggleable in dev)
4. [ ] Handle auth errors (redirect to `/login?error=...`)

**Effort:** M | **Skills:** auth.js, react
