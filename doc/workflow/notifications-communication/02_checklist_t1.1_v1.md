# Task Checklist - Task 1.1: Database Schema Models
**Version:** v1
**Date:** 2026-01-25
**Source:** 02_detailed_m1_v1.md

## ✅ Task Checklist - Task 1.1

### Steps
- [x] Research PRD 12 and existing schema to ensure naming compatibility
- [x] Modify `prisma/schema.prisma` to add `Notification` model:
  ```prisma
  model Notification {
    id        String   @id @default(uuid())
    userId    String   @map("user_id")
    type      String
    title     String
    message   String
    link      String?
    isRead    Boolean  @default(false) @map("is_read")
    createdAt DateTime @default(now()) @map("created_at")
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@index([userId])
    @@index([isRead])
    @@map("notifications")
  }
  ```
- [x] Add `NotificationPreference` model to `prisma/schema.prisma`:
  ```prisma
  model NotificationPreference {
    id      String @id @default(uuid())
    userId  String @map("user_id")
    type    String // e.g., "leave_request_submitted"
    channel String @default("BOTH") // EMAIL, IN_APP, BOTH, NONE
    user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@unique([userId, type])
    @@map("notification_preferences")
  }
  ```
- [x] Add relations to `User` model
- [x] Run `npx prisma generate` to update types
- [x] Run `npx prisma db push` (or create migration if using migrations)

### Testing
- [x] Verify Prisma Client has the new types
- [x] Verify table existence via GUI or `npx prisma studio`

### Done When
- [x] `Notification` and `NotificationPreference` tables exist in Neon
- [x] Prisma Client is updated and compiling without errors
