# Product Requirements Document (PRD)

## Feature: Admin Workflow Engine for Leave Management

| Metadata | Details |
| --- | --- |
| **Title** | Admin Workflow Creation Engine |
| **Version** | 1.6 (Added Skeleton loading states for initial data fetch) |
| **Status** | Ready for Dev |
| **Scope** | Enable admins to create dynamic approval flows and watcher rules without requiring code releases, supporting Multi-Role logic. |

## 1. Executive Summary

The objective is to decouple the business logic (who approves leave requests) from the source code. We will create a **Workflow Engine** within the settings area that allows the definition of "Workflow Policies". These policies dynamically determine, based on the requester's attributes (User Role, Project Role, Contract, Project), who must approve (Approvers) and who must be notified (Watchers).

The system must support sequential and parallel approvals, project/area-based scopes, automatic safety fallbacks, and **simultaneous evaluation of multiple roles** (Global vs Project-Specific).

## 2. Glossary and Definitions

- **Workflow Policy:** A container of rules defining a complete flow.
- **User Role (Default):** The main role assigned to the user profile (Global context).
- **Project Role:** A specific role assigned to the user within a Project context.
- **Trigger (Conditions):** Conditions determining if a Policy applies.
- **Resolver:** The entity that must act in a step.
- **Sub-Flow (Instance):** A specific instance of the approval flow generated for a specific **[Role + Context]** combination.

## 3. Functional Requirements: Admin Interface (Builder)

*(See Section 8 for strict UI/UX and component specifications).*

### 3.1 Policy Creation (Trigger)

The admin must be able to create a new Policy by defining application criteria ("Who does this flow apply to?").
**Trigger Fields (AND Logic):**

- **Request Type:** Choice among request types already configured in the system.
- **Contract Type:** List of available contract types retrieved from the database, plus a hardcoded `Any / All Types` option.
- **Subject Role:** List of available roles or `Any / All Roles`.
- **Department:** List of departments or `Any`.
- **Project Type:** `Project`, `Staff Augmentation`, `Any`.

### 3.2 Step Definition (Sequence Builder)

Inside a Policy, the admin defines an ordered list of **Steps**.
**Step Attributes:**

1. **Resolver (Who is it?):** Specific Role, Department Manager, Line Manager, or Specific User.
2. **Context Scope (Relationship Constraint - Multiselect):** `Global`, `Same Area`, `Same Project`, `Same Department`.
3. **Action:** `Require Approval` or `Auto-Approve`.

### 3.3 Watcher Definition

A separate section defining non-blocking notifications, requiring the same fields (Resolver, Context Scope) but without the sequence ordering or action requirements.

## 4. Functional Requirements: Execution Engine (Runtime)

### 4.1 Policy Matching (Additive Logic)

The system **MUST NOT** stop at the first matching policy. It must aggregate all applicable policies based on the Multi-Role definitions.

1. **Identify User Roles:** Retrieve the User Role and relevant Project Roles. Fallback to User Role if no Project Role exists for a specific project.
2. **Policy Collection:** Find policies matching User Role, Project Role(s), and "Any Role".
3. **Aggregation:** The final set of rules is the **UNION** of all matched policies.

### 4.2 Resolver Resolution (Single Context)

For each Step, the system applies the intersection (AND) of all selected scopes.

### 4.3 Multi-Project & Multi-Role Execution (The Matrix)

The system must instantiate independent approval flows for every applicable Role-Context combination.

1. **Context & Role Explosion:** Evaluates the request against every active context.
2. **Sub-Flow Generation:** Generates parallel Sub-Flows for User Roles and Project Roles independently.
3. **Outcome Aggregation:** The Master Request is considered **APPROVED** only when **ALL** generated Sub-Flows are successfully completed.

### 4.4 "Self-Approval" Handling (Conflict)

A user can never approve themselves. The step is marked as **SKIPPED**.

### 4.5 Watcher/Approver Priority Handling

If a user is both a Watcher and an Approver for the same request, the **Approver** role has priority.

### 4.6 Fallback & Safety Net

If the engine cannot resolve a valid user: Level 1 (Policy specific fallback) -> Level 2 (Department Manager) -> Level 3 (Admin).

### 4.7 Request Immutability

Once sent, a request cannot be modified. It must be **Deleted** and recreated.

### 4.8 Rejection Handling

If any approver in any Sub-Flow **REJECTS**, the Master Request becomes **REJECTED**.

### 4.9 Admin Override

Admin can **Force Approve / Force Reject**. Must be logged in Audit.

## 5. Exemplary Use Cases (Updated for Multi-Role)

### Case A: The "CTO & Tech Lead" Scenario (Multi-Role)

- **User:** Alice (`CTO` User Role, `Tech Lead` Project Alpha Role).
- **Execution:** Generates Flow 1 (routes to CEO for CTO role) and Flow 2 (routes to PM for Tech Lead role). Both must approve.

### Case B: Fallback Role Scenario

- **User:** Bob (`Developer` User Role, assigned to Project Beta with no specific Project Role).
- **Execution:** System falls back to `Developer` for Project Beta and routes to the Tech Lead of Project Beta.

## 6. Data Model Changes

No DDL changes required to Prisma Schema. The logic change is purely in the **Query and Service Layer**.

- `User.defaultRoleId` maps to User Role.
- `UserProject.roleId` maps to Project Role.
- The Application Service must fetch both IDs and query `ApprovalRules` for both simultaneously.

## 7. Non-Functional Requirements

- **Audit Trail:** Every change to Policies must be logged.
- **Performance:** Generation of the approval tree must occur < 200ms.
- **Validation:** Admin interface must prevent creation of steps without defined Resolvers.

## 8. Strict UI/UX Specifications (shadcn/ui)

This section mandates the exact UI components and layouts to be used. The frontend MUST be built using **shadcn/ui** components, **Tailwind CSS** for layout/spacing, and **lucide-react** for icons.

### 8.1. Overview Page (`/settings/workflows`)

The landing page displaying all active policies.

- **Layout:** Standard admin page with a top header and a data table.
- **Initial Loading State:** While fetching the list of policies from the database, the `DataTable` MUST display a loading state using shadcn `<Skeleton />` components mimicking the table rows and columns.
- **Empty State:** If no policies are configured (and loading is complete), the page MUST display a visually distinct empty state block with the text "No policies configured yet" and a primary `<Button>` "Create your first policy".
- **Components MUST be used:**
    - Header: `h1` text with a `Button` (variant="default") aligned to the right: `<Plus /> Create Policy`.
    - Table: `DataTable` (TanStack Table + shadcn `Table` component). The table MUST contain the following columns:
        - **Name:** The name of the policy.
        - **Triggers / Applies To:** Summarized trigger conditions (e.g., "Developer • Any Project").
        - **Steps:** Number of sequential/parallel approval steps.
        - **Status:** `Badge` (variant="default" for Active, variant="secondary" for Inactive).
        - **Actions:** `DropdownMenu` triggered by a `Button` (variant="ghost", size="icon") with a `<MoreHorizontal />` icon. Dropdown items MUST include: `Edit`, `Duplicate`, `Delete` (text-red-600).
- **Destructive Actions:** Clicking "Delete" on a policy MUST trigger a shadcn `AlertDialog` to explicitly ask for confirmation before actual deletion.
- **Mobile Behavior:** `DataTable` MUST transform into a stacked list of `Card` components if screen width `< 768px` (horizontal scrolling is NOT permitted).

### 8.2. Policy Builder - General Layout (`/settings/workflows/create` or `/[id]`)

A dedicated full-page view to avoid modal constraints.

- **Layout:** Top-to-bottom single-column scrollable page.
- **Header (Sticky):**
    - MUST be wrapped in a sticky header (`sticky top-0 z-10 bg-background/95 backdrop-blur`).
    - Left side: `Button` (variant="ghost", size="icon") with `<ArrowLeft />` navigating back.
    - Center: `Input` for the Policy Name. MUST be prominent (e.g., `text-xl font-bold h-12 border-none focus-visible:ring-0 shadow-none px-0`). Placeholder: "Enter policy name...".
    - Right side: `Button` (variant="outline") "Cancel" and `Button` (variant="default") "Save Policy".
- **Form State & Validation:** Entire page MUST be wrapped in shadcn `Form` (react-hook-form + zod).
    - **Validation Rules:** Policy Name is required, at least 1 Trigger condition is required, at least 1 Approver step is required.
    - **Error States:** Invalid fields MUST display a red border (`border-destructive`) and inline error messages using shadcn's `<FormMessage />`.
- **Initial Loading State (Edit Mode):** When navigating to edit an existing policy (`/[id]`), the page MUST display shadcn `<Skeleton />` components mimicking the form blocks (Triggers, Sequence, Watchers) while data is being fetched.
- **Saving State:** Upon clicking "Save Policy", the button MUST become disabled and display a `<Loader2 className="animate-spin" />` icon to prevent duplicate submissions.
- **Unsaved Changes:** MUST trigger an `AlertDialog` if the user clicks back/cancel with dirty form state.

### 8.3. Block 1: Triggers ("Who does this apply to?")

- **Container:** A `Card` component.
    - `CardHeader`: `CardTitle` ("Trigger Conditions") and `CardDescription`.
    - `CardContent`: A grid layout (`grid grid-cols-1 md:grid-cols-2 gap-4`).
- **Fields:** MUST use `FormField` wrapping the specific inputs.
- **Component for Selections:** * Since multiple selections are required, the developer MUST implement a **MultiSelect** component using shadcn's `Popover`, `Command`, `CommandInput`, `CommandGroup`, and `CommandItem`.
    - Selected items MUST be displayed as `Badge` components inside the trigger button of the Popover.
    - *Required MultiSelects:* Request Type, Subject Role, Department, Project Type.
- **"Any" Option Logic:** If the user selects the "Any / All" option within a MultiSelect or Select field (e.g., Any Role, Any Project), the system MUST automatically clear any other selected items in that field and disable selecting additional specific items until "Any" is deselected.
- **Contract Type:** Standard `Select` component populated dynamically with active contract types from the database. The only hardcoded option MUST be `Any`.

### 8.4. Block 2: Approval Sequence ("Who must approve?")

This is the core visual timeline. It MUST NOT ask the user to input numbers (1, 2, 3). The sequence is determined by visual vertical placement.

- **Container:** Standard `div` serving as the timeline canvas, with a subtle vertical line running down the left side (`border-l-2 border-muted ml-4`).
- **Sequential Step (Vertical):**
    - Represented as a `Card` placed along the vertical line.
    - `CardContent` layout: `flex flex-col md:flex-row gap-4 items-start md:items-center p-4`.
- **Parallel Step (Horizontal/Grouped):**
    - Parallel steps MUST be enclosed in a grouping container: `div` with `border-2 border-dashed border-muted rounded-lg p-4 bg-muted/20`.
    - Inside the container, multiple Step `Card` components are rendered.
- **Inside a Step `Card`:**
    - **Visual Numbering:** Top-left corner MUST have a `Badge` (variant="secondary") displaying the step number (e.g., "Step 1", "Step 2"). Parallel steps will share the same step number.
    - Icon: `<User />` (lucide-react).
    - Field 1: `Select` for "Resolver" (referencing the **Role** entity from the database, e.g., Tech Lead).
    - Field 2: MultiSelect pattern (using `Popover` + `Command` + `Badge`) for "Context Scope". The options MUST be a static hardcoded list of constants mapping to their respective relational constraints: `Global` (no constraint), `Same Area` (checks `Area` entity), `Same Project` (checks `Project` entity via `UserProject`), `Same Department` (checks `Department` entity).
    - Field 3: `Switch` labeled "Auto-Approve". If activated, the other fields in this card (Field 1: Resolver, Field 2: Context Scope) MUST NOT be required and should be visually disabled or hidden, as this option invalidates them.
    - Actions:
        - `Button` (variant="ghost", size="icon") with `<ArrowUp />` to move the step up in the sequence.
        - `Button` (variant="ghost", size="icon") with `<ArrowDown />` to move the step down in the sequence.
        - `Button` (variant="ghost", size="icon", text-red-600) with `<Trash2 />` to delete the step.
- **Controls for adding steps:**
    - Below the last step: `Button` (variant="secondary", class="ml-[-12px] rounded-full") with `<Plus /> Add Next Step`.
    - Next to a single step (to turn it into a parallel group): `Button` (variant="outline", size="sm") `<Plus /> Add Parallel Approver`.
- **Mobile Behavior:** Parallel groups stack vertically inside the dashed container. Horizontal alignment is exclusively for desktop (`md:flex-row`).

### 8.5. Block 3: Watchers ("Who gets notified?")

Strictly separated from the approval timeline to prevent conceptual confusion.

- **Container:** A separate `Card` at the bottom of the page.
    - `CardHeader`: `CardTitle` ("Watchers") with `<Eye />` icon.
- **Content Layout:** A vertical list (`flex flex-col gap-4`).
- **Watcher Item (`Card`):** MUST use the exact same `Card` layout as the Approver cards to ensure UI consistency, but without the timeline styling and without visual numbering.
    - `CardContent` layout: `flex flex-col md:flex-row gap-4 items-start md:items-center p-4`.
    - Icon: `<Eye />` (lucide-react).
    - Field 1: `Select` for "Resolver" (referencing the **Role** entity from the database, e.g., Tech Lead).
    - Field 2: MultiSelect pattern (using `Popover` + `Command` + `Badge`) for "Context Scope". The options MUST be a static hardcoded list of constants mapping to their respective relational constraints: `Global` (no constraint), `Same Area` (checks `Area` entity), `Same Project` (checks `Project` entity via `UserProject`), `Same Department` (checks `Department` entity).
    - Action: `Button` (variant="ghost", size="icon", text-red-600) with `<Trash2 />` to delete the watcher.
    - *Constraint:* The "Auto-Approve" switch and reordering arrows (`<ArrowUp />`, `<ArrowDown />`) present in the Approver card MUST be omitted here.
- **Control:** A `Button` (variant="outline") `<Plus /> Add Watcher`.

### 8.6. Feedback and Notifications

- Successful save or validation errors MUST be displayed using the shadcn `useToast` hook (`Toast` component).