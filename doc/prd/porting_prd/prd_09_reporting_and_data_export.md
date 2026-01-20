# PRD 09: Reporting & Data Export

**Document Version:** 1.0  
**Date:** January 10, 2026  
**Status:** Draft  
**Author:** Senior Product Manager

---

## 1. Executive Summary

### 1.1 Business Context
Accurate reporting and the ability to export data are critical for HR management, payroll processing, and organizational planning. In the legacy application, basic CSV exports provided the primary means of data extraction. Version 2 enhances this by providing more structured, accessible, and comprehensive reporting capabilities within the Next.js/Supabase architecture, leveraging real-time data and modern visualization patterns.

### 1.2 Goals
- Provide 100% feature parity with legacy CSV export functionality.
- Enable department-level and company-wide visibility into absence patterns.
- Facilitate seamless data extraction for external payroll and auditing systems.
- Ensure data security and role-base access control (RBAC) in accordance with PRD 01 and PRD 14.

### 1.3 Success Criteria
- 100% accuracy of exported data compared to database records.
- Export generation and download in under 5 seconds for companies up to 500 employees.
- Intuitive filtering system for custom period and entity selection.
- Zero unauthorized access to sensitive absence data during export.

---

## 2. Functional Requirements

### 2.1 Absence Statistics & Analytics
The system must calculate and display key absence metrics for the current and previous year.

- **F01: Company Overview Statistics** (Admin only)
  - Total days taken vs. total allowance.
  - Average absence rate per employee.
  - Leave type distribution (e.g., % Vacation vs % Sick).

- **F02: Departmental Statistics** (Admin & Supervisor)
  - Absence breakdown by department.
  - Top 5 absent employees (optional, for planning).
  - Departmental usage vs. departmental allowance.

- **F03: Individual Statistics** (Employee/Supervisor/Admin)
  - Personal leave history and allowance balance (per PRD 06).
  - Projected end-of-year balance.

### 2.2 Data Export Functionality
The application must provide flexible CSV (Comma Separated Values) export triggers.

- **F04: Leave Requests Export**
  - **Filters**: Date range (Start/End), Department, Employee, Leave Type, Request Status (Approved/Rejected/Pending).
  - **Fields**: Employee Name, Employee Email, Leave Type, Start Date, End Date, Start Part, End Part, Total Days, Approver Name, Status, Date Decided, Employee Comment.

- **F05: Allowance Balance Export**
  - **Filters**: Year, Department.
  - **Fields**: Employee Name, Department, Base Allowance, Adjustments, Carried Over, Total Allowance, Days Used, Remaining Balance.

- **F06: Audit Log Export** (Admin only - per PRD 10)
  - **Filters**: Date Range, Entity Type, User.
  - **Fields**: Timestamp, User, Entity, Field Changed, Old Value, New Value.

### 2.3 User Experience & Interaction

- **F07: Filter Persistence**
  - Report filters should remain in URL state to allow sharing and bookmarking of specific reports.

- **F08: Export Notifications**
  - Provide visual feedback (loading spinners) during export generation.
  - Trigger browser native download once the CSV is generated.

---

## 3. Technical Specifications

### 3.1 Data Source & Logic
Data for reports and exports will be sourced primarily from Supabase Views and Functions defined in PRD 12.

- **Primary Views**:
  - `vw_user_allowance_summary`: For allowance balance reporting.
  - `vw_pending_approvals`: (Extended) for request status reporting.

- **Primary Functions**:
  - `calculate_working_days()`: To ensure export "Total Days" exactly matches system calculation logic.
  - `calculate_user_allowance()`: For accurate balance reporting.

### 3.2 Security & Permissions
Access to reporting and export functions must adhere to the following matrix:

| Action | Admin | Supervisor | Employee |
|--------|-------|------------|----------|
| Export All Company Data | ✅ | ❌ | ❌ |
| Export Department Data | ✅ | ✅ (Own Dept) | ❌ |
| Export Personal Data | ✅ | ✅ | ✅ |
| View System Analytics | ✅ | ✅ (Own Dept) | ❌ (Personal) |

> [!IMPORTANT]
> Supabase RLS policies MUST be applied to the export API routes to prevent data scraping or unauthorized extraction.

### 3.3 Implementation Patterns
- **API Strategy**: Dedicated API routes (`/api/reports/export`) using `papaparse` or similar library for CSV generation on the server side (Next.js Edge or Serverless Functions).
- **Format**: UTF-8 encoded CSV to ensure support for multi-language names and comments.

---

## 4. User Experience Details

### 4.1 Reporting Dashboard Mockup (Visual)
- **Top Bar**: Period Selector (Yearly/Custom), Entity Selector (All/Dept/Employee).
- **Main View**: Dashboard cards for "Total Absences", "Pending Decisions", "Next Holiday".
- **Visualizations**: Simple BAR charts for Leave Type distribution.

### 4.2 Export Flow
1. User navigates to **"Admin > Reports"** or **"Dashboard > Export"**.
2. User selects filters (e.g., "Full Year 2025", "IT Department", "Approved Only").
3. User clicks **"Generate CSV"**.
4. System validates permissions and generates file.
5. Download starts automatically.

---

## 5. Testing Requirements

### 5.1 Validation Scenarios
- [ ] **Data Integrity**: Verify that a CSV export of 50 requests exactly matches the DB `leave_requests` table for the filtered period.
- [ ] **Half-Day Accuracy**: Ensure `day_part` (morning/afternoon) is correctly labeled in exports and counts as 0.5 days.
- [ ] **RBAC Enforcement**: Attempt to export another department's data as a Supervisor and verify `403 Forbidden` response.
- [ ] **Large Dataset**: Test export with 1,000+ entries to ensure no timeout on Vercel functions.

### 5.2 Edge Cases
- **Empty Reports**: Ensure the system returns a CSV with headers only (no crash) if no data matches the filters.
- **Deleted Users**: Ensure "Soft Deleted" users can be included or excluded from reports based on a toggle.
- **Concurrent Exports**: Ensure the server handles multiple users generating reports simultaneously.

---

## 6. Dependencies & References

- **PRD 01**: User roles and permission levels.
- **PRD 04**: Status definitions for leave requests.
- **PRD 06**: Allowance calculation logic.
- **PRD 12**: Database schema, views, and SQL functions.

---

## Document Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-10 | Senior PM | Initial draft created for Timeoff V2. |

---

*End of PRD 09 - Reporting & Data Export*
