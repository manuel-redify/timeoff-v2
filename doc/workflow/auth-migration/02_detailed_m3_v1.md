# Detailed Phase - Milestone 3 - Auth Migration
**Version:** v1
**Date:** 2026-01-29
**Source:** doc/workflow/auth-migration/02_task_plan_v1.md, doc/prd/prd_auth_migration.md

## 📝 Detailed Phase - Milestone 3: User Management & Admin Features

### Task 3.1: Implement `createUser` server action
1. [X] Create `lib/actions/user.ts` (or append to existing actions)
2. [X] Implement `createUser` with `auth()` session check (must be Admin)
3. [X] Implement database transaction:
   - Create `User` record (with `password` hash in dev, null in prod)
   - Create initial `UserRoleArea` mapping
   - Create `Audit` log entry
4. [X] Add company isolation: `companyId` must come from the admin's session
5. [X] Add email uniqueness and role/area/department validity checks

**Effort:** M | **Skills:** auth.js, prisma

### Task 3.2: Implement SMTP2GO email service integration
1. [X] Refine `lib/smtp2go.ts` to include `sendWelcomeEmail` function
2. [X] Implement HTML email template with instructions:
   - Dev: Temporary password + link
   - Prod: Google OAuth instructions + link
3. [X] Integrate `sendWelcomeEmail` at the end of `createUser` action
4. [X] Log email delivery to `EmailAudit` table

**Effort:** S | **Skills:** smtp2go

### Task 3.3: Update Admin User Management UI
1. [X] Locate the "Create User" form in the admin dashboard
2. [X] Update form to use `useFormStatus` or `useActionState` for the `createUser` action
3. [X] Add client-side validation and toast notifications for success/error
4. [X] Ensure form fields match the `createUser` parameters (Department, Role, Area)

**Effort:** M | **Skills:** react, tailwind

### Task 3.4: Implement Login Page UI
1. [X] Create or update `app/login/page.tsx`
2. [X] Implement Credentials form (visible only in development)
3. [X] Implement "Sign in with Google" button (always in prod, toggleable in dev)
4. [X] Handle auth errors (redirect to `/login?error=...`)

**Effort:** M | **Skills:** auth.js, react
