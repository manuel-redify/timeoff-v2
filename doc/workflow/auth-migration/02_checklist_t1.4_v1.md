# Task Checklist - Verify Connection & Integrity
**Version:** v1
**Date:** 2026-01-27
**Source:** 02_detailed_m1_v1.md

## ✅ Checklist for Task 1.4

### Steps
- [ ] 1. Start `npx prisma studio`.
- [ ] 2. Open Prisma Studio in the browser.
- [ ] 3. Verify `User` model structure (columns, relations).
- [ ] 4. Confirm new models (`Account`, `Session`, `VerificationToken`) are visible.
- [ ] 5. Check if seed data (admin user) is visible in the `User` table.
- [ ] 6. (Optional) Run a simple test script to ensure DB queries work against the new schema.

### Testing
- [ ] Create a trivial query script (`src/check-db.ts`) to fetch a user.
- [ ] Confirm no connection errors.

### Done When
- [ ] Prisma Studio loads without error.
- [ ] Database content matches expectations.
