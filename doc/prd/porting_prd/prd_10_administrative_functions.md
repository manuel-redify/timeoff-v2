# PRD 10: Administrative Functions

**Document Version:** 1.0  
**Date:** January 11, 2026  
**Status:** Draft  
**Author:** Senior Product Manager

---

## Executive Summary

PRD 10 defines the administrative capabilities required for system maintainers and company administrators in Timeoff Management Application v2. While standard users interact with workflows and personal data, administrators require high-level visibility and control over system configuration, user lifecycles, and data integrity.

This PRD covers system-wide settings, administrative views of core entities, audit logging for compliance, and critical data portability features (JSON migration) to ensure a seamless transition from v1 and long-term data sovereignty.

---

## 1. Business Context & Goals

### 1.1 Goals
- **System Governance:** Provide tools to manage company-wide policies (e.g., carry-over rules, public holidays).
- **Compliance & Accountability:** Maintain detailed logs of all administrative actions and system communications.
- **Data Mobility:** Enable administrators to export and import company data for backups or migration purposes.
- **Operational Efficiency:** Allow administrators to troubleshoot user issues via administrative views and audit logs.

### 1.2 Success Criteria
- Administrators can configure all company-wide parameters defined in PRD 02 and PRD 03.
- All system-critical changes are captured in the Audit Log (`audit` table).
- Company data can be exported to and imported from a structured JSON format.
- Multi-supervisor and role-based assignments are manageable via a centralized admin interface.

---

## 2. Functional Requirements

### 2.1 System Configuration (PRD 02/03 Extension)
Administrators must be able to manage:
- **Company Profile:** Name, country, timezone, and date format.
- **Academic/Fiscal Year:** Definition of the start of the new year (impacts allowance resets).
- **Global Policies:** 
    - `share_all_absences`: Toggle visibility of all absences across the company.
    - `is_team_view_hidden`: Toggle visibility of the team/wall chart.
    - `carry_over`: Maximum days allowed to carry over to the next year.
- **Integration API:** Enable/disable API access and regenerate integration tokens (`integration_api_token`).

### 2.2 User & Department Administration
While PRD 01 and 02 define the entities, the Admin View adds:
- **Bulk User Management:** Activation/deactivation of accounts.
- **Role Assignments:** Managing the `is_admin` flag and `default_role_id` for the multi-role approval system.
- **Department Supervision:** Assigning multiple supervisors to a department via the `department_supervisor` junction table.
- **Employment Lifecycle:** Updating `start_date`, `end_date`, and `contract_type`.

### 2.3 Audit Logs & Monitoring
A centralized view for:
- **Data Changes:** Displaying the `audit` table (Entity, ID, Attribute, Old Value, New Value, User, Timestamp).
- **Email Audit:** A searchable log of all system-generated emails (`email_audit` table) to verify notification delivery.
- **System Health:** Basic dashboard showing active sessions (via Clerk/Supabase) and database migration status.

### 2.4 Data Backup & Portability
- **JSON Export:** Generate a comprehensive JSON file containing all company-specific data:
    - Company settings, Departments, Users, Leave Types, Bank Holidays, Schedules, and existing Leave Requests.
- **JSON Import:** A tool to hydrate a new company instance or restore data from a previous export (validation required to match the schema in PRD 12).

---

## 3. User Stories

| ID | User Role | Requirement | Purpose |
|----|-----------|-------------|---------|
| US.10.1 | Admin | I want to change the company-wide message. | To communicate important updates to all employees. |
| US.10.2 | Admin | I want to view why an email wasn't received by a supervisor. | To troubleshoot communication issues using the Email Audit. |
| US.10.3 | Admin | I want to export my company data to JSON. | To maintain an offline backup or migrate to another instance. |
| US.10.4 | Admin | I want to see a history of who changed a user's allowance. | To ensure accountability and audit compliance. |
| US.10.5 | Admin | I want to manually trigger an allowance carry-over. | To handle year-end transitions according to company policy. |

---

## 4. Technical Specifications

### 4.1 Database Interaction (Ref: PRD 12)
- **Primary Tables:** `companies`, `audit`, `email_audit`.
- **Junction Operations:** Managing `department_supervisor`, `user_role_area`, and `user_project`.
- **Calculated Fields:** Admin views should show `calculate_user_allowance` and `used_allowance` summaries (via `vw_user_allowance_summary`).

### 4.2 JSON Data Schema (Export/Import)
The export format must follow this structure:
```json
{
  "company": { ... },
  "departments": [ ... ],
  "users": [ ... ],
  "leave_types": [ ... ],
  "bank_holidays": [ ... ],
  "leave_requests": [ ... ],
  "allowance_adjustments": [ ... ]
}
```

### 4.3 Security & RLS
- All administrative routes and API endpoints must be protected by the `is_admin` flag.
- Supabase RLS policies must strictly enforce `company_id` isolation even for administrators (Admins can only see their own company's audit logs).

---

## 5. User Experience & Interaction

### 5.1 Admin Dashboard Layout
- **Sidebar:** Navigation links to Settings, Users, Departments, Audit Logs, and Data Management.
- **Audit Log Table:** Advanced filtering by User, Entity Type, and Date Range.
- **System Settings Form:** Organized into tabs (General, Leave Policies, Integrations).

### 5.2 Critical Actions
- **Deactivating a User:** Requires confirmation and shows the impact on pending leave requests.
- **Data Import:** Requires a "DRY RUN" stage showing potential conflicts or validation errors before final commit.

---

## 6. Implementation Notes

- **Audit Trigger:** Implement database triggers or application-layer middleware to capture every write operation into the `audit` table.
- **JSON Serialization:** Use standard UUID formatting for all ID fields in exports to ensure referential integrity on re-import.
- **Performance:** For large companies, the Audit Log should implement server-side pagination and lazy loading.

---

## 7. Testing Requirements

- [ ] Verify that non-admins cannot access `/admin/*` routes.
- [ ] Ensure `audit` logs are generated for changes to `leave_types` and `users`.
- [ ] Test JSON Export and Import cycle with a sample company to ensure 100% data integrity.
- [ ] Validate that deactivating a user prevents them from logging in via Clerk.
- [ ] Verify that Email Audit captures the correct HTML/Text body of sent emails.

---

## 8. Dependencies & References

- **PRD 01:** User Management (Foundation for Admin views).
- **PRD 02:** Company Structure (Reference for configuration).
- **PRD 12:** Database Schema (Source of truth for Audit and Company tables).
- **Supabase Documentation:** RLS and Edge Functions for data exports.

---

## Document Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-11 | PM Team | Initial draft defining global settings, audit logs, and data portability. |

---

*End of PRD 10 - Administrative Functions*
