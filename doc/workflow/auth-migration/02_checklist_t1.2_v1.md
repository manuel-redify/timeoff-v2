# Task Checklist - Generate & Apply Migrations
**Version:** v1
**Date:** 2026-01-27
**Source:** 02_detailed_m1_v1.md

## ✅ Checklist for Task 1.2

### Steps
- [x] 1. Run `npx prisma migrate dev --name auth_js_migration` to generate the SQL migration file.
- [x] 2. Review the generated SQL migration file to ensure `clerkId` is dropped and new tables/columns are created correctly.
- [x] 3. Confirm the migration application to the local/dev database (Neon).
- [x] 4. Check the database schema in Neon (or via `npx prisma studio` or a DB client) to verify changes.

### Testing
- [x] Verify that the `User` table has `password`, `image`, `emailVerified` columns.
- [x] Verify that `clerkId` column is gone.
- [x] Verify that `accounts`, `sessions`, `verification_tokens` tables exist.

### Done When
- [x] Migration file is created in `prisma/migrations`.
- [x] Database schema matches the Prisma schema.
- [x] No data loss warnings (except for the intended `clerkId` drop).
