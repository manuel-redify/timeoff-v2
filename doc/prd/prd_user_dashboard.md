# Product Requirements Document (PRD) - User Dashboard

## 1. Objective & Vision

Build the User Dashboard for a leave management application. The page must allow the user to:

1. Monitor the status of the next upcoming leave (Hero Card).
2. View quick KPIs regarding leave usage (Satellite Cards).
3. Manage the request history via a filterable table.
4. Access full approval workflow details via a side Drawer.

## 2. Design System & Visual Identity (Redify)

The implementation must strictly adhere to the **Redify** system:

- **Vibe:** Modern High-Utility Productivity.
- **Borders:** Strictly `0.0625rem solid #e5e7eb` (neutral-200). No shadows.
- **Radius:** Main containers `rounded-lg` (12px), interactive elements `rounded-sm` (4px).
- **Functional Colors:**
    - `primary`: `#e2f337` (Neon Lime) - Used for focus, active steps, and highlighted states.
    - `success`: `#e3fae9` (Approved pill background).
    - `pending`: `#faf6d7` (Pending/New/Revoke pill background).
    - `error`: `#fee2e2` (Rejected pill background).
- **Typography:** Inter font family. Use `semibold` only for critical data labels.

## 3. Layout: Bento Box Grid (Upper Section)

The dashboard starts with a responsive Bento grid (`grid-cols-4` on desktop).

### 3.1 Hero Card: "Next Leave" (`col-span-2 row-span-2`)

Displays the chronologically closest leave request.

- **Query Logic:** `LeaveRequest` where `dateEnd >= TODAY`, status is `APPROVED` or `NEW`, ordered by `dateStart ASC`.
- **UI Elements:**
    - Title: "Next Leave" (Small, Neutral-400).
    - Dates: Range in extended format (e.g., "May 15 - 18") with `semibold` weight.
    - Status Badge: Colored pill based on `status`.
    - **Approval Progress:** A thin progress bar (Neon Lime) with the text "Step X of Y" (e.g., "Step 2 of 3: HR Approval").
- **Empty State:** If no future requests exist, show a minimal placeholder message.

### 3.2 Satellite Cards: KPI (`col-span-1 row-span-1`)

Four square blocks for summary data:

1. **Leaves Taken (YTD):** Sum of approved days in the current calendar year.
2. **Pending Requests:** Count of records with `status` as `NEW` or `PENDING_REVOKE`. If > 0, show a Neon Lime dot in the card corner.
3. **Upcoming Count:** Number of approved requests with a future `dateStart`.
4. **Balance (Conditional):** Visible only if `Company.defaultAllowance` or `Department.allowance` != NULL. Calculation: `Allowance - Taken`. If hidden, the Hero Card expands or the grid recompacts.

## 4. Business Logic: Duration Calculation

The `Duration` displayed throughout the app must be calculated dynamically (not a simple solar day difference):

1. **Day Iteration:** Iterate through every day between `dateStart` and `dateEnd`.
2. **Schedule Check:** Verify in the user's `Schedule` model if the weekday is working (`value 1`). If `value 2` (non-working), exclude from count.
3. **BankHoliday Check:** Verify if the date exists in `BankHoliday` (filtered by the user's `companyId` and `country`). If present, exclude.
4. **Half Days (DayPart):** Handle `0.5` values if `dayPartStart` or `dayPartEnd` are `MORNING` or `AFTERNOON`.

## 5. Requests Table & Actions

Positioned below the Bento Grid at full width.

- **Columns:** Type, Period (start/end dates), Duration, Status (pill), Submitted (creation date), Actions.
- **Filter:** Annual dropdown in the top right of the table.
- **Action Logic:**
    - **View:** Opens the side Drawer using the request `id`.
    - **Cancel:** Visible only if `TODAY < dateStart`. Triggers an immediate `status` update to `CANCELED`.
    - **Request Revoke:** Visible only if `TODAY >= dateStart` and `status == APPROVED`.

### 5.1 Revocation Workflow

When the user clicks "Request Revoke":

1. Show a minimal modal to enter a mandatory reason.
2. Update `status` to `PENDING_REVOKE`.
3. The pill in the table must reflect the yellow status with an alert icon.
4. The revoke action is disabled while awaiting admin intervention.

## 6. Detail Drawer

Side panel for deep dive visualization.

- **Header:** Title, Reference ID, Status Pill, and close button (X).
- **Information:** Metadata table or list (Type, Duration, User Notes).
- **Full Workflow Timeline:**
    - Vertical visualization of **all** `ApprovalStep` records planned for that request.
    - **Completed Steps:** Checkmark icon, approver name, and timestamp.
    - **Current Step:** Highlighted with Neon Lime border and "Awaiting" status.
    - **Future Steps:** Displayed in grey (`neutral-400`), indicating the remaining path.
- **Rejection Comment:** If `status == REJECTED`, show the `approverComment` field in a highlighted light red box.

## 7. Responsive Mobile Strategy

- **Breakpoint `md`:**
    - Bento Grid becomes a vertical stack (`grid-cols-1`).
    - KPI cards arrange into a 2x2 sub-grid.
    - Table transforms into a **Card List**: Each row becomes an independent module with large, easy-to-tap actions (minimum 44px).

## 8. AI Agent Specifications (Prisma & Implementation)

### 8.1 Centralized Calculation (Helper)

It is mandatory to use a **centralized helper function** for duration calculation. This must be invoked to populate data for the Hero Card, Table, and Drawer to ensure perfect consistency of working days across the interface.

### 8.2 Prisma Query

Always ensure to `include` relations for `leaveType` and `approvalSteps` (ordered by `sequenceOrder`).

### 8.3 Drawer Management (Portal)

For the Drawer implementation, use a **Portal** (e.g., `React Portal`). This is critical to avoid `z-index` conflicts or `overflow` issues caused by the Bento Box grid structure, ensuring the side panel overlays correctly on all page elements.

### 8.4 Status Updates

- `CANCELED`: Terminal state triggered by the user (pre-start).
- `PENDING_REVOKE`: Transition state for admin review (post-start).

### 8.5 Interface State

Implement Skeleton Screens for the Bento cards during the initial data fetch.