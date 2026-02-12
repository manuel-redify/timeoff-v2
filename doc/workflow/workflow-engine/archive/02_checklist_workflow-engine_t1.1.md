# Checklist - Task 1.1: Define internal types for Workflow Policies
**Parent:** [02_detailed_m1_workflow-engine.md](file:///c:/Code/timeoff-v2/doc/workflow/workflow-engine/02_detailed_m1_workflow-engine.md)

### Steps
- [x] Step 1: Research existing Prisma types for `Role`, `Department`, `Project` to ensure compatibility.
- [x] Step 2: Define `ResolverType` union/enum (Specific User, Role, Department Manager, Line Manager).
- [x] Step 3: Define `ContextScope` type (Global, Same Area, Same Project, Same Department).
- [x] Step 4: Define `WorkflowStep` interface (sequence, resolver, scope, action).
- [x] Step 5: Define `WorkflowWatcher` interface (resolver, scope).
- [x] Step 6: Define `WorkflowTrigger` interface (RequestType, Contract, Role, Dept, ProjectType).
- [x] Step 7: Define `WorkflowPolicy` container interface.
- [x] Step 8: Create `types/workflow.ts` and implement all definitions.

### Done When
- [x] `types/workflow.ts` exists and compiles without errors.
- [x] All logical triggers and step attributes from PRD are represented in the types.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-12 | 1.0 | Checklist creation |
| 2026-02-12 | 1.1 | Task completed - workflow types implemented and verified |
