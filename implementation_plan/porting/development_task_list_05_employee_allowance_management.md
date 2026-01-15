# Phase 5: Employee Allowance Management - Task List

## Overview
This phase implements the logic for tracking and calculating employee leave entitlements. It covers annual allowance calculation (including pro-rating for new hires), manual adjustments (days in lieu), carry-over rules from previous years, and real-time consumption tracking. This is a critical prerequisite for the leave request workflow.

## Prerequisites
- [ ] Phase 1 (Foundation & Setup) completed.
- [ ] Phase 2 (User Management & Authentication) completed.
- [ ] Phase 3 (Company & Organizational Structure) completed.
- [ ] Phase 4 (Leave Type Configuration) completed.
- [ ] Read and understood [PRD 06: Employee Allowance Management](file:///prd/porting_prd/prd_06_employee_allowance_management.md).
- [ ] Familiarity with [PRD 12: Database Schema](file:///prd/porting_prd/prd_12_database_schema_and_data_model.md) regarding allowance tables.

## Detailed Task Breakdown

### 1. Database & Backend
- [ ] **Implement UserAllowanceAdjustment model**: Add the `UserAllowanceAdjustment` model to `schema.prisma`.
  - **Done looks like**: Prisma schema updated with relations to `User`, migration applied.
- [ ] **Allowance Calculation Service**: Create a backend service (`AllowanceService`) to calculate total, used, and available allowance for a given user and year.
  - **Done looks like**: Service correctly handles base allowance (department vs company default) and pro-rating logic for start/end dates.
- [ ] **Adjustment Management Endpoints**: Implement `GET /api/allowance/user/:userId/year/:year` and `POST /api/allowance/adjustment`.
  - **Done looks like**: Admins can retrieve a full breakdown and add manual adjustments with audit logs.
- [ ] **Carry-Over Logic**: Implement the logic to calculate and apply unused allowance from the previous year at the start of a new allowance year.
  - **Done looks like**: Automated check/application of carry-over days based on company settings (`carry_over` limit).
- [ ] **Working Day Calculator**: Implement a utility to calculate the number of "deductible" days in a date range, accounting for the user's schedule and public holidays.
  - **Done looks like**: Utility accurately returns day counts (including half-days) for any date range.

### 2. UI & Frontend
- [ ] **Allowance Summary Widget**: Build the dashboard widget showing Total, Used, Pending, and Available allowance.
  - **Done looks like**: Widget displayed on the user dashboard with color-coded status indicators.
- [ ] **Detailed Allowance View**: Build a page or modal showing the full breakdown (Base + Pro-rated + Adjustments + Carry-over).
  - **Done looks like**: Users can see exactly how their current balance was calculated.
- [ ] **Admin Allowance Management UI**: Build the interface in the User Profile or Admin Settings to manage manual adjustments.
  - **Done looks like**: Admins can add/edit adjustments and see a history of changes.
- [ ] **Team Allowance Dashboard**: Build a view for supervisors to monitor the allowance status of all their team members.
  - **Done looks like**: Supervisors see a sortable list of team members and their remaining balances.

### 3. Integration & Glue Code
- [ ] **Company Initialization Hook**: Ensure default allowance settings are applied when a new company is created.
  - **Done looks like**: New companies start with consistent default allowance rules.
- [ ] **User Registration Hook**: Automatically calculate the initial pro-rated allowance when a new user is added.
  - **Done looks like**: New user profiles immediately show an accurate pro-rated balance.

## Acceptance Criteria
- [ ] Allowance calculations match v1 logic, including pro-rating for mid-year hires/leavers.
- [ ] Manual adjustments (positive/negative) can be applied by admins with an audit trail.
- [ ] Carry-over rules are enforced according to company configuration.
- [ ] Available allowance is calculated in real-time, accounting for approved and pending requests.
- [ ] Calculations correctly exclude non-working days and public holidays.

## Testing & Validation Checklist
- [ ] Unit tests for pro-rating logic (check various start dates and allowance years).
- [ ] Unit tests for carry-over calculation (check zero, partial, and full carry-over scenarios).
- [] Unit tests for working day calculator (verify weekend and holiday exclusion).
- [ ] Integration tests for allowance adjustments (verify updates to available balance).
- [ ] Manual verification of allowance display for a user with multiple adjustments.
- [ ] Mobile responsiveness check for allowance breakdown and admin adjustment forms.
