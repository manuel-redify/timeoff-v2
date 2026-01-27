# Task Checklist - Update Seed Script
**Version:** v1
**Date:** 2026-01-27
**Source:** 02_detailed_m1_v1.md

## ✅ Checklist for Task 1.3

### Steps
- [ ] 1. Install `bcryptjs` and `@types/bcryptjs`.
- [ ] 2. Update `prisma/seed.ts` to hash passwords.
- [ ] 3. Ensure admin user has a valid hashed password (use `DEV_DEFAULT_PASSWORD` env var).
- [ ] 4. Remove any Clerk-specific seeding from `prisma/seed.ts` (if any).
- [ ] 5. Run `npx prisma db seed`.

### Testing
- [ ] Verify that the admin user can be found in the database with a hashed password.

### Done When
- [ ] `prisma/seed.ts` runs without errors.
- [ ] User table contains at least one admin user with a password.
- [ ] No Clerk-related errors during seeding.
