# Task Plan - Auth Migration
**Version:** v1
**Date:** 2026-01-27
**Source:** doc/prd/prd_auth_migration.md

## 📋 Master Plan

### Milestone 1: Database & Schema Migration (Priority: High)
- [X] 1.1: Update Prisma schema (User model, add Account, Session, VerificationToken)
- [X] 1.2: Generate and apply database migrations
- [X] 1.3: Update seed script for initial admin user creation
- [X] 1.4: Verify database connection and schema integrity

### Milestone 2: Auth.js Foundation (Priority: High)
- [ ] 2.1: Install dependencies (`next-auth@beta`, `@auth/prisma-adapter`, `bcryptjs`, `resend`)
- [ ] 2.2: Configure environment variables (`AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, etc.)
- [ ] 2.3: Implement `auth.ts` configuration (Providers, Adapters, Callbacks)
- [ ] 2.4: Implement `proxy.ts` for route protection
- [ ] 2.5: Create types/next-auth.d.ts for type safety
- [ ] 2.6: Configure Google OAuth credentials in Google Cloud Console

### Milestone 3: User Management & Admin Features (Priority: Medium)
- [ ] 3.1: Implement `createUser` server action with role/company validation
- [ ] 3.2: Implement Resend email service integration
- [ ] 3.3: Update Admin User Management UI to use `createUser` action
- [ ] 3.4: Implement Login Page UI with credentials and Google sign-in options

### Milestone 4: Cleanup & Verification (Priority: Low)
- [ ] 4.1: Remove Clerk dependencies and code references
- [ ] 4.2: Verify full authentication flow (Login, Session, Logout) in Dev and Prod
- [ ] 4.3: Verify access revocation and role-based access control
- [ ] 4.4: Update documentation with new auth setup instructions

**Dependencies:**
- Milestone 2 blocked by Milestone 1
- Milestone 3 blocked by Milestone 2
- Milestone 4 blocked by Milestone 3
