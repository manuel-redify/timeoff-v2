# Detailed Phase - Milestone 1: Core Infrastructure & Backend
**Version:** v1
**Date:** 2026-01-25
**Source:** 02_task_plan_v1.md

## 📝 Detailed Phase - Milestone 1

### Task 1.1: Database Schema Models ✅ COMPLETED
1. [x] Add `Notification` model to `schema.prisma` (id, userId, type, content, isRead, createdAt)
2. [x] Add `NotificationPreference` model to `schema.prisma` (id, userId, type, channel [EMAIL, IN_APP, BOTH])
3. [x] Update `User` model to relate to these new models
4. [x] Run `npx prisma db push` to synchronize Neon database
5. [x] (Optional) Add `email_audit` missing fields if any
Effort: S | Skills: backend.md

### Task 1.2: Resend Configuration ✅ COMPLETED
1. [x] Install `@resend/react-email` and `resend` if not present (Note: @resend/react-email not needed)
2. [x] Create `lib/resend.ts` to initialize the Resend client
3. [x] Add `RESEND_API_KEY` to `.env.local` (with placeholder instructions)
4. [x] Create a test API route `app/api/test-email/route.ts` to verify integration
Effort: S | Skills: backend.md

### Task 1.3: Email Templates (React Email) ✅ COMPLETED
1. [x] Create `emails/` directory for templates
2. [x] Implement `LeaveRequestSubmitted.tsx`
3. [x] Implement `LeaveRequestDecision.tsx` (handles Approved/Rejected)
4. [x] Implement `SystemWelcome.tsx`
Effort: M | Skills: frontend.md, backend.md

### Task 1.4: Notification Event Bus ✅ COMPLETED
1. [x] Create `lib/services/notification.service.ts`
2. [x] Implement `NotificationService.notify()` method
3. [x] Logic for fetching user preferences before sending
4. [x] Logic for conditional delivery (Email vs In-App)
5. [x] Integrate `EmailAudit` logging in the service
Effort: M | Skills: backend.md

### Task 1.5: API Endpoints ✅ COMPLETED
1. [x] Create `app/api/notifications/route.ts` (GET - fetch recent notifications)
2. [x] Create `app/api/notifications/[id]/route.ts` (PATCH - mark as read)
3. [x] Create `app/api/user/preferences/notifications/route.ts` (PUT - update preferences)
Effort: S | Skills: backend.md

**Total:** 5 large tasks
**Blocks:** Milestone 2 & 3
**Blocked by:** PRD 12 tables
**Related skills:** `backend.md`, `frontend.md`
