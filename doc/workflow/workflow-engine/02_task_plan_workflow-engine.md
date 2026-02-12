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
- [ ] 3.1: Build vertical timeline canvas (subtle vertical line + Step Cards).
- [x] 3.2: Implement Approval Step Card with Resolver/Scope selection and "Auto-Approve" switch.
- [ ] 3.3: Implement Parallel Step Container (dashed border, horizontal layout).
- [ ] 3.4: Add reordering and deletion logic for steps.
- [ ] 3.5: Build Watchers Block (notifications-only logic).

### Milestone 4: Execution Engine (The "Matrix" Runtime)
- [ ] 4.1: Implement Policy Matching logic (User Role + Project Roles + "Any").
- [ ] 4.2: Develop Sub-Flow generation logic (instantiate parallel trees per context).
- [ ] 4.3: Build Outcome Aggregator (Approved if ALL Sub-Flows Approved, Rejected if ANY Rejects).
- [ ] 4.4: Integrate Engine into the `LeaveRequest` creation/update lifecycle.
- [ ] 4.5: Implement Audit logging for Engine decisions and Admin Overrides.

### Milestone 5: Overview, Validation & Polish
- [ ] 5.1: Create Policies Overview Page (DataTable + Skeleton states).
- [ ] 5.2: Implement "Duplicate" and "Delete" policy actions with confirmation dialogs.
- [ ] 5.3: Ensure mobile responsiveness (stacked layout for desktop tables/parallel steps).
- [ ] 5.4: Implement "Unsaved Changes" and "Dirty State" alerts.
- [ ] 5.5: Final end-to-end testing of complex Multi-Role scenarios.

## 🔄 Next Steps
- Start Milestone 1 by creating the Detailed Phase file: `02_detailed_m1_workflow-engine.md`.
- Focus on `WorkflowResolverService` and internal type alignment.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-12 | 1.0 | Initial Strategic Plan (5 Milestones, 25 Tasks) |
