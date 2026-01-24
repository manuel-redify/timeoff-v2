# Task Checklist - Task 1.3: Implement iCal feed generator
**Version:** v1
**Date:** 2026-01-23

### Steps
- [ ] Create `app/api/calendar/ical/[token]/route.ts`
- [ ] Implement RFC 5545 basic structure (VCALENDAR, VEVENT)
- [ ] Fetch user and their approved/pending_revoke absences by token
- [ ] Format absences as iCal events
  - [ ] Handle all-day events correctly
  - [ ] Handle half-day events with fixed time slots (e.g. 09-13 and 13-17)
  - [ ] Set correct Content-Type: `text/calendar`
- [ ] Implement caching headers (15 mins as per PRD)

### Testing
- [ ] Verify endpoint returns valid iCal content
- [ ] Test with a public validator (if possible) or manual inspection
- [ ] Verify timezone and date formats are RFC compliant

### Done When
- [ ] Endpoint is accessible via token
- [ ] Content is valid RFC 5545
- [ ] Synchronizes correctly with external calendars (manual check)
