# Task Checklist - Task 3.1: Implement `createUser` server action
**Version:** v1
**Date:** 2026-01-29
**Source:** doc/workflow/auth-migration/02_detailed_m3_v1.md

## ✅ Task Checklist - Task 3.1: Implement `createUser` server action

### Steps
- [ ] Create `lib/actions` directory if it doesn't exist
- [ ] Create `lib/actions/user.ts` and add `"use server";`
- [ ] Import `auth` from `@/auth` and `PrismaClient` from `@prisma/client`
- [ ] Implement `createUser` function accepting user details
- [ ] Add `auth()` check: Verify session exists and `session.user.isAdmin` is true
- [ ] Add Tenant Check: Extract `companyId` from session to use in creation
- [ ] Add Duplicate Check: Verify email doesn't already exist in `User` table
- [ ] Add Foreign Key Validation:
    - [ ] Verify `roleId` exists and belongs to the admin's company
    - [ ] Verify `areaId` exists and belongs to the admin's company
    - [ ] Verify `departmentId` exists and belongs to the admin's company
- [ ] Implement Password logic: Hash `DEV_DEFAULT_PASSWORD` if in development mode
- [ ] Implement `prisma.$transaction`:
    - [ ] `tx.user.create`: Create basic user info
    - [ ] `tx.userRoleArea.create`: Link user to role and area
    - [ ] `tx.audit.create`: Log the user creation event
- [ ] Return standard response object `{ success: boolean; userId?: string; error?: string }`

### Testing
- [ ] **Unauthorized Access**: Call action without being logged in. Expected: Error.
- [ ] **Forbidden Access**: Call action as a regular user (not admin). Expected: Error.
- [ ] **Duplicate Email**: Attempt to create a user with an existing email. Expected: Error.
- [ ] **Cross-Tenant Attack**: Attempt to pass IDs of roles/areas belonging to a different company. Expected: Error.
- [ ] **Success Path**: Create a valid user. Expected:
    - [ ] User record exists in `User` table
    - [ ] `UserRoleArea` record exists
    - [ ] `Audit` record exists with correct `byUserId` and details

### Done When
- [ ] `createUser` server action is atomic (all-or-nothing via transaction)
- [ ] `createUser` server action enforces strict multi-tenancy isolation
- [ ] User creation is successfully logged in the audit trail
