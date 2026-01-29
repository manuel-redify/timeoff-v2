# Task Checklist - Task 2.5 - Type Safety Extensions
**Version:** v1
**Date:** 2026-01-29
**Source:** doc/workflow/auth-migration/01_prd_analysis_v1.md

## ✅ Task Checklist - Task 2.5

### Steps
- [x] Create `types` directory at root (if it doesn't exist)
- [x] Create `types/next-auth.d.ts`
- [x] Import `DefaultSession` from `"next-auth"`
- [x] Add `declare module "next-auth"` augmentation block
- [x] Extend `Session` interface:
    - [x] Define `user` property
    - [x] Include `id: string`, `companyId: string`, `isAdmin: boolean`
    - [x] Intersection with `DefaultSession["user"]`
- [x] Extend `User` interface:
    - [x] Include `id: string`, `companyId: string`, `isAdmin: boolean`
- [x] Add `declare module "next-auth/jwt"` augmentation block (for completeness)
    - [x] Extend `JWT` interface with same custom fields
- [x] Verify TypeScript recognition by checking a server action or component that uses `auth()`

### Testing
- [x] Run `npx tsc --noEmit` to verify no type errors in project related to session fields
- [x] Check autocomplete on `session.user` in a temporary test file

### Done When
- [x] `types/next-auth.d.ts` is correctly implemented
- [x] Custom fields `id`, `companyId`, and `isAdmin` are available on `session.user` object without type casting
- [x] Build passes without TypeScript errors in auth-related code