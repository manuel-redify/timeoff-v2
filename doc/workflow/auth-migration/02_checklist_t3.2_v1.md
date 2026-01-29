# Task Checklist - Task 3.2: Implement SMTP2GO email service integration
**Version:** v1
**Date:** 2026-01-29
**Source:** doc/workflow/auth-migration/02_detailed_m3_v1.md, doc/prd/prd_auth_migration.md

## ✅ Task Checklist - Task 3.2: Implement SMTP2GO email service integration

### Steps
- [ ] Refine `lib/smtp2go.ts`:
    - [ ] Import `emailConfig` from `@/lib/email-config`
    - [ ] Add `sendWelcomeEmail` function taking `to`, `name`, and `isProduction` flag
    - [ ] Implement HTML template logic:
        - [ ] Dev: Show temporary password instructions
        - [ ] Prod: Show Google Login instructions
    - [ ] Use `smtp2go.send()` to dispatch email
- [ ] Integrate into `createUser` action:
    - [ ] Call `sendWelcomeEmail` after successful database transaction
    - [ ] Wrap in try/catch to ensure user creation isn't rolled back if email fails
- [ ] Implement Email Auditing:
    - [ ] After calling `sendWelcomeEmail`, create a record in `EmailAudit` table
    - [ ] Include `userId`, `companyId`, `subject`, and `body` (or summary)
- [ ] Verify `SMTP2GO_API_KEY` is correctly used from `.env`

### Testing
- [ ] **Email Logic in Dev**: Verify the generated HTML contains "temporary password" text.
- [ ] **Email Logic in Prod**: Verify the generated HTML contains "Google Workspace" text.
- [ ] **Error Resilience**: Simulate SMTP failure (e.g., temporary invalid API key). Verify user creation still succeeds and logs the error.
- [ ] **Audit Trail**: Confirm an `EmailAudit` record appears in the database after user creation.
- [ ] **Sender Identity**: Verify the "From" address matches `emailConfig.sender`.

### Done When
- [ ] `sendWelcomeEmail` is fully functional and integrated into `createUser`
- [ ] Invitations contain correct instructions based on the environment
- [ ] Every sent email is recorded in the `EmailAudit` table
