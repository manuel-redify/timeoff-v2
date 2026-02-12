# Checklist - Task 1.5: Unit Test Harness
**Parent:** [02_detailed_m1_workflow-engine.md](file:///c:/Code/timeoff-v2/doc/workflow/workflow-engine/02_detailed_m1_workflow-engine.md)

### Steps
- [x] Step 1: Analyze existing test configuration (vitest/jest) and Prisma mocking strategy.
- [x] Step 2: Create `tests/workflow-engine.test.ts` baseline file.
- [x] Step 3: Implement unit tests for `findMatchingPolicies` using various trigger combinations (Request Type, Role, Project).
- [x] Step 4: Implement unit tests for `resolveStep` verifying Role, Dept Mgr, and Line Mgr resolution.
- [x] Step 5: Implement unit tests for `applyScope` verifying Global vs Restricted intersection logic.
- [x] Step 6: Implement unit tests for `Self-Approval` conflicts ensuring requesters are filtered out.
- [x] Step 7: Implement unit tests for the **Safety Net** (Level 1, 2, and 3 fallbacks).
- [x] Step 8: Verify end-to-end resolver flow with complex "Matrix" scenarios from PRD.

### Done When
- [x] `tests/workflow-engine.test.ts` passes all 8 test suites.
- [x] Coverage covers matching, resolution, scoping, and fallback logic.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-12 | 1.0 | Checklist creation |
