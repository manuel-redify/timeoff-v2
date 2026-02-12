# Detailed Phase - Milestone 1: Backend Foundation
**Parent:** [02_task_plan_workflow-engine.md](file:///c:/Code/timeoff-v2/doc/workflow/workflow-engine/02_task_plan_workflow-engine.md)
**Files Involved:** 
- `lib/services/workflow-resolver-service.ts` [NEW]
- `types/workflow.ts` [NEW]
- `lib/approval-routing-service.ts` [MODIFY]

### Task 1.1: Define internal types for Workflow Policies ✅
1. [x] Create `types/workflow.ts` to define interfaces for `WorkflowPolicy`, `WorkflowStep`, and `ResolverType`.
2. [x] Map existing `ApprovalRule` and `WatcherRule` fields to the new logical structures.
*Effort: S*

### Task 1.2: Research and Mapping ✅
1. [x] Analyze `ApprovalRoutingService.getApproversAdvancedMode` logic deeper.
2. [x] Document the mapping between current `ApprovalRule` records and the "Policy" abstraction (grouping by trigger fields).
*Effort: S*

### Task 1.3: WorkflowResolverService Implementation
1. [ ] Implement `findMatchingPolicies(user, projectId, requestType)`: Collects UNION of rules.
2. [ ] Implement `resolveStep(step, context)`: Handles Line Manager, Dept Manager, Role, User logic.
3. [ ] Implement `applyScope(resolvers, scope, requester)`: Filters by Global/Area/Project/Dept.
*Effort: M*

### Task 1.4: Self-Approval & Safety Logic
1. [ ] Add `isSelfApproval(approver, requester)` check to exclude the requester.
2. [ ] Implement `getFallbackApprover(companyId, departmentId)` logic (Dept Mgr -> Admin).
*Effort: S*

### Task 1.5: Unit Test Harness
1. [ ] Setup `tests/workflow-engine.test.ts` with mocks for Prisma.
2. [ ] Verify matching logic with multiple overlapping policies.
*Effort: S*

## 🔄 Next Steps
- Complete Task 1.1 (Types) and Task 1.2 (Mapping).
- Update the Master Plan as each task is completed.
- Archive this document when Milestone 1 is finished.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-12 | 1.0 | Initial Milestone 1 breakdown |
