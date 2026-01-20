# PRD 18: Legacy Feature Parity Checklist

**Document Version:** 1.0  
**Date:** January 13, 2026  
**Status:** Draft  
**Author:** Senior Product Manager (AI Assistant)

---

## 1. Executive Summary

This document provides a comprehensive checklist to ensure 100% feature parity between the legacy Timeoff V1 application and the rebuilt Timeoff V2. It maps legacy capabilities to the new PRD structure and tracks implementation and verification status.

---

## 2. Feature Mapping & Checklist

### 2.1 User Management (PRD 01)
- [ ] **Role-Based Access Control**: Standard roles (Admin, Supervisor, Employee) preserved.
- [ ] **Clerk Integration**: V1 Passport.js/Local Auth replaced with Clerk (SSO, MFA support).
- [ ] **User Profiles**: All legacy fields (name, email, start_date, etc.) mapped.
- [ ] **Account Activation**: Discovery/Onboarding status tracking.
- [ ] **Admin Self-Protection**: Logic to prevent deleting the last admin.

### 2.2 Company & Organizational Structure (PRD 02)
- [ ] **Company Settings**: Timezone, country, date formats, and leave year start.
- [ ] **Department Hierarchy**: Department creation and supervisor assignments (including multi-supervisor support).
- [ ] **Working Schedules**: Company-wide and individual working schedules (Mon-Sun).
- [ ] **Public Holidays**: Country-specific holiday management.
- [ ] **Visibility Controls**: `share_all_absences` and `is_team_view_hidden` settings.

### 2.3 Leave Type Configuration (PRD 03)
- [ ] **Leave Type Core**: Name, color, and allowance-impact flag.
- [ ] **Annual Limits**: Max days allowed per type per year.
- [ ] **Auto-Approval**: Per-leave-type auto-approval setting.
- [ ] **Sort Order**: Dropdown ordering for submission forms.

### 2.4 Leave Request Workflow (PRD 04)
- [ ] **Request Submission**: Support for all-day, morning, and afternoon parts.
- [ ] **Real-time Validation**: Overlap detection and allowance checking.
- [ ] **Cancellation/Revocation**: Employee cancellation and post-approval revocation workflows.
- [ ] **Multiple Approvers**: Handling of multiple supervisors and approval chains (discovered in V1 DB).

### 2.5 Calendar & Visualization (PRD 05)
- [ ] **View Types**: Month view, Year view, Wall Chart (Team View), and List View.
- [ ] **Color Coding**: Consistent usage of leave type colors across all views.
- [ ] **iCal Feeds**: Personal and team-based iCal generator for external calendars.
- [ ] **Half-Day UI**: Visual indicators for morning/afternoon absences.

### 2.6 Allowance Management (PRD 06)
- [ ] **Calculation Engine**: Accrued vs. Upfront allowance logic.
- [ ] **Pro-rating**: Automatic pro-rating for new hires and leavers.
- [ ] **Manual Adjustments**: Admin-driven "Days in Lieu" and custom adjustments.
- [ ] **Carry-Over**: Configurable carry-over of unused days at year-end.

### 2.7 Supervisor Functions (PRD 07)
- [ ] **Supervisor Dashboard**: Pending requests list with quick actions.
- [ ] **Bulk Actions**: Batch approve/reject capabilities.
- [ ] **Delegation**: Out-of-office delegation to other supervisors.

### 2.8 Notifications (PRD 08)
- [ ] **Email Triggers**: Request, Approval, Rejection, Cancellation notifications.
- [ ] **Watcher System**: Notifying non-approving stakeholders (discovered in PRD 12).
- [ ] **In-App Alerts**: Real-time counter and notification feed.

### 2.9 Reporting & Administration (PRD 09 & 10)
- [ ] **CSV Data Export**: 100% parity with V1 export fields for leaves and allowance.
- [ ] **Audit Trail**: Complete log of data changes (Audit table) and Emails (Email Audit).
- [ ] **Data Portability**: JSON Export/Import for company-wide backups.

### 2.10 Mobile Experience (PRD 11)
- [ ] **Responsive Design**: Mobile-first grid using Tailwind/shadcn.
- [ ] **PWA Features**: "Add to Home Screen" and offline manifest.

---

## 3. Data Integrity Verification (PRD 12 & 17)
- [ ] **Schema Parity**: Verification that all 19+ legacy tables are mapped to Prisma/PostgreSQL.
- [ ] **Migration Scripts**: Logic to convert SQLite/Sequelize data into PostgreSQL/Prisma.
- [ ] **Constraint Verification**: Ensuring logic (e.g., negative allowance block) exists in V2.

---

## 4. Acceptance Criteria
1. Every feature tagged as "Legacy" in PRDs 01-11 is listed.
2. Every table discovered in the V1 database analysis (PRD 12) has a corresponding management interface in V2.
3. Successful validation of V1 to V2 data migration for 100% of core entities.
