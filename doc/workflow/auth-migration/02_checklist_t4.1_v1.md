# Task Checklist - Task 4.1 - Auth Migration
**Version:** v1
**Date:** 2026-01-29
**Source:** doc/workflow/auth-migration/02_detailed_m4_v1.md

## ✅ Task Checklist - Task 4.1: Remove Clerk dependencies and code references

### Steps
- [ ] Run `npm uninstall @clerk/nextjs`
- [ ] Remove Clerk environment variables from `.env` and `.env.local`
- [ ] Find and remove `<ClerkProvider>` from the root `layout.tsx`
- [ ] Replace or remove Clerk-specific UI components (e.g., `<UserButton>`, `<SignInButton>`)
- [ ] Scan and remove `auth()`, `currentUser()`, and other Clerk hooks from all components
- [ ] Update `middleware.ts` to remove Clerk's `clerkMiddleware` or `authMiddleware`
- [ ] Verify `package.json` no longer contains `@clerk` dependencies
- [ ] Reset and verify that no Clerk-specific scripts exist in `package.json`

### Testing
- [ ] Run `npm run build` to ensure no stale Clerk imports remain
- [ ] Verify local server starts without environment variable warnings related to Clerk
- [ ] Check console for any "Clerk not initialized" errors in the browser

### Done When
- [ ] codebase is completely free of any `@clerk/nextjs` imports
- [ ] Application builds and runs successfully in development mode
- [ ] Clerk environment variables are purged from the project
