# Detailed Phase - Milestone 1: Database & Schema Migration
**Version:** v1
**Date:** 2026-01-27
**Source:** 02_task_plan_v1.md

## 📝 Detailed Phase

### Task 1.1: Update Prisma Schema
1. [x] Remove `clerkId` from `User` model.
2. [x] Add `password`, `image`, `emailVerified` to `User` model.
3. [x] Add `Account` model (Auth.js adapter).
4. [x] Add `Session` model (Auth.js adapter).
5. [x] Add `VerificationToken` model (Auth.js adapter).
6. [x] Ensure all relations and indexes are correctly defined.

**Effort:** S | **Skills:** backend.md

### Task 1.2: Generate & Apply Migrations
1. [X] Run `npx prisma migrate dev --name auth_js_migration`.
2. [X] specific migration script verification.
3. [X] Verify migration was applied to Neon DB.

**Effort:** S | **Skills:** backend.md

### Task 1.3: Update Seed Script
1. [X] Modify `prisma/seed.ts` to use `bcryptjs` for password hashing.
2. [X] Update seed data to include `password` (hashed) for admin user.
3. [X] Remove any Clerk-specific seeding logic.
4. [X] Run `npx prisma db seed` to verify.

**Effort:** S | **Skills:** backend.md

### Task 1.4: Verify Connection & Integrity
1. [X] Check Prisma Studio (`npx prisma studio`) to see new tables.
2. [X] Verify `User` table structure matches requirements.

**Effort:** S | **Skills:** backend.md
