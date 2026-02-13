# Checklist - Task 4.3
**Parent:** 02_detailed_m4_workflow-engine.md

### Steps
- [x] Step 1: Implement aggregator utility in `lib/services/workflow-resolver-service.ts` to compute master request state from sub-flow states.
- [x] Step 2: Encode terminal rules: reject on any sub-flow rejection, approve only when all required sub-flows are approved.
- [x] Step 3: Add handling for skipped and auto-approved steps so they do not block final outcome.
- [x] Step 4: Map aggregator outputs to existing leave request status semantics used by API routes.
- [x] Step 5: Add tests for pending, approved, and rejected transitions across multiple sub-flows in `tests/workflow/workflow-engine-runtime.test.ts`.

### Done When
- [x] Master status is derived consistently from sub-flow outcomes.
- [x] Any rejection forces final `REJECTED` state.
- [x] Final `APPROVED` is only emitted when all required sub-flows are complete and approved.
- [x] Skipped/auto-approved steps are treated as non-blocking in aggregation.
- [x] Automated tests validate all core transition paths and edge cases.

## Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-13 | 1.0 | Checklist creation for Task 4.3 (Outcome Aggregator). |
| 2026-02-13 | 1.1 | Completed Task 4.3 aggregator logic, status mapping, and transition tests. |
