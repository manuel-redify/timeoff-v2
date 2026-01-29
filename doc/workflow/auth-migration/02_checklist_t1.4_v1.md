# Task Checklist - Verify Connection & Integrity
**Version:** v1
**Date:** 2026-01-27
**Source:** 02_detailed_m1_v1.md

## ✅ Checklist for Task 1.4

### Steps
- [x] 1. Start `npx prisma studio`.
- [x] 2. Open Prisma Studio in the browser.
- [x] 3. Verify `User` model structure (columns, relations).
- [x] 4. Confirm new models (`Account`, `Session`, `VerificationToken`) are visible.
- [x] 5. Check if seed data (admin user) is visible in the `User` table.
- [x] 6. (Optional) Run a simple test script to ensure DB queries work against the new schema.

### Testing
- [x] Create a trivial query script (`src/check-db.ts`) to fetch a user.
- [x] Confirm no connection errors.

### Done When
- [x] Prisma Studio loads without error.
- [x] Database content matches expectations.
