# Detailed Phase - Milestone 2 - Auth.js Foundation
**Version:** v1
**Date:** 2026-01-28
**Source:** doc/prd/prd_auth_migration.md

## 📝 Detailed Phase - Milestone 2

### Task 2.1: Install dependencies
1. [X] Remove old Clerk dependencies (if safe to do incrementally) or ensure no conflict.
2. [X] Install core Auth.js packages: `npm install next-auth@beta @auth/prisma-adapter bcryptjs`
3. [X] Install development types: `npm install -D @types/bcryptjs`
4. [X] Verify `package.json` updates.

**Effort:** S | **Skills:** backend.md

### Task 2.2: Configure environment variables
1. [X] Generate `AUTH_SECRET` using `openssl rand -base64 33`.
2. [X] Add `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` placeholders (or real values if available).
3. [X] Add `SMTP2GO_API_KEY` placeholder.
4. [X] Define `DEV_DEFAULT_PASSWORD` and `ENABLE_OAUTH_IN_DEV`.
5. [X] Update `.env` (local) and prepare snippet for `.env.production`.

**Effort:** S | **Skills:** backend.md

### Task 2.3: Implement `auth.ts` configuration
1. [X] Create `auth.ts` (or `lib/auth.ts`).
2. [X] Configure `PrismaAdapter`.
3. [X] Implement `session` strategy (Database, 30 days).
4. [X] Add `GoogleProvider` with production/dev logic.
5. [X] Add `CredentialsProvider` (Dev logic only).
6. [X] Implement `signIn` callback (User exists?, Activated?, Terminated?, OAuth linking).
7. [X] Implement `session` callback (Attach companyId, isAdmin, etc.).

**Effort:** M | **Skills:** backend.md

### Task 2.4: Implement Middleware (proxy.ts)
1. [X] Create `proxy.ts` in root.
2. [X] Import `auth` from `auth.ts`.
3. [X] Configure `matcher` to protect `/dashboard`, `/admin`, `/api/actions`.
4. [X] Ensure public routes (login) are excluded.

**Effort:** S | **Skills:** backend.md

### Task 2.5: Create types/next-auth.d.ts
1. [X] Create `types/next-auth.d.ts`.
2. [X] Extend `Session` interface (add `firstName`, `lastName`, `companyId`, `isAdmin`).
3. [X] Extend `User` interface.
4. [X] Verify TypeScript compilation picks up the new types.

**Effort:** S | **Skills:** typescript.md

### Task 2.6: Configure Google OAuth credentials
1. [ ] (External) Go to Google Cloud Console.
2. [ ] Create/Select project.
3. [ ] Setup OAuth Consent Screen.
4. [ ] Create OAuth Client ID (Web App).
5. [ ] Add Authorized Redirect URIs (`/api/auth/callback/google`).
6. [ ] Update `.env` with generated Client ID and Secret.

**Effort:** S | **Skills:** devops.md
