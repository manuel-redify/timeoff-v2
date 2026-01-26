# Task Checklist - Email Audit Integration
**Version:** v1
**Date:** 2026-01-25
**Source:** 02_detailed_m3_v1.md

## ✅ Task Checklist - Task 3.4

### Steps
- [ ] Inspect `lib/services/notification.service.ts` -> `notify` method.
- [ ] Confirm `prisma.emailAudit.create` is called within the success block of `resend.emails.send`.
- [ ] Verify `body` storage: data size might be large. Ensure database column supports it (Text vs String).
- [ ] Check if `companyId` is always available. If `user` is fetched, `user.companyId` is reliable.
- [ ] Add error handling: if Audit fails, should the email flow fail? (Likely not, just log error).

### Testing
- [ ] Trigger an email.
- [ ] Check `EmailAudit` table via Prisma Studio or SQL.
- [ ] Verify `subject`, `to`, `body` are correct.

### Done When
- [ ] All outgoing system emails create a corresponding audit log entry.
