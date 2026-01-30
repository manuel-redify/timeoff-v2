# Task Checklist - Task 3.2: Implement SMTP2GO email service integration
**Version:** v1
**Date:** 2026-01-29
**Source:** doc/workflow/auth-migration/02_detailed_m3_v1.md, doc/prd/prd_auth_migration.md

## ✅ Task Checklist - Task 3.2: Implement SMTP2GO email service integration

### Steps
- [x] Refine `lib/smtp2go.ts`:
    - [x] Import `emailConfig` from `@/lib/email-config`
    - [x] Add `sendWelcomeEmail` function taking `to`, `name`, and `isProduction` flag
    - [x] Implement HTML template logic:
        - [x] Dev: Show temporary password instructions
        - [x] Prod: Show Google Login instructions
    - [x] Use `smtp2go.send()` to dispatch email
- [x] Integrate into `createUser` action:
    - [x] Call `sendWelcomeEmail` after successful database transaction
    - [x] Wrap in try/catch to ensure user creation isn't rolled back if email fails
- [x] Implement Email Auditing:
    - [x] After calling `sendWelcomeEmail`, create a record in `EmailAudit` table
    - [x] Include `userId`, `companyId`, `subject`, and `body` (or summary)
- [x] Verify `SMTP2GO_API_KEY` is correctly used from `.env`

### Testing
- [ ] **Email Logic in Dev**: Verify the generated HTML contains "temporary password" text.
- [ ] **Email Logic in Prod**: Verify the generated HTML contains "Google Workspace" text.
- [ ] **Error Resilience**: Simulate SMTP failure (e.g., temporary invalid API key). Verify user creation still succeeds and logs the error.
- [ ] **Audit Trail**: Confirm an `EmailAudit` record appears in the database after user creation.
- [ ] **Sender Identity**: Verify the "From" address matches `emailConfig.sender`.

### Done When
- [x] `sendWelcomeEmail` is fully functional and integrated into `createUser`
- [x] Invitations contain correct instructions based on the environment
- [x] Every sent email is recorded in the `EmailAudit` table
