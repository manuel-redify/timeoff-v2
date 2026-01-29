# Task Checklist - Task 2.3: Implement auth.ts Configuration
**Version:** v1
**Date:** 2026-01-28
**Source:** doc/workflow/auth-migration/02_detailed_m2_v1.md

## ✅ Task Checklist - Task 2.3

### Steps
- [x] 1. Create `auth.ts` in the project root (or `lib/auth.ts` if preferred structure, usually root for v5).
- [x] 2. Import dependencies: `NextAuth`, `Google`, `Credentials`, `PrismaAdapter`, `PrismaClient`, `bcrypt`.
- [x] 3. Initialize Prisma Client instance (ensure singleton pattern if strict).
- [x] 4. Define `authConfig` object (optional but good practice) or pass directly to `NextAuth`.
- [x] 5. Implement `providers` array:
    - [x] 5a. **Google Provider**: Add conditional logic `(prod || ENABLE_OAUTH_IN_DEV)`. Use values from `process.env`.
    - [x] 5b. **Credentials Provider**: Add conditional logic `(development only)`. Implement `authorize` function:
        - Fetch user by email.
        - Verify password with `bcrypt.compare`.
        - Return simple user object (id, email, name) or null.
- [x] 6. Configure `session` strategy:
    - Set `strategy: "database"`.
    - Set `maxAge: 30 * 24 * 60 * 60`.
- [x] 7. Implement `signIn` callback:
    - [x] 7a. Allow OAuth linking (check `account.provider`).
    - [x] 7b. Fetch user from DB.
    - [x] 7c. Check `!dbUser` -> Return false (User must exist).
    - [x] 7d. Check `!dbUser.activated` -> Return false.
    - [x] 7e. Check `dbUser.endDate` < today -> Return false.
- [x] 8. Implement `session` callback:
    - [x] 8a. Assign `session.user.id = user.id`.
    - [x] 8b. Fetch/Assign extra fields: `companyId`, `isAdmin`, `name`, `lastname`.
- [x] 9. Implement `jwt` callback (if using JWT strategy for edge cases, but we are using Database strategy so this might be skipped or minimal). *Correction: Database strategy doesn't use JWT callback for session data persistence usually, it uses the database session.*
- [x] 10. Export `{ handlers, auth, signIn, signOut }` from `NextAuth(config)`.

### Testing
- [x] Build project (might fail if types are not yet updated, but file should parse).
- [x] Verify no circular dependency verification errors.

### Done When
- [x] `auth.ts` exists and exports required methods.
- [x] Logic for Dev/Prod providers is implemented.
- [x] Security checks (activated, endDate) are present in `signIn`.
