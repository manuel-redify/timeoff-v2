# Task Checklist - Task 1.1: Implement iCal feed token in User model
**Version:** v1
**Date:** 2026-01-23

### Steps
- [x] Modify `prisma/schema.prisma` to add `ical_feed_token` and `unique` constraint
- [x] Run `npx prisma db push`
- [x] Update user creation logic to generate a UUID token (handled by Prisma default)
- [x] Verify that existing users get a token (via a population script)

### Testing
- [x] Verify `User` table has `ical_feed_token` column
- [x] Verify uniqueness is enforced
- [x] Verify new user has a valid UUID token

### Done When
- [x] Database schema is updated and migrated correctly
- [x] Users have unique `ical_feed_token` values
