# Master Plan - Bank Holidays by Country v2
**Status:** In Progress
**Source:** doc/prd/prd_bank_holiday_v2.md

### Milestone 1: Database & Core Models
- [ ] 1.1: Update Bank Holiday model (add `country`, `year`, `status`, `is_deleted` flag).
- [ ] 1.2: Ensure User and Company models support Country mapping (Employee Country, Company Country).
- [ ] 1.3: Create database migrations to update existing holiday data to the new schema.
- [ ] 1.4: Implement data access layer queries (scope by country, year, and active status).

### Milestone 2: Automated Import Service & Backend Logic
- [ ] 2.1: Implement API integration to fetch standard holidays by country code and year.
- [ ] 2.2: Implement import logic with manual override protection (Sync Guard).
- [ ] 2.3: Add event listener on User creation/update to trigger country imports.
- [ ] 2.4: Implement batch processing logic for Bulk User Uploads to group imports by country.
- [ ] 2.5: Implement year-transition massive automated import logic for all Active Countries.

### Milestone 3: Admin UI (Bank Holiday Management)
- [ ] 3.1: Build initial manual import UI trigger for Company Country.
- [ ] 3.2: Add Country filtering dropdown (defaulting to Company Country).
- [ ] 3.3: Implement Year navigation with the massive automated import trigger.
- [ ] 3.4: Implement UI for "Validate All" (transitioning `Pending` to `Validated`).
- [ ] 3.5: Implement Soft Delete and Manual Addition (Observed Days) actions.

### Milestone 4: Frontend Team View & System Notifications
- [ ] 4.1: Update Team View to display holidays based on Employee Country.
- [ ] 4.2: Enforce UI validation restricting navigation to max 1 year into the future.
- [ ] 4.3: Implement missing data placeholder message for empty year/country states.
- [ ] 4.4: Implement in-app toast notifications for admins upon successful background imports.
- [ ] 4.5: Create CRON job for Admin Email Reminder (November 1st / 2 months prior to year-end).

## 🔄 Next Steps
- Start Milestone 1 by updating/creating the Detailed Phase file (`02_detailed_m1_bank_holiday_v2.md`).
- Once all tasks are marked [x], trigger `03_documentation.md`.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-04-10 | 1.0 | Initial Plan based on PRD v2.1 |
