# Detailed Phase - Milestone 1: Data & Backend [COMPLETED]
**Version:** v1
**Date:** 2026-01-23
**Feature:** Calendar Views

### Task 1.1: Implement iCal feed token in User model
1. [ ] Add `ical_feed_token` (String, uuid) to `User` model in `prisma/schema.prisma`
2. [ ] Add unique constraint on `ical_feed_token`
3. [ ] Update `lib/services/user.service.ts` (if exists) or create a script to populate tokens for existing users
4. [ ] Ensure new users get a token on creation
5. [ ] Run `npx prisma migrate dev`
Effort: S | Skills: backend.md

### Task 1.2: Create specialized calendar data APIs
1. [ ] Implement `GET /api/calendar/month`
2. [ ] Implement `GET /api/calendar/wall-chart`
3. [ ] Implement `GET /api/calendar/list`
4. [ ] Add input validation (Zod) for filters and date ranges
Effort: M | Skills: backend.md

### Task 1.3: Implement iCal feed generator
1. [ ] Create `app/api/calendar/ical/[token]/route.ts`
2. [ ] Implement RFC 5545 logic for Approved absences
3. [ ] Support all-day and half-day events
Effort: M | Skills: backend.md

### Task 1.4: Optimize database queries
1. [ ] Add indexes for date-range queries if needed
2. [ ] Benchmark with simulated large dataset
Effort: S | Skills: backend.md
