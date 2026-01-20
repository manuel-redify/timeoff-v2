# Phase 6: Leave Request Workflow - Task List

## Overview
This phase implements the core leave application and approval process. It involves creating the request submission form, implementing the complex validation engine (overlap detection, allowance checks), and building the routing logic for both Basic (department-based) and Advanced (role/project-based) approval modes. This is the heart of the application's business logic.

## Prerequisites
- [x] Phase 1 (Foundation & Setup) completed.
- [x] Phase 2 (User Management & Authentication) completed.
- [x] Phase 3 (Company & Organizational Structure) completed.
- [x] Phase 4 (Leave Type Configuration) completed.
- [x] Phase 5 (Employee Allowance Management) completed.
- [x] Read and understood [PRD 04: Leave Request Workflow](file:///prd/porting_prd/prd_04_leave_workflow.md).
- [x] Familiarity with [PRD 07: Approval Management](file:///prd/porting_prd/prd_07_approval_management_and_supervisor_functions.md).

## Detailed Task Breakdown

### 1. Database & Backend
- [x] **Implement LeaveRequest model**: Add the `LeaveRequest` and `ApprovalStep` models to `schema.prisma`.
  - **Done looks like**: Prisma schema updated with relations to `User`, `LeaveType`, and `Project`, migration applied.
- [x] **Validation Engine Implementation**: Build a comprehensive validation service for leave requests.
  - **Done looks like**: Service handles date logic, overlap detection (including half-days), allowance availability, and leave type limits.
- [x] **Approval Routing Engine**: Implement the routing logic for both Basic and Advanced company modes.
  - **Done looks like**: Logic correctly identifies approvers based on department supervisors or complex role/project-based rules.
- [x] **Request Submission Endpoint**: Implement `POST /api/leave-requests`.
  - **Done looks like**: Endpoint creates the request, calculates days, triggers auto-approval if applicable, and initiates the approval chain.
- [x] **Approval Action Endpoints**: Implement `POST /api/leave-requests/:id/approve` and `POST /api/leave-requests/:id/reject`.
  - **Done looks like**: Actions update request status and approval steps (for Advanced mode), with self-approval prevention enforced.
- [x] **Cancellation & Revocation Endpoints**: Implement endpoints for cancelling pending requests and requesting/approving revocation of approved leaves.
  - **Done looks like**: Full request lifecycle state transitions work as defined in the PRD.

### 2. UI & Frontend
- [x] **Leave Request Form**: Build the main form for submitting leave requests with real-time feedback.
  - **Done looks like**: Form includes date pickers, day-part selection, leave type dropdown, and shows calculated days/remaining allowance before submission.
- [x] **My Requests View**: Build the page for employees to view their request history and current statuses.
  - **Done looks like**: Requests displayed with clear status indicators, filtering by year/type, and cancellation actions.
- [x] **Request Details Page**: Build a detailed view for a single leave request showing the approval progress.
  - **Done looks like**: View shows the sequence of approval steps and who is currently pending action.

### 3. Integration & Glue Code
- [x] **Allowance Sync Loop**: Integrate the request lifecycle with the `AllowanceService` to update "pending" and "used" balances.
  - **Done looks like**: Successive request states (new -> approved -> canceled) are correctly reflected in the user's allowance.
- [x] **Overlap Detection Helpers**: Refine the date-overlap logic to handle half-day combinations accurately.
  - **Done looks like**: Edge cases (e.g., Morning request on a day with an existing Afternoon request) are handled without conflict.
- [x] **Conflict Warning System**: Implement UI warnings if a request conflicts with other team members (if permissions allow visibility).
  - **Done looks like**: Users warned if their proposed dates overlap with many team members or public holidays.

## Acceptance Criteria
- [x] Employees can submit leave requests with full validation (overlaps, limits, allowance).
- [x] Requests are routed correctly based on the company's mode (Basic vs Advanced).
- [x] Sequence order in Advanced mode is strictly enforced (Step N approved before Step N+1).
- [x] Self-approval is prevented unless auto-approve is explicitly enabled.
- [x] Complete request lifecycle (subsidize, approve, reject, cancel, revoke) is functional.

## Testing & Validation Checklist
- [x] Unit tests for the routing engine (both Basic and Advanced modes).
- [x] Unit tests for overlap detection (testing all 7+ combinations of full/half days).
- [x] Integration tests for the full approval chain in Advanced mode.
- [x] Manual verification of self-approval prevention logic.
- [x] Manual verification of allowance deduction during the approval lifecycle.
- [x] Mobile responsiveness check for the request form and history views.
