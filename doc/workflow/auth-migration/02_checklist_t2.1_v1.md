# Task Checklist - Task 2.1: Install Dependencies
**Version:** v1
**Date:** 2026-01-28
**Source:** doc/workflow/auth-migration/02_detailed_m2_v1.md

## ✅ Task Checklist - Task 2.1

### Steps
- [x] 1. Uninstall Clerk dependencies: `npm uninstall @clerk/nextjs svix`
- [x] 2. Remove Clerk middleware from `middleware.ts` (or delete if it's the only thing there) to prevent build errors immediately after uninstall.
- [x] 3. Install Auth.js dependencies: `npm install next-auth@beta @auth/prisma-adapter bcryptjs`
- [x] 4. Install dev dependencies: `npm install -D @types/bcryptjs`
- [x] 5. Verify `package.json` to ensure `@clerk/nextjs` is gone and `next-auth` is present.

### Testing
- [x] Run `npm run dev` to ensure the project still boots (expecting failures in pages using Clerk, but dependency resolution should pass). Note: Full build will fail until code is refactored, but `dev` server should start if middleware is cleared.

### Done When
- [x] `package.json` contains `next-auth`, `@auth/prisma-adapter`, `bcryptjs`.
- [x] `package.json` does NOT contain `@clerk/nextjs`, `svix`.
