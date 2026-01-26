# Task Checklist - Task 1.3: Email Templates (React Email)
**Version:** v1
**Date:** 2026-01-25
**Source:** 02_detailed_m1_v1.md

## ✅ Task Checklist - Task 1.3

### Steps
- [x] Create `emails/LeaveRequestSubmitted.tsx`:
  - Show requester name, leave type, dates, and link to request
- [x] Create `emails/LeaveRequestDecision.tsx`:
  - Handle both Approved and Rejected states with conditional content
  - Show supervisor comments
- [x] Create `emails/SystemWelcome.tsx`:
  - Welcome message and link to login
- [x] Ensure all templates are responsive and use Tailwind or basic CSS
- [x] Test template rendering locally (can use `react-email` dev server if needed, but for now just build them)

### Testing
- [x] Use a preview script or simple test route to see rendered HTML

### Done When
- [x] Three core email templates exist in the `emails/` directory
- [x] Templates are typesafe and correctly accept props for dynamic data
