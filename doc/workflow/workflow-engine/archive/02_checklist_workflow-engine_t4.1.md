# Checklist - Task 4.1
**Parent:** 02_detailed_m4_workflow-engine.md

### Steps
- [x] Step 1: Define effective requester role collection (default role + active project roles) in `lib/services/workflow-resolver-service.ts`.
- [x] Step 2: Implement additive UNION matching for `ApprovalRule` and `WatcherRule` with explicit "Any" handling.
- [x] Step 3: Add deterministic policy grouping key logic to prevent duplicate policy generation.
- [x] Step 4: Add filtering for inactive/deleted entities before returning matched policies.
- [x] Step 5: Add tests for role-union and "Any" matching scenarios in `tests/workflow/workflow-engine-runtime.test.ts`.

### Done When
- [x] Matching includes requester default role and relevant project roles in the same run.
- [x] "Any" role/constraint behavior is correctly applied without excluding specific matches.
- [x] No duplicate logical policies are produced from overlapping rule matches.
- [x] Inactive/deleted users/rules are excluded from runtime matching results.
- [x] Automated tests cover successful and edge-case matching behavior.

## Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-13 | 1.0 | Checklist creation for Task 4.1 (Policy Matching logic). |
| 2026-02-13 | 1.1 | Completed Task 4.1 implementation, test coverage, and parent plan updates. |
