# Logic Update Patch: Global & Project Context Union

**Objective:** Correct the Workflow Resolver to ensure Global Policies are NOT ignored when a Project ID is present, and ensure strict "Intersection" logic for Scopes.

## 1. Context Resolution Fix (findMatchingPolicies)

The AI Agent must ensure that the `contexts` array ALWAYS contains two distinct entries when a `projectId` is provided:

- **Entry 1 (Global):** `id: null`, `type: null`, `roles: [user.defaultRole]`.
- **Entry 2 (Project):** `id: projectId`, `type: project.type`, `roles: [projectSpecificRole]`.

**CRITICAL:** Remove any `if/else` or `continue` logic that treats Global and Project policies as mutually exclusive. Both must be evaluated and their resulting policies added to the same `rawPolicies` array.

## 2. Strict Matching Matrix

Apply the following strict filters during the loop:

- **Project Type Filter:** If a policy has `projectTypes` defined (not ANY), it MUST ONLY match the Project Context. If the context is Global, skip this policy.
- **Role Filter:** Match the `subjectRoles` of the policy ONLY against the roles present in the *current* context iteration.

## 3. Scope Intersection (applyScopes)

When multiple scopes are defined (e.g., `SAME_AREA` + `SAME_PROJECT`):

- The logic must perform a **STRICT INTERSECTION**.
- **Step 1:** Get all users with the required Role.
- **Step 2:** Filter that list to keep only those in the same Area.
- **Step 3:** Filter the *resulting* list to keep only those in the same Project.
- If the list becomes empty at any stage, trigger the **Fallback Hierarchy**, do not skip the step.

## 4. Performance & N+1 Prevention

- **Pre-fetch Rule:** All `prisma.user.findMany` or `prisma.userProject.findMany` calls must happen OUTSIDE of any `.filter` or `.map` loops.
- Use a single query to fetch all potential approver data at the start of the resolution.

## 5. Implementation Instructions for AI Agent

1. Read the current `workflow-resolver-service.ts`.
2. Apply the "Context Resolution Fix" to the `findMatchingPolicies` method.
3. Ensure `applyScopes` uses an iterative filter approach to guarantee Intersection (AND) logic.
4. Verify that `generateSubFlows` uses `Promise.all` for all policy resolutions.