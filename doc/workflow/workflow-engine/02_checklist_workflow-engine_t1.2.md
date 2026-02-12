# Checklist - Task 1.2: Research and Mapping
**Parent:** [02_detailed_m1_workflow-engine.md](file:///c:/Code/timeoff-v2/doc/workflow/workflow-engine/02_detailed_m1_workflow-engine.md)

### Steps
- [ ] Step 1: Deep dive into `ApprovalRoutingService.getApproversAdvancedMode` to understand existing rule matching.
- [ ] Step 2: Trace `findApproversForRule` to understand how `Role` and `Project` are currently used for resolver lookup.
- [ ] Step 3: Analyze how `subjectAreaId` and `approverAreaConstraint` are currently handled in the database.
- [ ] Step 4: Map current `ApprovalRule` database fields to the proposed dynamic Policy structure.
- [ ] Step 5: Document any existing limitations in the current implementation that the new engine must address.
- [ ] Step 6: Define the strategy for "grouping" flat `ApprovalRule` records into logical "Policies" in the UI.

### Done When
- [ ] A clear mapping strategy exists for aggregating legacy rules into the new engine.
- [ ] Integration points with `ApprovalRoutingService` are identified.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-12 | 1.0 | Checklist creation |
