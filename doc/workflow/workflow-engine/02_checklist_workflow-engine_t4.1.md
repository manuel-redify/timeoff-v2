# Checklist - Task 4.1
**Parent:** 02_detailed_m4_workflow-engine.md

### Steps
- [ ] Step 1: Define effective requester role collection (default role + active project roles) in `lib/services/workflow-resolver-service.ts`.
- [ ] Step 2: Implement additive UNION matching for `ApprovalRule` and `WatcherRule` with explicit "Any" handling.
- [ ] Step 3: Add deterministic policy grouping key logic to prevent duplicate policy generation.
- [ ] Step 4: Add filtering for inactive/deleted entities before returning matched policies.
- [ ] Step 5: Add tests for role-union and "Any" matching scenarios in `tests/workflow/workflow-engine-runtime.test.ts`.

### Done When
- [ ] Matching includes requester default role and relevant project roles in the same run.
- [ ] "Any" role/constraint behavior is correctly applied without excluding specific matches.
- [ ] No duplicate logical policies are produced from overlapping rule matches.
- [ ] Inactive/deleted users/rules are excluded from runtime matching results.
- [ ] Automated tests cover successful and edge-case matching behavior.

## Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-13 | 1.0 | Checklist creation for Task 4.1 (Policy Matching logic). |
