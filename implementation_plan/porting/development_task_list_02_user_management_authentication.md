# Phase 2: User Management & Authentication - Task List

## Overview
Implement identity management, authentication flows, and user profile systems. This phase integrates Clerk for secure authentication and ensures user data is correctly synchronized with the Neon database, providing the foundational security layer for all subsequent features.

## Prerequisites
- [ ] **Phase 1: Foundation & Setup**: Ensure project structure, database connection, and API standards are established.
- [ ] **Read PRDs**:
  - [PRD 01: User Management & Authentication](file:///prd/porting_prd/prd_01_user_management.md)
  - [PRD 12: Database Schema](file:///prd/porting_prd/prd_12_database_schema_and_data_model.md)
  - [PRD 13: API Specifications](file:///prd/porting_prd/prd_13_API_specifications.md)

## Detailed Task Breakdown

### 1. Database & Backend
- [ ] **Update User Model**: Ensure the Prisma `User` model includes all fields from PRD 12 (clerkId, contractType, etc.).
  - **Done looks like**: `npx prisma generate` succeeds with updated model.
- [ ] **Clerk Webhook Implementation**: Implement the webhook handler in `app/api/webhooks/clerk/route.ts` to sync with Neon.
  - **Done looks like**: `user.created`, `user.updated`, and `user.deleted` events correctly update the `users` table.
- [ ] **User API - Session (`/api/users/me`)**: Create endpoint to return the current authenticated user's profile and roles.
  - **Done looks like**: Returns 200 with user data for logged-in users, 401 for anonymous.
- [ ] **User API - Management (`/api/users`)**: Implement GET (list), GET (single), and PATCH (update) endpoints.
  - **Done looks like**: Admin can retrieve and update any user; users can only update their own limited profile.
- [ ] **Role Assignment Logic**: Implement server-side logic to handle default role assignments during user creation/sync.
  - **Done looks like**: New users are assigned default roles according to company settings.

### 2. UI & Frontend
- [ ] **Clerk Integration**: Wrap the application in `ClerkProvider` and configure middleware.
  - **Done looks like**: Routes are protected; sign-in/sign-up pages are accessible.
- [ ] **Authentication Pages**: Style and implement custom Sign-In and Sign-Up pages using Clerk components.
  - **Done looks like**: Branding matches TimeOff v2 aesthetics; redirects work as intended.
- [ ] **User Profile View**: Create the `/profile` page for users to view and edit their information.
  - **Done looks like**: Users can update names and view their account status.
- [ ] **Admin: User Management Dashboard**: Build the user list table with filtering and search.
  - **Done looks like**: Admin can see all users, filter by department/role, and navigate to edit views.
- [ ] **Admin: Edit User Interface**: Create the form for admins to manage individual user accounts.
  - **Done looks like**: Admin can toggle `isAdmin` flag, change departments, and set end dates.

### 3. Integration & Glue Code
- [ ] **RBAC Middleware/Helpers**: Create utility functions for role-based access control (e.g., `isAdmin`, `isSupervisor`).
  - **Done looks like**: Helpers can be used in Server Components to show/hide UI based on roles.
- [ ] **Soft-Delete Implementation**: Ensure user deletion via API/Webhook marks the record as deleted without breaking foreign keys.
  - **Done looks like**: `deletedAt` is set; user is excluded from standard lists.

## Acceptance Criteria
- [ ] Users can register, login, and logout via Clerk.
- [ ] User data is automatically synced to the Neon database via webhooks.
- [ ] Administrators can view a list of all users and edit their profiles.
- [ ] Authentication middleware correctly protects all internal routes.
- [ ] Profile updates are reflected in both Clerk (if applicable) and the local database.

## Testing & Validation Checklist
- [ ] **Automated**: Jest/Vitest tests for Clerk webhook logic and role-based helpers.
- [ ] **Automated**: E2E tests (Playwright/Cypress) for the login flow and admin user search.
- [ ] **Manual**: Verify that a new user created in Clerk appears in the Neon `users` table within 5 seconds.
- [ ] **Manual**: Verify that a non-admin user cannot access the `/api/users` list endpoint.
- [ ] **UI/UX**: Check mobile responsiveness of the user list and profile forms.
