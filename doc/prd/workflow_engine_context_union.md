# Logic Update Patch: Global & Project Context Union (v3.1)

**Objective:** Fix the "blind spots" in the Workflow Resolver where Global policies fail to match Project roles, and ensure the Multi-Role UNION logic is correctly executed without dropping steps.

## 1. Context & Role Universe Fix (findMatchingPolicies)

The current implementation treats Roles and Contexts as separate silos. We must unify them so that a policy can match *any* relevant role the user holds in a specific context.

### A. Context Definition

Ensure `contexts` are built as follows:

- **Global Context:** `projectId: null`. Role Universe = `[user.defaultRole]`.
- **Project Context:** `projectId: {id}`. Role Universe = `[user.defaultRole] + [all user.projectRoles for this project]`.

### B. Matching Logic (The "Role Intersection" Rule)

In the inner loop of `findMatchingPolicies`, replace the role universe logic with this:

1. **Role Candidates:** Use the Role Universe defined above based on the current context.
2. **Match Condition:** A policy matches the context if:
    - `projectTypes` matches the current `context.type` (or policy is ANY).
    - **AND** `subjectRoles` is empty/ANY **OR** at least one Role from the **Role Candidates** exists in the policy's `subjectRoles`.

## 2. Sub-Flow Instantiation (Preventing Step Loss)

The engine must generate one sub-flow per **[Policy + Context + Matching Role]** combination.

- If a policy matches because of the "CTO" role (Global) AND the "Tech Lead" role (Project), it should generate **two separate sub-flows** (one for each "reason" it matched).
- **Deduplication:** Only deduplicate at the very end (in `generateSubFlows`) to ensure the user doesn't get two identical notifications for the same step, but the logic remains independent.

## 3. Strict Scope Intersection (applyScopes)

The `applyScopes` method must be strictly sequential and cumulative (AND logic):

- **Input:** A list of potential user IDs.
- **Process:** 1. Filter by `SAME_AREA` (if present in scopes).
2. Take that result and filter by `SAME_DEPARTMENT` (if present).
3. Take that result and filter by `SAME_PROJECT` (if present).
- **Result:** If the final list is empty, **FORCE FALLBACK**. Do not return an empty array or skip.

## 4. Implementation Instructions for AI Agent

1. **Refactor the Matching Loop:** Ensure that when iterating `contexts`, the logic evaluates the policy against the *combined* list of Global + Project roles for the project context.
2. **Fix "isProjectSpecificPolicy":** A policy should not be ignored in Global context just because it has a project type, unless that project type is specifically NOT "Any".
3. **Unified Pre-fetching:** Ensure `user` data includes all `projects`, `roles`, and `department` details in the initial fetch to prevent N+1 queries.
4. **Fallback Trigger:** Explicitly call `getFallbackApprover` if `applyScopes` returns 0 users for a non-auto-approved step.