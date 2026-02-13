# Checklist - Task 4.3
**Parent:** 02_detailed_m4_workflow-engine.md

### Steps
- [ ] Step 1: Implement aggregator utility in `lib/services/workflow-resolver-service.ts` to compute master request state from sub-flow states.
- [ ] Step 2: Encode terminal rules: reject on any sub-flow rejection, approve only when all required sub-flows are approved.
- [ ] Step 3: Add handling for skipped and auto-approved steps so they do not block final outcome.
- [ ] Step 4: Map aggregator outputs to existing leave request status semantics used by API routes.
- [ ] Step 5: Add tests for pending, approved, and rejected transitions across multiple sub-flows in `tests/workflow/workflow-engine-runtime.test.ts`.

### Done When
- [ ] Master status is derived consistently from sub-flow outcomes.
- [ ] Any rejection forces final `REJECTED` state.
- [ ] Final `APPROVED` is only emitted when all required sub-flows are complete and approved.
- [ ] Skipped/auto-approved steps are treated as non-blocking in aggregation.
- [ ] Automated tests validate all core transition paths and edge cases.

## Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-13 | 1.0 | Checklist creation for Task 4.3 (Outcome Aggregator). |
