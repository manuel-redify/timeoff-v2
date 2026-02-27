# Technical Blueprint: Workflow Engine Correction & Optimization

## 1. Core Logic: Multi-Context Matching (The "UNION" Fix)

The current implementation fails because it treats contexts as mutually exclusive.
**REQUIREMENT:** A request must aggregate GLOBAL context policies and PROJECT context policies simultaneously.

### A. Context Generation Logic

Modify `findMatchingPolicies` so the `contexts` list ALWAYS includes:

1. **Global Context:** `{ id: null, type: null }` (Always present).
2. **Specific Project Context:** If `projectId` is provided, add `{ id: projectId, type: project.type }`.

### B. Trigger Matching Logic (Strict Gatekeeping)

To prevent "loose" policies, matching must follow this truth matrix (Logical AND):

- **RequestType:** Exact ID match or "ANY".
- **ContractType:** Exact ID match or "ANY".
- **Department:** Exact match or "ANY".
- **Context + Role:** * If the policy is **Global**: Match between `subjectRoles` and `user.defaultRole`.
    - If the policy is **Project-Specific**: Match between `subjectRoles` and `UserProject.roleId`.
    - If `subjectRoles` is "ANY": Always passes.

## 2. Resolver & Scopes: Precision Controls

To avoid incorrect or "skipped" approval processes:

### A. Scope Resolution (Intersection AND)

In `applyScopes`, if multiple scopes are present (e.g., `SAME_PROJECT` + `SAME_AREA`), the result must be the **intersection**:

- The approver must be in the project **AND** in the same area. If the intersection is empty, proceed to Fallback; DO NOT auto-approve.

### B. Self-Approval Handling

- **SKIP vs FALLBACK:** If the only resolved approver is the requester:
    - If the policy defines the step as "Auto-Approve": Skip with logging.
    - If it requires human action: Trigger Fallback (Dept Manager -> Admin). Never allow a request to remain without human approvers unless explicitly marked as Auto-Approve.

### C. Sub-Flow Aggregation (Parallel Lanes)

Matched policies must not be merged into a single flow; they must be treated as **parallel lanes**:

- Each policy generates an independent `SubFlow`.
- The master request status is `PENDING` until **ALL** sub-flows are `APPROVED`.
- If **ANY SINGLE** sub-flow is `REJECTED`, the entire request becomes `REJECTED`.

## 3. Database & Performance Optimization

### A. Database Filtering (Prisma)

Do not download all workflows into memory. Filter at the query level:

```
const workflows = await prisma.workflow.findMany({
    where: {
        companyId: user.companyId,
        isActive: true,
        rules: { path: ['requestTypes'], array_contains: [normalizedRequestType] }
    }
});
```

### B. Data Pre-fetching (Anti-Pattern N+1)

**PERFORMANCE REQUIREMENT:** Before processing sub-flows, the AI Agent must pre-load all necessary data (e.g., global roles, project members, department supervisors) in a single query and store it in the `RUNTIME_CACHE`. Do not allow SQL queries inside `.map()` or `.forEach()` loops.

### C. Parallel Execution

Use `Promise.all()` for parallel sub-flow generation and watcher resolution to minimize total response time.

### D. Snapshotting (Immutability)

**CRITICAL:** When a request is created, save a snapshot of the generated `SubFlows` in the `approval_steps` table. Never recalculate resolvers based on the original policy after the request has been submitted.

## 4. Refactoring Task List for AI Agent

1. **Refactor `findMatchingPolicies`**: Implement role explosion based on the `[Context ID] + [Role ID]` combination.
2. **Intelligent Deduplication**: Unify identical approvers in the same temporal step to avoid duplicate notifications.
3. **Fallback Hierarchy**: Implement strict logic: `Policy Resolver` -> `Dept Manager` -> `Company Admin` -> `Block (Error)`.
4. **Batch Watchers**: Aggregate all watchers from all matched policies and send notifications in a single post-transaction batch.

## 5. Constraint Safety Checklist

- [ ]  A user without a `UserProject` does not trigger project policies.
- [ ]  A "Global" policy ignores project roles.
- [ ]  If a `resolverId` (Role) has no assigned users, trigger immediate Fallback.
- [ ]  **Audit Trail**: Save the original policy ID and Name for every generated step.