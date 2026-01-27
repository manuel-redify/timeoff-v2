# Task Checklist - Generate & Apply Migrations
**Version:** v1
**Date:** 2026-01-27
**Source:** 02_detailed_m1_v1.md

## ✅ Checklist for Task 1.2

### Steps
- [ ] 1. Run `npx prisma migrate dev --name auth_js_migration` to generate the SQL migration file.
- [ ] 2. Review the generated SQL migration file to ensure `clerkId` is dropped and new tables/columns are created correctly.
- [ ] 3. Confirm the migration application to the local/dev database (Neon).
- [ ] 4. Check the database schema in Neon (or via `npx prisma studio` or a DB client) to verify changes.

### Testing
- [ ] Verify that the `User` table has `password`, `image`, `emailVerified` columns.
- [ ] Verify that `clerkId` column is gone.
- [ ] Verify that `accounts`, `sessions`, `verification_tokens` tables exist.

### Done When
- [ ] Migration file is created in `prisma/migrations`.
- [ ] Database schema matches the Prisma schema.
- [ ] No data loss warnings (except for the intended `clerkId` drop).
