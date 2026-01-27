# PRD Analysis - Auth Migration
**Version:** v1
**Date:** 2026-01-27

## 🎯 Objective
Migrate the authentication system from Clerk to Auth.js (v5) to establish Neon Database as the single source of truth, enabling invite-only user provisioning, flexible authentication (Credentials in Dev, OAuth in Prod), and immediate access revocation via database sessions.

## 📋 Functional Requirements
1.  **Admin User Creation:** Admins must be able to create users via an internal form (invite-only system).
2.  **Environment-Specific Auth:**
    *   **Development:** Support Email/Password login (Credentials provider).
    *   **Production:** Support Google OAuth login (Google provider).
3.  **Authentication Flow:**
    *   Users receive welcome email with login instructions.
    *   Login validates user existence, activation status, and contract dates against the database.
4.  **Session Management:**
    *   Use database strategy for sessions to allow immediate revocation.
    *   Sessions persist for 30 days, update every 24 hours.
5.  **Role & Access Control:**
    *   Maintain multi-tenancy (company isolation).
    *   Enforce Admin-only access for user creation.

## 🔧 Technical Requirements
-   **Stack:** Next.js 14+ (App Router), Auth.js v5, Prisma ORM, Neon PostgreSQL, Resend (Email).
-   **Schema Changes:**
    *   Remove `clerkId`.
    *   Add `password` (nullable), `image` (nullable), `emailVerified` (DateTime?).
    *   Add `accounts`, `sessions`, `verification_tokens` tables (Auth.js adapters).
-   **Environment Variables:**
    *   `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
    *   `RESEND_API_KEY`
    *   `DEV_DEFAULT_PASSWORD`, `ENABLE_OAUTH_IN_DEV`
-   **Security:**
    *   Immediate access revocation via database checks in `signIn` callback.
    *   Bcrypt for password hashing (dev only).

## 🚫 Out of Scope
-   Public user signup (strictly disabled).
-   Social providers other than Google (for now).
-   Migration of existing Clerk user data (users will be recreated or seeded).

## ❓ Clarifications Needed
-   None.
