# PRD 07: Approval Management & Supervisor Functions

**Document Version:** 1.0  
**Date:** January 10, 2026  
**Status:** Draft  
**Author:** Senior Product Manager

---

## 1. Executive Summary

### 1.1 Business Context
In TimeOff Management Application v2, the approval process is the critical bridge between employee requests and organizational capacity planning. Supervisors need efficient tools to manage their team's absences without becoming a bottleneck. This PRD defines the specialized functions and interfaces required for Department Supervisors and Administrators to manage the lifecycle of leave requests, providing visibility into team availability and allowance status.

### 1.2 Goals and Objectives
- **Efficiency:** Provide a streamlined dashboard for managing pending requests with bulk action capabilities.
- **Visibility:** Ensure supervisors have a clear view of team calendars and leave allowances to make informed approval decisions.
- **Continuity:** Implement approval delegation and out-of-office handling to prevent workflow stalls during supervisor absences.
- **Auditability:** Maintain a clear history of approval decisions for compliance and transparency.

### 1.3 Success Criteria
- Supervisors can approve or reject a request in less than 3 clicks from the dashboard.
- Bulk actions (approve/reject) are available for multiple pending requests.
- Supervisors can view team member allowances and calendars directly from the approval context.
- Delegation setup is intuitive and time-bound.
- All approval actions are logged correctly in the audit trail.

---

## 2. Detailed Requirements

### 2.1 Functional Requirements

#### 2.1.1 Supervisor Dashboard (Pending Requests View)
- **Centralized View:** A dedicated dashboard listing all pending leave requests requiring the supervisor's action.
- **Request Details:** Display employee name, leave type, dates, duration (days), and employee comments.
- **Inline Actions:** Quick "Approve" and "Reject" buttons for individual requests.
- **Filtering & Sorting:** Sort by submission date, employee, or start date. Filter by department or leave type.

#### 2.1.2 Bulk Actions
- **Multi-select:** ability to select multiple requests from the pending list.
- **Bulk Approval:** One-click approval for all selected requests.
- **Bulk Rejection:** ability to reject multiple requests with a mandatory shared comment.

#### 2.1.3 Approval Workflow Management
- **Status Transitions:** Manage transitions between `new`, `approved`, `rejected`, and `pended_revoke` (as defined in PRD 12).
- **Mandatory Comments:** Require a comment from the supervisor when rejecting a request or revoking an approved leave.
- **Conflict Highlighting:** Visually flag requests that overlap with existing approved leaves in the same department/team.

#### 2.1.4 Supervisor Delegation
- **Delegation setup:** allow supervisors to delegate their approval authority to another user for a specific period.
- **Automatic Routing:** During the delegation period, new requests are automatically routed to the delegate's dashboard.
- **Notification:** Notify both the supervisor and the delegate when a delegation is initiated or expires.

#### 2.1.5 Team Visibility
- **Team Calendar:** Access to a team-wide calendar (Team View/Wall Chart) showing all member absences (PRD 05 integration).
- **Allowance Visibility:** View team members' current allowance status (total, used, remaining) to verify eligibility (PRD 06 integration).

#### 2.1.6 Out-of-Office Handling
- **Supervisor OOO:** When a supervisor is on leave themselves, the system should prompt for delegation or automatically escalate based on company settings.

### 2.2 User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US 7.1 | Supervisor | See all pending requests for my department in one place | I can quickly process them without digging through emails. |
| US 7.2 | Supervisor | Approve all "Standard Vacation" requests at once after a team meeting | I can save time on repetitive tasks. |
| US 7.3 | Supervisor | See who else is off when reviewing a new request | I can ensure we have enough coverage in the department. |
| US 7.4 | Supervisor | Delegate my approvals to my colleague while I'm on vacation | Employee requests don't get stuck waiting for me. |
| US 7.5 | Admin | Review the approval history for a specific employee | I can resolve disputes or audit leave patterns. |

### 2.3 Acceptance Criteria
- [ ] Dashboard correctly filters by `status = 'new'`.
- [ ] Rejection action is disabled unless a comment is provided.
- [ ] Bulk actions correctly update the database for all selected IDs and trigger appropriate notifications (PRD 08).
- [ ] Delegation record correctly redirects `get_approvers_for_leave_request` logic.
- [ ] Team calendar displays correctly filtered data for the supervisor's departments.

---

## 3. Technical Specifications

### 3.1 Data Model (Reference PRD 12)
- **Primary Table:** `leave_requests` (approver_id, status, approver_comment)
- **Workflow Tables:** `approval_rules`, `approval_steps`.
- **Relationship Table:** `department_supervisor` (junction for many-to-many supervisors).
- **Audit Table:** `audit` (to track status changes).

### 3.2 API Endpoints (Draft)
- `GET /api/approvals/pending`: Returns `vw_pending_approvals` data for the current user.
- `POST /api/approvals/action`: Accepts `{ requestIds: UUID[], action: 'approve' | 'reject', comment?: string }`.
- `POST /api/approvals/delegate`: Accepts `{ delegateId: UUID, startDate: Date, endDate: Date }`.
- `GET /api/approvals/history`: Returns history of actions taken by the current supervisor.

### 3.3 Integration Points
- **PRD 04 (Leave Workflow):** `prd_07` manages the "Decision" phase of the workflow.
- **PRD 08 (Notifications):** Triggers emails/in-app alerts upon approval/rejection/delegation.
- **PRD 12 (DB Schema):** Uses `calculate_working_days` and `vw_pending_approvals`.

---

## 4. User Experience

### 4.1 User Flows
1. **Approval Flow:** Dashboard -> View Conflict -> Add Comment -> Click Approve -> Success Notification.
2. **Delegation Flow:** Profile Settings -> Approval Delegation -> Select User & Dates -> Save.
3. **Bulk Action Flow:** Dashboard -> Select All -> Click Bulk Approve -> Confirmation Modal -> Processed.

### 4.2 Interaction Patterns
- **Glassmorphism:** Use subtle blur and transparency for the dashboard cards (Next.js/shadcn).
- **Micro-animations:** Smooth transitions when a request card is removed from the pending list after an action.
- **Notifications:** Toast messages using shadcn for immediate feedback on actions.

---

## 5. Implementation Notes

### 5.1 Performance
- Use Supabase views (`vw_pending_approvals`) to minimize complex joins on the client side.
- Optimize the conflict detection query to run only when a request is expanded or viewed.

### 5.2 Security
- **RLS Policies:** Ensure supervisors can only see/action requests where they are the designated approver or have delegation rights.
- **Admin Override:** Admins must have the ability to action any request in the system (managed via RLS/Clerk roles).

---

## 6. Testing Requirements

### 6.1 Test Scenarios
- **Direct Approval:** Verify a supervisor can approve a request from their own department.
- **Cross-Department Restriction:** Verify a supervisor *cannot* see or action requests from departments they don't manage.
- **Delegation Logic:** User A delegates to User B. User B should see User A's pending requests.
- **Bulk Action Limits:** Test bulk approval with 50+ requests to ensure no timeouts.
- **Concurrency:** Two supervisors trying to action the same request (if multi-supervisor) - handle gracefully.

---

## 7. Dependencies & References
- **PRD 01:** User Management (Roles/Permissions)
- **PRD 04:** Leave Request Workflow (Submission)
- **PRD 05:** Calendar Views
- **PRD 12:** Database Schema (Foundational)

---

## Document Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-10 | PM Team | Initial draft created |

---

*End of PRD 07 - Approval Management & Supervisor Functions*
