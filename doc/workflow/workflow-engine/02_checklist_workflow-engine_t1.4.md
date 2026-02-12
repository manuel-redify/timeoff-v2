# Checklist - Task 1.4: Self-Approval & Safety Logic
**Parent:** [02_detailed_m1_workflow-engine.md](file:///c:/Code/timeoff-v2/doc/workflow/workflow-engine/02_detailed_m1_workflow-engine.md)

### Steps
- [ ] Step 1: Implement `isSelfApproval(approverId, requesterId)` helper in `WorkflowResolverService`.
- [ ] Step 2: Implement logic to mark steps as `SKIPPED` in the flow generation if all resolvers are the requester.
- [ ] Step 3: Implement Level 1 Fallback: Policy-specific fallback (if defined in future schema).
- [ ] Step 4: Implement Level 2 Fallback: Logic to fetch `Department Manager` (bossId) or `Supervisors` of the requester's department.
- [ ] Step 5: Implement Level 3 Fallback: Logic to fetch `Company Admins` as the final safety net.
- [ ] Step 6: Ensure fallback logic handles cases where the fallback resolver is ALSO the requester (recursively find next admin).
- [ ] Step 7: Integrate safety checks into the main `WorkflowResolverService` resolution loop.

### Done When
- [ ] Requester can never be an approver for their own request (manual/unit test verification).
- [ ] Engine always returns at least one valid approver (or Admin) even if roles are misconfigured.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-12 | 1.0 | Checklist creation |
