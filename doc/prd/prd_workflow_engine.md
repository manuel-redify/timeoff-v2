# Admin Workflow Engine for Leave Management

| Metadata | Details |
| --- | --- |
| **Title** | Admin Workflow Creation Engine |
| **Version** | 1.2 |
| **Status** | Ready for Dev |
| **Scope** | Enable admins to create dynamic approval flows and watcher rules without requiring code releases. |

## 1. Executive Summary

The objective is to decouple the business logic (who approves leave requests) from the source code. We will create a **Workflow Engine** within the administration area that allows the definition of "Workflow Policies". These policies dynamically determine, based on the requester's attributes (Role, Contract, Project), who must approve (Approvers) and who must be notified (Watchers).

The system must support sequential and parallel approvals, project/area-based scopes, and automatic safety fallbacks.

## 2. Glossary and Definitions

- **Workflow Policy:** A container of rules defining a complete flow (e.g., "Standard Developer Flow" or "Contractor Flow").
- **Trigger (Conditions):** The set of conditions determining if a *Workflow Policy* applies to a specific leave request.
- **Step:** A stage in the approval process. A policy can have N steps (sequential).
- **Resolver:** The role or entity that must act in a step (e.g., "Tech Lead", "Department Manager").
- **Context Scope:** The constraint binding the Resolver to the Requester (e.g., "Must be in the same Project").
- **Sub-Flow (Instance):** A specific instance of the approval flow generated for a single context (e.g., the flow for "Project A").

## 3. Functional Requirements: Admin Interface (Builder)

The admin must have access to a new "Workflow Settings" section to manage Policies.

### 3.1 Policy Creation (Trigger)

The admin must be able to create a new Policy by defining application criteria ("Who does this flow apply to?").

**Trigger Fields (AND Logic):**

- **Request Type:** Selector (Dropdown/Multiselect) allowing choice among request types already configured in the system (e.g., Vacation, Permit, Sick Leave, Smart Working).
- **Contract Type:** `Employee`, `Contractor`, `Any`.
- **Subject Role:** List of available roles (e.g., Developer, QA) or option `Any / All Roles`.
- **Department:** List of departments or `Any`.
- **Project Type:** `Project`, `Staff Augmentation`, `Any`.

### 3.2 Step Definition (Sequence Builder)

Inside a Policy, the admin defines an ordered list of **Steps**.

**Step Attributes:**

1. **Step Type:** `Approver` (Blocking) or `Watcher` (Non-blocking).
2. **Sequence Order:** Progressive integer (1, 2, 3...).
    - *Note:* Multiple rows with the same number = Parallel Approval.
    - *Note:* Watchers ignore the order and are notified at initiation.
3. **Resolver (Who is it?):**
    - `Specific Role` (e.g., Tech Lead, PM).
    - `Department Manager` (Structural role).
    - `Specific User` (Single user).
4. **Context Scope (Relationship Constraint - Multiselect):**
    - *Note:* Multiple options can be selected simultaneously. If multiple options are selected, all must be satisfied (AND Logic).
    - `Global`: No constraint (e.g., HR Admin). If selected, excludes other options.
    - `Same Area`: The Resolver must have the same Technical Area as the requester.
    - `Same Project`: The Resolver must be assigned to the same project as the request.
    - `Same Department`: The Resolver must belong to the same department.
5. **Action:**
    - `Require Approval`: The user must explicitly approve.
    - `Auto-Approve`: The step passes automatically (useful for Contractors or pro-forma notifications).

## 4. Functional Requirements: Execution Engine (Runtime)

When a user submits a request, the system must execute the following logic.

### 4.1 Policy Matching

1. The system scans active Policies.
2. Selects the most specific Policy matching the requester's profile (Contract Type, Role, Project Type).
    - *Priority Rule:* A rule with "Role: Developer" wins over one with "Role: Any".

### 4.2 Resolver Resolution (Single Context)

For each Step defined in the Policy, the system applies the intersection (AND) of all selected scopes.

- *Combined Example (Same Project + Same Area):* The system searches for users who have the indicated role AND are assigned to the same project as the requester AND belong to the same technical area.

### 4.3 Multi-Project Management (Context Splitting)

If the requester is active on multiple relevant contexts (e.g., works on **Project A** and **Project B** simultaneously) and the policy requires a `Same Project` scope:

1. **Splitting:** The system must instantiate the workflow defined by the Policy for **each** active context.
    - *Example:* If the policy prescribes `Step 1: Tech Lead` -> `Step 2: PM`, the system generates two parallel **Sub-Flows**:
        - **Sub-Flow A:** Tech Lead (Prj A) -> PM (Prj A)
        - **Sub-Flow B:** Tech Lead (Prj B) -> PM (Prj B)
2. **Independence:** The progress of Sub-Flows is independent (e.g., the TL of Project A can approve and pass the ball to the PM of Project A, even if the TL of Project B hasn't responded yet).
3. **Outcome Aggregation:** The Master Request is considered **APPROVED** only when **all** Sub-Flows are successfully completed.

### 4.4 "Self-Approval" Handling (Conflict)

A user can never approve themselves.

- **Check:** If `Resolver_ID == Requester_ID`.
- **Action:** The step is marked as **SKIPPED**. The flow proceeds to the next step.
- **Safety:** If all steps in a Sub-Flow are skipped, the Fallback is activated (see 4.6).

### 4.5 Watcher/Approver Priority Handling

A user might be both a Watcher (e.g., Tech Lead of another project) and an Approver (e.g., PM of the current project) for the same request.

- **Rule:** The **Approver** role has priority. The user must perform the action. Duplicate notifications must not be generated.

### 4.6 Fallback & Safety Net

If the engine cannot resolve a valid user for a mandatory Step in a specific context:

1. **Level 1 (Defined):** Checks if the Policy has a specific fallback (optional).
2. **Level 2 (Structural):** Assigns approval to the requester's **Department Manager**.
3. **Level 3 (Last Resort):** Assigns approval to the **Admin** group.
    - *Alert:* The system must log a warning for admins.

### 4.7 Request Immutability

- **Modification Prohibited:** Once sent, a request cannot be modified (neither dates nor details) by the requester.
- **Reset Workflow:** If the user needs to change something, they must **Delete** the request and create a new one. User must be clearly informed about this in the UI.
    - Deletion sends a "Request Cancellation" notification to all approvers and watchers already involved in the workflow, removing pending tasks from their dashboards.

### 4.8 Rejection Handling

- **Single Veto:** If any approver in any Sub-Flow **REJECTS** the request, the entire status of the Master Request becomes **REJECTED**.
- **Notifications:** The system sends a rejection notification to the requester and all other actors involved (even those who had already approved or had not yet acted), closing the process.

### 4.9 Admin Override

A feature must be present for **Admin** users:

- **Force Approve / Force Reject:** Ability to force the final status of the request, bypassing all pending checks and workflows.
- **Audit Log:** The override action must be tracked in system logs indicating who forced the action.

## 5. Exemplary Use Cases (Test Cases)

### Case A: Multi-Project Developer (Splitting)

- **Scenario:** Dev works on Project Alpha and Project Beta.
- **Policy:** Tech Lead (Step 1) -> PM (Step 2).
- **Execution:**
    1. System generates two approval chains.
    2. Chain Alpha: TL Alpha -> PM Alpha.
    3. Chain Beta: TL Beta -> PM Beta.
    4. Request passes to "Approved" only when both PMs (Alpha and Beta) have given OK.

### Case B: Contractor (Auto-Approve)

- **Policy:** Contract=Contractor, Role=Any.
- **Step 1:** Resolver=PM, Scope=Same Project, Action=**Auto-Approve**.
- **Outcome:** Request is created and immediately approved.

### Case C: Tech Lead requests leave (Conflict)

- **Requester:** Mario (Tech Lead FE).
- **Policy:** Resolver=Tech Lead (Step 1) -> Resolver=PM (Step 2).
- **Execution:** System sees Mario is the Resolver for Step 1. Step is SKIPPED. Request goes directly to Luigi (PM).

## 6. Data Model Changes (Draft)

New tables or collections needed to support the engine.

**`workflow_policies`**

- `id`, `name`, `trigger_role_id`, `trigger_contract_type`, `trigger_project_type`, `trigger_dept_id`, `priority_index`

**`workflow_policy_steps`**

- `id`, `policy_id` (FK), `step_order`, `step_type`, `resolver_role_id`, `context_scope` (Array), `action_type`

**`request_approval_flow` (Runtime)**

- `id`
- `request_id` (FK)
- `context_identifier` (e.g., Project ID, or "Global")
- `status` (PENDING, APPROVED, REJECTED)

**`request_approval_step` (Runtime)**

- `id`
- `flow_id` (FK)
- `approver_user_id` (FK)
- `status` (PENDING, APPROVED, REJECTED, SKIPPED)
- `step_order`

## 7. Non-Functional Requirements

- **Audit Trail:** Every change to Policies must be logged.
- **Performance:** Generation of the approval tree must occur < 200ms.
- **Validation:** Admin interface must prevent creation of steps without defined Resolvers.