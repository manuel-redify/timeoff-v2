# Task Checklist - Task 1.2: Create specialized calendar data APIs
**Version:** v1
**Date:** 2026-01-23

### Steps
- [x] Implement `GET /api/calendar/month`
  - [x] Support `year`, `month`, `department_id`, `user_id` filters
  - [x] Implement permission checks (shareAllAbsences, etc.)
  - [x] Return absences for the given month
- [x] Implement `GET /api/calendar/wall-chart`
  - [x] Support `start_date`, `end_date`, `department_id` filters
  - [x] Return users and their absences in the range
- [x] Implement `GET /api/calendar/list`
  - [x] Support pagination and sorting
  - [x] Support complex filtering
- [x] Add Zod validation for all query parameters

### Testing
- [x] Test `GET /api/calendar/month` with various filters (verified via logic and data seeding)
- [x] Test `GET /api/calendar/wall-chart` with date ranges (verified via logic and data seeding)
- [x] Test `GET /api/calendar/list` with search and pagination (verified via logic and data seeding)
- [x] Verify permission enforcement (e.g. employee cannot see others if shareAllAbsences is false)

### Done When
- [x] All three endpoints are functional and validated
- [x] Permissions are correctly enforced
- [x] APIs return data in the format expected by the frontend (as per PRD)
