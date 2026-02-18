# PRD Analysis - User Dashboard
**Version:** v1
**Date:** 2026-02-18
**Source PRD:** `doc/prd/prd_user_dashboard.md`

## 🎯 Objective

Build a User Dashboard for a leave management application enabling users to monitor upcoming leave via a Hero Card, view KPI metrics via Satellite Cards, manage request history through a filterable table, and access full approval workflow details via a side Drawer.

---

## 📋 Feature & Logic Map

| ID | Role | Feature | Functional Logic & Requirements | Edge Cases & Error Handling |
|:---|:---|:---|:---|:---|
| F01 | User | Hero Card - "Next Leave" | Query: `LeaveRequest` where `dateEnd >= TODAY`, `status` is `APPROVED` or `NEW`, ordered by `dateStart ASC`. Display: Title ("Next Leave" - Neutral-400), dates in extended format with semibold weight, status badge (colored pill), approval progress bar (Neon Lime) with "Step X of Y" text (e.g., "Step 2 of 3: HR Approval"). | Empty state: Show minimal placeholder if no future requests exist. |
| F02 | User | Satellite Cards - KPIs | 1) **Leaves Taken (YTD):** Sum of approved days in current calendar year. 2) **Pending Requests:** Count where `status` is `NEW` or `PENDING_REVOKE`. Show Neon Lime dot if > 0. 3) **Upcoming Count:** Number of approved requests with future `dateStart`. 4) **Balance (Conditional):** Only visible if `Company.defaultAllowance` or `Department.allowance` != NULL. Formula: `Allowance - Taken`. If hidden, Hero Card expands or grid recompacts. | Conditional visibility of Balance card requires grid reflow handling. |
| F03 | User | Duration Calculation | Centralized helper function (MUST be used for Hero Card, Table, Drawer). Logic: 1) Iterate every day between `dateStart` and `dateEnd`. 2) Check user's `Schedule` model - if weekday has `value 1` (working), include; if `value 2` (non-working), exclude. 3) Check `BankHoliday` filtered by user's `companyId` and `country` - if present, exclude. 4) Handle half days: if `dayPartStart` or `dayPartEnd` is `MORNING` or `AFTERNOON`, use `0.5` value. | Must handle overlapping bank holidays and schedule non-working days. Half-day logic must correctly handle single-day leaves with morning/afternoon. |
| F04 | User | Requests Table | Position: Below Bento Grid, full width. Columns: Type, Period (start/end dates), Duration, Status (pill), Submitted (creation date), Actions. Filter: Annual dropdown in top right. | Empty state when no requests exist. |
| F05 | User | Table Actions - View | Opens side Drawer using request `id`. | N/A |
| F06 | User | Table Actions - Cancel | Visible only if `TODAY < dateStart`. Triggers immediate `status` update to `CANCELED`. | Must prevent cancellation of started/ended leaves. |
| F07 | User | Table Actions - Request Revoke | Visible only if `TODAY >= dateStart` AND `status == APPROVED`. | Disabled while awaiting admin intervention. |
| F08 | User | Revocation Workflow | 1) Show minimal modal for mandatory reason input. 2) Update `status` to `PENDING_REVOKE`. 3) Table pill: yellow status with alert icon. | Reason must be mandatory - validate before submission. |
| F09 | User | Detail Drawer | Implementation: Use **Portal** (React Portal) to avoid z-index/overflow conflicts with Bento Grid. Header: Title, Reference ID, Status Pill, close button (X). Information: Metadata table/list (Type, Duration, User Notes). | Portal required for correct overlay behavior. |
| F10 | User | Drawer - Workflow Timeline | Vertical visualization of ALL `ApprovalStep` records for the request. States: **Completed:** Checkmark icon, approver name, timestamp. **Current:** Neon Lime border highlight, "Awaiting" status. **Future:** Grey (neutral-400), shows remaining path. | Must include all approval steps in sequence. |
| F11 | User | Drawer - Rejection Comment | If `status == REJECTED`, show `approverComment` in highlighted light red box. | N/A |
| F12 | User | Responsive Mobile | Breakpoint `md`: Bento Grid → vertical stack (`grid-cols-1`). KPI cards → 2x2 sub-grid. Table → Card List (each row becomes independent module with large 44px+ tap targets). | Minimum 44px touch targets for accessibility. |
| F13 | System | Prisma Query | Must `include` relations for `leaveType` and `approvalSteps` (ordered by `sequenceOrder`). | Missing includes will break display. |
| F14 | System | Loading State | Implement Skeleton Screens for Bento cards during initial data fetch. | N/A |

---

## 🏗️ Data Entities (Domain Model)

- **LeaveRequest:** Primary entity with `id`, `dateStart`, `dateEnd`, `status`, `dayPartStart`, `dayPartEnd`, `userId`, `leaveTypeId`, includes relation to `approvalSteps`. Status values: `NEW`, `APPROVED`, `REJECTED`, `CANCELED`, `PENDING_REVOKE`.
- **LeaveType:** Related to LeaveRequest via `leaveTypeId`. Contains leave type definitions.
- **ApprovalStep:** Related to LeaveRequest. Fields: `sequenceOrder`, `status`, `approverName`, `timestamp`, `approverComment`.
- **Schedule:** User-associated model with weekday `value` (1 = working, 2 = non-working).
- **BankHoliday:** Filtered by `companyId` and `country`.
- **Company:** Contains `defaultAllowance`, `companyId`.
- **Department:** Contains `allowance`.

---

## 🔗 Dependencies & Blockers

- **Internal:** F03 (Duration Calculation Helper) is critical dependency - MUST be implemented first or in parallel, as it's required by F01, F04, F09.
- **External:** None explicitly stated. Assumes existing auth system (JWT mentioned in rules), database with Prisma.

---

## 🔧 Technical Stack & Constraints

- **Stack:** React (implied by Portal, Skeleton Screens), Prisma (explicit in section 8), Inter font family.
- **Non-Functional:** 
  - Accessibility: 44px minimum touch targets on mobile.
  - Consistency: Single duration calculation helper ensures uniform working day calculations.
- **Constraints:**
  - Must use Portal for Drawer to avoid z-index/overflow issues.
  - Must include `leaveType` and `approvalSteps` relations in Prisma queries.
  - Must use Skeleton Screens for loading states.

---

## 🚫 Scope Boundaries

- **In-Scope:** 
  - Hero Card (Next Leave)
  - 4 Satellite KPI Cards
  - Filterable Requests Table
  - Side Drawer with workflow timeline
  - Revocation workflow (modal, status update)
  - Cancel action (pre-start)
  - Mobile responsive transformation
- **Out-of-Scope:**
  - Admin-side approval workflow implementation (only viewing in drawer)
  - Leave request creation (dashboard is view/manage only)
  - Notifications system
  - Email/communication triggers

---

## ❓ Clarifications Needed

1. **Balance Card Calculation:** What happens if `Allowance - Taken` results in negative? Allow negative 
2. **Hero Card Query:** Should `NEW` status include draft requests or only submitted requests? draft request doesn't exist
3. **Revocation Modal:** Is there a character limit for the mandatory reason?
4. **Half-Day Handling:** How to handle multi-day leaves that start/end with different dayParts? Multi date is for all day
5. **Skeleton Screens:** Should drawer also have skeleton during fetch, or fetch complete data before opening?
