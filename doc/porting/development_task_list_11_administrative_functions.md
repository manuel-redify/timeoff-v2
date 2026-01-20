# Phase 11: Administrative Functions - Task List

## Overview
This phase centralizes the configuration and governance of the application. It provides administrators with high-level control over company-wide policies, user lifecycles, and data integrity. Key features include advanced audit logging, bulk user management, and a robust JSON-based data portability tool.

## Prerequisites
- [ ] Phase 1 (Foundation & Setup) completed.
- [ ] Phase 2 (User Management & Authentication) completed.
- [ ] Phase 3 (Company & Organizational Structure) completed.
- [ ] Phase 4 (Leave Type Configuration) completed.
- [ ] Phase 9 (Notifications & Communication) completed.
- [ ] Read and understood [PRD 10: Administrative Functions](file:///prd/porting_prd/prd_10_administrative_functions.md).

## Detailed Task Breakdown

### 1. Database & Backend
- [ ] **Implement Audit Logging Engine**: Create a service/middleware to automatically capture data changes into the `audit` table.
  - **Done looks like**: Every write operation to critical entities (Users, Companies, Requests) is logged with before/after snapshots.
- [ ] **System Configuration APIs**: Implement endpoints for managing company-wide settings (Fiscal Year, Global Policies).
  - **Done looks like**: `PATCH /api/admin/company/settings` allows updating all parameters defined in PRD 10.
- [ ] **Bulk User Management API**: Implement `PATCH /api/admin/users/bulk-action` for activation/deactivation.
  - **Done looks like**: Multiple users can be deactivated in a single request, with validation checks for pending work.
- [ ] **JSON Data Portability Tools**: Implement `GET /api/admin/data/export` and `POST /api/admin/data/import`.
  - **Done looks like**: Export generates a structured JSON file of all company data; Import hydrates a new instance after successful validation.
- [ ] **Email Audit API**: Implement `GET /api/admin/audit/emails` with advanced search/filtering.
  - **Done looks like**: Admins can search for specific sent emails to troubleshoot delivery issues.

### 2. UI & Frontend
- [ ] **Admin Sidebar & Layout**: Build the specialized navigation and layout for administrative pages.
  - **Done looks like**: A dedicated sidebar with links to Settings, Users, Teams, Logs, and Backup.
- [ ] **Global Settings Dashboard**: Build the tabbed interface for managing all company-wide policies.
  - **Done looks like**: Clean, organized forms for setting carry-over rules, fiscal year, and visibility toggles.
- [ ] **Audit Log Viewer**: Build the advanced data table for exploring system-wide changes.
  - **Done looks like**: Sortable, filterable list of all audit entries with "View Changes" modal showing diffs.
- [ ] **Data Management Interface**: Build the UI for triggering JSON exports and uploading imports.
  - **Done looks like**: Simple "Backup & Restore" page with a clear "Dry Run" report for imports.

### 3. Integration & Glue Code
- [ ] **RBAC Security Lockdown**: Apply the `is_admin` check to all `/admin/*` routes and API endpoints.
  - **Done looks like**: Non-admin users are strictly redirected or receive `403 Forbidden` for all admin areas.
- [ ] **Email Audit Connection**: Ensure the notification service from Phase 9 correctly feeds into the `email_audit` table.
  - **Done looks like**: Every automated email is visible in the Admin Email Audit log immediately.
- [ ] **Integration API Management**: Add controls for managing integration tokens and API access.
  - **Done looks like**: Admins can regenerate their `integration_api_token` via the settings UI.

## Acceptance Criteria
- [ ] All administrative data changes are accurately captured in the `audit` log.
- [ ] JSON Export/Import cycle preserves 100% of data and relationship integrity.
- [ ] Bulk user management correctly handles account status and cascading effects.
- [ ] Only users with the `is_admin` role can access administrative functions.
- [ ] System-wide policies (e.g., Fiscal Year) correctly influence application logic (allowance resets).

## Testing & Validation Checklist
- [ ] Automated security tests to verify `/admin` route protection.
- [ ] Integration tests for the JSON import/export tool (Full cycle test).
- [ ] Manual verification of the audit log after making diverse system changes.
- [ ] Manual smoke test of bulk deactivation (verify Clerk access is revoked).
- [ ] Mobile responsiveness check for the comprehensive admin dashboard.
