# Phase 7: Approval & Supervisor Dashboard - Task List

## Overview
This phase focuses on the management side of leave requests. We will build a specialized dashboard for supervisors to view and process pending requests efficiently. This includes bulk actions, conflict detection (visibility into team calendars), and delegation functionality to ensure the workflow remains smooth even when supervisors are away.

## Prerequisites
- [ ] Phase 1 (Foundation & Setup) completed.
- [ ] Phase 2 (User Management & Authentication) completed.
- [ ] Phase 3 (Company & Organizational Structure) completed.
- [ ] Phase 4 (Leave Type Configuration) completed.
- [ ] Phase 5 (Employee Allowance Management) completed.
- [ ] Phase 6 (Leave Request Workflow) completed.
- [ ] Read and understood [PRD 07: Approval Management & Supervisor Functions](file:///prd/porting_prd/prd_07_approval_management_and_supervisor_functions.md).
- [ ] Familiarity with [PRD 05: Calendar Views](file:///prd/porting_prd/prd_05_calendar_views_and_visualization.md) (for conflict detection context).

## Detailed Task Breakdown

### 1. Database & Backend
- [ ] **Implement Approval Delegation model**: Add the `ApprovalDelegation` model to `schema.prisma`.
  - **Done looks like**: Prisma schema updated with supervisor/delegate relations and date ranges; migration applied.
- [ ] **Pending Approvals Service**: Create a backend service to retrieve all requests requiring action by a specific user (including those delegated to them).
  - **Done looks like**: Service accounts for both direct approval steps and active delegation periods.
- [ ] **Bulk Approval API**: Implement `POST /api/approvals/bulk-action` to handle multiple requests in a single transaction.
  - **Done looks like**: API successfully processes arrays of IDs, applies decisions, and validates that comments are present for rejections.
- [ ] **Delegation Management Endpoints**: Implement CRUD endpoints for `ApprovalDelegation`.
  - **Done looks like**: Supervisors can manage their own delegations; Admins can manage all.
- [ ] **Conflict Detection Logic**: Implement a utility to find overlapping approved leaves within the same department or team.
  - **Done looks like**: Logic correctly flags "busy" periods where too many team members are already off.

### 2. UI & Frontend
- [ ] **Supervisor Dashboard View**: Build the specialized approvals dashboard (`/approvals`).
  - **Done looks like**: Interface displays a list of pending requests with employee details, project context, and inline actions.
- [ ] **Bulk Action Toolbar**: Add multi-select capabilities and a floating/sticky action bar for bulk operations.
  - **Done looks like**: Supervisors can easily select multiple requests and approve/reject them in one go.
- [ ] **Delegation Settings Page**: Build an interface in the supervisor's settings to manage active/scheduled delegations.
  - **Done looks like**: User-friendly form with date pickers and user search for selecting delegates.
- [ ] **Conflict Indicator Component**: Add visual markers (tooltips/badges) to request cards when overlaps with other team members are detected.
  - **Done looks like**: Supervisors see a "Conflict Detected" warning with details on who else is off during those dates.

### 3. Integration & Glue Code
- [ ] **Delegation Routing Engine**: Integrate delegation checks into the core approval resolution engine.
  - **Done looks like**: Requests are automatically visible to delegates during the specified timeframe.
- [ ] **Allowance Context Integration**: Ensure the dashboard displays the requester's remaining allowance balance.
  - **Done looks like**: Supervisors can see if a requester has sufficient balance before approving.
- [ ] **Audit Trail for Approvals**: Ensure all decisions (including bulk and delegated ones) are logged with the correct actor and context.
  - **Done looks like**: Audit logs distinguish between "Direct Approval" and "Approval via Delegate".

## Acceptance Criteria
- [ ] Supervisors can see and process all pending requests from their dashboard.
- [ ] Bulk approval and rejection (with mandatory comments) are fully functional.
- [ ] Delegation correctly transfers approval authority for a defined period.
- [ ] Supervisors can see potential leave conflicts and allowance status before deciding.
- [ ] All approval data is strictly filtered by company and supervisor permissions via RLS.

## Testing & Validation Checklist
- [ ] Automated tests for delegation time-boundaries (starts/ends exactly on schedule).
- [ ] Integration tests for bulk action transactions (all-or-nothing processing).
- [ ] Manual verification of conflict highlights for overlapping team member leaves.
- [ ] Manual verification that delegates see the correct requests.
- [ ] Mobile responsiveness check for the multi-select dashboard and delegation forms.
