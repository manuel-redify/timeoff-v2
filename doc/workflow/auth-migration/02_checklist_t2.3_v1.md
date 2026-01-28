# Task Checklist - Task 2.3: Implement auth.ts Configuration
**Version:** v1
**Date:** 2026-01-28
**Source:** doc/workflow/auth-migration/02_detailed_m2_v1.md

## ✅ Task Checklist - Task 2.3

### Steps
- [ ] 1. Create `auth.ts` in the project root (or `lib/auth.ts` if preferred structure, usually root for v5).
- [ ] 2. Import dependencies: `NextAuth`, `Google`, `Credentials`, `PrismaAdapter`, `PrismaClient`, `bcrypt`.
- [ ] 3. Initialize Prisma Client instance (ensure singleton pattern if strict).
- [ ] 4. Define `authConfig` object (optional but good practice) or pass directly to `NextAuth`.
- [ ] 5. Implement `providers` array:
    - [ ] 5a. **Google Provider**: Add conditional logic `(prod || ENABLE_OAUTH_IN_DEV)`. Use values from `process.env`.
    - [ ] 5b. **Credentials Provider**: Add conditional logic `(development only)`. Implement `authorize` function:
        - Fetch user by email.
        - Verify password with `bcrypt.compare`.
        - Return simple user object (id, email, name) or null.
- [ ] 6. Configure `session` strategy:
    - Set `strategy: "database"`.
    - Set `maxAge: 30 * 24 * 60 * 60`.
- [ ] 7. Implement `signIn` callback:
    - [ ] 7a. Allow OAuth linking (check `account.provider`).
    - [ ] 7b. Fetch user from DB.
    - [ ] 7c. Check `!dbUser` -> Return false (User must exist).
    - [ ] 7d. Check `!dbUser.activated` -> Return false.
    - [ ] 7e. Check `dbUser.endDate` < today -> Return false.
- [ ] 8. Implement `session` callback:
    - [ ] 8a. Assign `session.user.id = user.id`.
    - [ ] 8b. Fetch/Assign extra fields: `companyId`, `isAdmin`, `name`, `lastname`.
- [ ] 9. Implement `jwt` callback (if using JWT strategy for edge cases, but we are using Database strategy so this might be skipped or minimal). *Correction: Database strategy doesn't use JWT callback for session data persistence usually, it uses the database session.*
- [ ] 10. Export `{ handlers, auth, signIn, signOut }` from `NextAuth(config)`.

### Testing
- [ ] Build project (might fail if types are not yet updated, but file should parse).
- [ ] Verify no circular dependency verification errors.

### Done When
- [ ] `auth.ts` exists and exports required methods.
- [ ] Logic for Dev/Prod providers is implemented.
- [ ] Security checks (activated, endDate) are present in `signIn`.
