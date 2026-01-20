# Phase 10: Reporting & Data Export - Task List

## Overview
This phase implements the data extraction and analytical tools required for administrative oversight. It covers company-wide and departmental statistics, as well as flexible CSV exports for leave requests, allowance balances, and audit logs. All features must respect strict role-based access control (RBAC).

## Prerequisites
- [ ] Phase 1 (Foundation & Setup) completed.
- [ ] Phase 2 (User Management & Authentication) completed.
- [ ] Phase 3 (Company & Organizational Structure) completed.
- [ ] Phase 5 (Employee Allowance Management) completed.
- [ ] Phase 6 (Leave Request Workflow) completed.
- [ ] Read and understood [PRD 09: Reporting & Data Export](file:///prd/porting_prd/prd_09_reporting_and_data_export.md).

## Detailed Task Breakdown

### 1. Database & Backend
- [ ] **Extended Reporting Views**: Implement or extend Supabase views (e.g., `vw_absence_analytics`) to support statistical queries.
  - **Done looks like**: Views efficiently return aggregated data by department, year, and leave type.
- [ ] **CSV Export Service**: Implement a server-side service to generate CSV files from Prisma query results.
  - **Done looks like**: UTF-8 encoded CSVs are generated reliably with correct headers and data mapping.
- [ ] **Leave Request Export API**: Implement `GET /api/reports/export/requests`.
  - **Done looks like**: API handles complex filtering (dates, dept, status) and streams a CSV download with 100% data accuracy.
- [ ] **Allowance Balance Export API**: Implement `GET /api/reports/export/allowance`.
  - **Done looks like**: API provides a snapshot of current/past year allowance balances for all filtered employees.
- [ ] **Analytics Data API**: Implement `GET /api/reports/statistics`.
  - **Done looks like**: Endpoint returns JSON data for dashboard cards and charts (Leave Type distribution, etc.).

### 2. UI & Frontend
- [ ] **Reporting Dashboard View**: Build the specialized reports page (`/admin/reports`).
  - **Done looks like**: Dashboard features stat cards and simple bar charts for visualized oversight.
- [ ] **Export Selection Forms**: Build the UI for configuring and triggering CSV exports.
  - **Done looks like**: User-friendly forms with date-range pickers and multi-select filters for departments and leave types.
- [ ] **Export Progress UX**: Implement loading states and automatic browser download triggers.
  - **Done looks like**: Users receive immediate feedback during generation, and the file downloads automatically upon completion.

### 3. Integration & Glue Code
- [ ] **URL State Persistence**: Link report filters to URL query parameters.
  - **Done looks like**: Filtering a report updates the URL; refreshing the page restores the exact filters.
- [ ] **RBAC Enforcement for Exports**: Ensure API-level permission checks for all reporting endpoints.
  - **Done looks like**: Supervisors can only export their own department's data; admins can export everything.
- [ ] **Audit Integration (Optional/Extended)**: Ensure data export actions are logged if required by system audit policies.
  - **Done looks like**: Every successful full-company export is recorded in the audit log.

## Acceptance Criteria
- [ ] All exported CSV fields exactly match the requirements in PRD 09.
- [ ] Export generation for up to 500 users completes in under 5 seconds.
- [ ] Role-based access control is strictly enforced (no cross-department data leakage).
- [ ] Statistical calculations (total days, usage rate) match the core system logic.
- [ ] Exports handle multi-language characters (UTF-8) and various status combinations correctly.

## Testing & Validation Checklist
- [ ] Integration tests for export accuracy (comparing CSV rows to database count).
- [ ] Automated security tests to verify RBAC (Supervisors cannot access other departments).
- [ ] Manual verification of CSV appearance in Excel/Google Sheets (checking headers and encoding).
- [ ] Manual smoke test for large period exports (e.g., full year of requests).
- [ ] Mobile responsiveness check for the reporting dashboard and export forms.
