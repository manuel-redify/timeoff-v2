# Workflow Engine for Leave Management

| Metadata | Details |
| --- | --- |
| **Title** | Admin Workflow Creation Engine |
| **Version** | 1.3 (Multi-Role Support) |
| **Status** | Ready for Dev |
| **Scope** | Enable admins to create dynamic approval flows and watcher rules without requiring code releases, supporting **Multi-Role** logic. |

## 1. Executive Summary

The objective is to decouple the business logic (who approves leave requests) from the source code. We will create a **Workflow Engine** within the administration area that allows the definition of "Workflow Policies". These policies dynamically determine, based on the requester's attributes (User Role, Project Role, Contract, Project), who must approve (Approvers) and who must be notified (Watchers).

The system must support sequential and parallel approvals, project/area-based scopes, automatic safety fallbacks, and **simultaneous evaluation of multiple roles** (Global vs Project-Specific).

## 2. Glossary and Definitions

- **Workflow Policy:** A container of rules defining a complete flow.
- **User Role (Default):** The main role assigned to the user profile (Global context).
- **Project Role:** A specific role assigned to the user within a Project context.
- **Trigger (Conditions):** Conditions determining if a Policy applies.
- **Resolver:** The entity that must act in a step.
- **Sub-Flow (Instance):** A specific instance of the approval flow generated for a specific **[Role + Context]** combination.

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
    - `Line Manager` (If provided in user profile).
    - `Specific User` (Single user, e.g., CEO).
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

### 4.1 Policy Matching (Additive Logic)

Unlike the previous version, the system **MUST NOT** stop at the first matching policy. It must aggregate all applicable policies based on the Multi-Role definitions.

1. **Identify User Roles:**
    - Retrieve the **User Role** (Default Role from `Users` table).
    - Retrieve any **Project Role** relevant to the projects involved in the request (from `UserProject` table).
    - *Fallback:* If a user is in a project but has NO Project Role defined, the User Role applies to that project context.
2. **Policy Collection:**
    - Find policies matching the **User Role** (Global Rules).
    - Find policies matching the **Project Role(s)** (Contextual Rules).
    - Find policies matching **"Any Role"** (Generic Rules).
3. **Aggregation:** The final set of rules to execute is the **UNION** of all matched policies.

### 4.2 Resolver Resolution (Single Context)

For each Step defined in the Policy, the system applies the intersection (AND) of all selected scopes.

- *Combined Example (Same Project + Same Area):* The system searches for users who have the indicated role AND are assigned to the same project as the requester AND belong to the same technical area.

### 4.3 Multi-Project & Multi-Role Execution (The Matrix)

The system must instantiate independent approval flows for every applicable Role-Context combination.

1. **Context & Role Explosion:**
The engine evaluates the request against every active context.
    - *Scenario:* User is `CTO` (User Role) and `Tech Lead` (Project A Role).
2. **Sub-Flow Generation:**
The system generates parallel **Sub-Flows**:
    - **Flow A (Based on User Role):** Applies policies targeted at `CTO`. (e.g., Approval by CEO).
    - **Flow B (Based on Project Role):** Applies policies targeted at `Tech Lead` inside `Project A`. (e.g., Approval by Project A PM).
3. **Independence:** * Flow A and Flow B run in parallel.
    - Actions in Flow A do not affect Flow B (unless configured otherwise).
4. **Outcome Aggregation:** The Master Request is considered **APPROVED** only when **ALL** generated Sub-Flows are successfully completed.

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
3. **Level 3 (Last Resort):** Assigns approval to the **Admin / HR** group.
    - *Alert:* The system must log a warning for admins.

### 4.7 Request Immutability

- **Modification Prohibited:** Once sent, a request cannot be modified (neither dates nor details) by the requester.
- **Reset Workflow:** If the user needs to change something, they must **Delete** the request and create a new one.
    - Deletion sends a "Request Cancellation" notification to all approvers and watchers already involved in the workflow, removing pending tasks from their dashboards.

### 4.8 Rejection Handling

- **Single Veto:** If any approver in any Sub-Flow **REJECTS** the request, the entire status of the Master Request becomes **REJECTED**.
- **Notifications:** The system sends a rejection notification to the requester and all other actors involved (even those who had already approved or had not yet acted), closing the process.

### 4.9 Admin Override

A feature must be present for users with **Super Admin / HR** role:

- **Force Approve / Force Reject:** Ability to force the final status of the request, bypassing all pending checks and workflows.
- **Audit Log:** The override action must be tracked in system logs indicating who forced the action.

## 5. Exemplary Use Cases (Updated for Multi-Role)

### Case A: The "CTO & Tech Lead" Scenario (Multi-Role)

- **User:** Alice.
- **Roles:** * `CTO` (User Role - Default).
    - `Tech Lead` (Project Role in "Project Alpha").
- **Policies:**
    - Policy 1: "Executive Flow" (Trigger: Role=CTO) -> Approver: CEO.
    - Policy 2: "Project Tech Flow" (Trigger: Role=Tech Lead) -> Approver: PM.
- **Execution:**
Alice requests time off. The system detects she is acting in a dual capacity.
    1. **Sub-Flow 1 (Executive):** Routes to CEO.
    2. **Sub-Flow 2 (Project Alpha):** Routes to PM of Alpha.
    
    **Result:** Alice gets her leave approved only if **BOTH** the CEO and the PM approve.
    

### Case B: Fallback Role Scenario

- **User:** Bob.
- **Roles:**
    - `Developer` (User Role).
    - Assigned to "Project Beta" (No specific Project Role assigned).
- **Policies:**
    - Policy 1: "Dev Flow" (Trigger: Role=Developer) -> Approver: Tech Lead.
- **Execution:**
System checks Project Beta. No Project Role found. Fallback to User Role (`Developer`).
System matches Policy 1 for Project Beta context.
**Result:** Routes to Tech Lead of Project Beta.

## 6. Data Model Changes

No DDL changes required to Prisma Schema. The logic change is purely in the **Query and Service Layer** (Application Logic).

- `User.defaultRoleId` maps to User Role.
- `UserProject.roleId` maps to Project Role.
- The Application Service must fetch both IDs and query `ApprovalRules` for both simultaneously.

## 7. Non-Functional Requirements

- **Audit Trail:** Every change to Policies must be logged (who changed the rule and when).
- **Performance:** Generation of the approval tree must occur < 200ms.
- **Validation:** Admin interface must prevent creation of steps without defined Resolvers.