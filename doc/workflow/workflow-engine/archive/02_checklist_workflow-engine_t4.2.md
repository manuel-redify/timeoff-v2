# Checklist - Task 4.2
**Parent:** 02_detailed_m4_workflow-engine.md

### Steps
- [x] Step 1: Extend runtime workflow types in `lib/types/workflow.ts` for sub-flow identity, origin context, and step state.
- [x] Step 2: Implement sub-flow builder in `lib/services/workflow-resolver-service.ts` to instantiate one flow per matched policy-role context.
- [x] Step 3: Add support for mixed sequential and parallel steps with deterministic ordering on equal sequence values.
- [x] Step 4: Apply self-approval skip and fallback injection during sub-flow construction.
- [x] Step 5: Add fixtures/tests for multi-policy and multi-project-role sub-flow generation in `tests/workflow/workflow-engine-runtime.test.ts`.

### Done When
- [x] Runtime types can represent sub-flows and per-step execution state without ambiguity.
- [x] Engine generates independent sub-flows for each relevant policy-role context.
- [x] Sequential/parallel combinations execute in deterministic order.
- [x] Self-approval paths are skipped safely and fallback approvers are injected when required.
- [x] Automated tests validate normal and edge-case sub-flow generation behavior.

## Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-13 | 1.0 | Checklist creation for Task 4.2 (Sub-Flow generation). |
| 2026-02-13 | 1.1 | Completed Task 4.2 sub-flow runtime implementation and targeted tests. |
