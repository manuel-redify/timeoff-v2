# Task Checklist - Update Prisma Schema
**Version:** v1
**Date:** 2026-01-27
**Source:** 02_detailed_m1_v1.md

## ✅ Checklist for Task 1.1

### Steps
- [x] 1. Read `prisma/schema.prisma` to understand current structure.
- [x] 2. Locate `User` model and remove `clerkId` field.
- [x] 3. Add `password` (String?), `image` (String?), `emailVerified` (DateTime?) to `User` model.
- [x] 4. Add `Account` model definition (Auth.js adapter).
- [x] 5. Add `Session` model definition (Auth.js adapter).
- [x] 6. Add `VerificationToken` model definition (Auth.js adapter).
- [x] 7. Add relations to `User` model (`accounts`, `sessions`).
- [x] 8. format the schema file `npx prisma format`.

### Testing
- [x] Run `npx prisma validate` to ensure schema syntax is correct.

### Done When
- [x] `schema.prisma` contains all Auth.js required models.
- [x] `User` model has necessary fields for Auth.js.
- [x] `npx prisma validate` returns success.
