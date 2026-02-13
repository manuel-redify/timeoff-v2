# Master Plan - Admin Workflow Engine
**Status:** In Progress
**Source:** [01_prd_analysis_workflow-engine_v1.md](file:///c:/Code/timeoff-v2/doc/workflow/workflow-engine/01_prd_analysis_workflow-engine_v1.md)

## 🎯 Strategic Overview
Implement a decoupled approval engine that allows dynamic flow definitions based on requester roles/contexts. The system uses additive policy logic (UNION) and supports multi-step sequential/parallel approval paths with mandatory fallback safety.

## 🏁 Milestones

### Milestone 1: Backend Foundation & Resolver Services ✅
- [x] 1.1: Define internal types for Workflow Policies, Steps, and Resolvers.
- [x] 1.2: Research existing `ApprovalRule` service logic to identify integration points.
- [x] 1.3: Create/Enhance `WorkflowResolverService` to handle Role/Dept/Project resolution.
- [x] 1.4: Implement "Self-Approval" conflict detection logic.
- [x] 1.5: Define Fallback Safety Net (3-tier resolution: Policy -> Dept Mgr -> Admin).

### Milestone 2: Policy Builder UI - Core & Triggers
- [X] 2.1: Setup `/settings/workflows` routes and basic page layout.
- [X] 2.2: Implement Policy Name & Status header with sticky behavior.
- [X] 2.3: Build `MultiSelect` component (Popover + Command + Badge) for triggers.
- [X] 2.4: Implement Trigger Condition Block (Request Type, Contract, Subject Role, etc.) with "Any" logic.
- [X] 2.5: Setup form state management using `react-hook-form` and `zod`.

### Milestone 3: Policy Builder UI - Approval Sequence & Watchers
- [X] 3.1: Build vertical timeline canvas (subtle vertical line + Step Cards).
- [X] 3.2: Implement Approval Step Card with Resolver/Scope selection and "Auto-Approve" switch.
- [X] 3.3: Implement Parallel Step Container (dashed border, horizontal layout).
- [X] 3.4: Add reordering and deletion logic for steps.
- [X] 3.5: Build Watchers Block (notifications-only logic).

### Milestone 4: Execution Engine (The "Matrix" Runtime)
- [x] 4.1: Implement Policy Matching logic (User Role + Project Roles + "Any").
- [x] 4.2: Develop Sub-Flow generation logic (instantiate parallel trees per context).
- [x] 4.3: Build Outcome Aggregator (Approved if ALL Sub-Flows Approved, Rejected if ANY Rejects).
- [x] 4.4: Integrate Engine into the `LeaveRequest` creation/update lifecycle.
- [x] 4.5: Implement Audit logging for Engine decisions and Admin Overrides.

### Milestone 5: Overview, Validation & Polish
- [x] 5.1: Create Policies Overview Page (DataTable + Skeleton states).
- [x] 5.2: Implement "Duplicate" and "Delete" policy actions with confirmation dialogs.
- [x] Task 5.3: Ensure mobile responsiveness (stacked layout for desktop tables/parallel steps).
- [x] Task 5.4: Implement "Unsaved Changes" and "Dirty State" alerts.
- [x] Task 5.5: Final end-to-end testing of complex Multi-Role scenarios.

## 🔄 Next Steps
- Start Milestone 5 by executing the Detailed Phase file: `02_detailed_m5_workflow-engine.md`.
- Continue with Task 5.4 (Unsaved changes and dirty-state completion), then proceed through 5.5 with real-time status updates.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-12 | 1.0 | Initial Strategic Plan (5 Milestones, 25 Tasks) |
| 2026-02-13 | 1.1 | Completed Milestone 4 Task 4.1 and linked runtime test coverage for role-union and Any matching. |
| 2026-02-13 | 1.2 | Completed Milestone 4 Task 4.2 with deterministic sub-flow generation and safety behavior tests. |
| 2026-02-13 | 1.3 | Completed Milestone 4 Task 4.3 with master outcome aggregation and leave-status mapping tests. |
| 2026-02-13 | 1.4 | Completed Milestone 4 Task 4.4 integrating runtime progression into request lifecycle and bulk invariants. |
| 2026-02-13 | 1.5 | Completed Milestone 4 Task 4.5 with canonical runtime audit logging and admin override traceability. |
| 2026-02-13 | 1.6 | Added Milestone 5 detailed phase file (`02_detailed_m5_workflow-engine.md`) and updated next steps to start milestone 5. |
| 2026-02-13 | 1.7 | Created Milestone 5 Task Checklists (`02_checklist_workflow-engine_t5.1.md` to `t5.5.md`) and aligned execution flow to start with Task 5.1 checklist. |
| 2026-02-13 | 1.8 | Completed Milestone 5 Task 5.1 with workflows overview DataTable refactor, skeleton parity, deterministic date rendering, and debug link removal. |
| 2026-02-13 | 1.9 | Completed Milestone 5 Task 5.2 with duplicate/delete policy actions, confirmation dialogs, and policy management test coverage. |
| 2026-02-13 | 2.0 | Completed Milestone 5 Task 5.3 with mobile layout hardening across workflows overview, step containers, and builder header plus viewport regression checks. |
