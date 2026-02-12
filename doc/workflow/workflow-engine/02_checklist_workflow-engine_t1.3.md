# Checklist - Task 1.3: WorkflowResolverService Implementation
**Parent:** [02_detailed_m1_workflow-engine.md](file:///c:/Code/timeoff-v2/doc/workflow/workflow-engine/02_detailed_m1_workflow-engine.md)

### Steps
- [x] Step 1: Initialize `WorkflowResolverService` class in `lib/services/workflow-resolver-service.ts`.
- [x] Step 2: Implement `findMatchingPolicies(userId, projectId, requestType)` method to aggregate rules from `ApprovalRule` based on Multi-Role logic (UNION).
- [x] Step 3: Implement `resolveStep(step, context)` method to resolve the resolver type into concrete user IDs.
- [x] Step 4: Implement logic for `Line Manager` and `Department Manager` resolver types using existing department relationships.
- [x] Step 5: Implement `applyScope(potentialApprovers, scopes, requester)` method to intersect multiple scope constraints (Global, Area, Project, Dept).
- [x] Step 6: Define `generateSubFlows(policies)` method to instantiate parallel sequences for each matched policy/role combination.
- [x] Step 7: Integrate `WorkflowResolverService` with the defined types from `types/workflow.ts`.

### Done When
- [x] `WorkflowResolverService` is implemented and exports the required methods.
- [x] Methods correctly handle the "Matrix" of roles and projects as per Case A/B in PRD.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-12 | 1.0 | Checklist creation |
| 2026-02-12 | 1.1 | WorkflowResolverService implementation completed |
