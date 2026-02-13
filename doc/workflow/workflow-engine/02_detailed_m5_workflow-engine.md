# Detailed Phase - Milestone 5: Overview, Validation & Polish
**Parent:** `doc/workflow/workflow-engine/02_task_plan_workflow-engine.md`
**Files Involved:** `app/(dashboard)/settings/workflows/page.tsx`, `app/actions/workflow/get-workflows.ts`, `app/actions/workflow/save-workflow.ts`, `app/actions/workflow/delete-workflow.ts` [NEW], `app/actions/workflow/duplicate-workflow.ts` [NEW], `app/(dashboard)/settings/workflows/[id]/page.tsx`, `components/workflows/workflow-builder-header.tsx`, `components/workflows/workflow-steps.tsx`, `components/workflows/parallel-step-container.tsx`, `hooks/use-dirty-state.ts`, `tests/workflow/workflow-policy-management.test.ts` [NEW], `tests/workflow/workflow-engine-runtime.test.ts`

### Task 5.1: Create Policies Overview Page (DataTable + Skeleton states)
**Effort:** Medium
1. [x] Refactor `app/(dashboard)/settings/workflows/page.tsx` list rendering into a consistent DataTable-style layout (header, row actions, empty state, loading state).
2. [x] Align loading skeleton columns and widths with final table columns to avoid layout shift.
3. [x] Ensure status badges, step counts, and updated timestamps are deterministic and locale-safe.
4. [x] Remove debug-only quick navigation links from production UI.
5. [x] Validate that list refreshes correctly after create/edit actions via revalidation.

### Task 5.2: Implement "Duplicate" and "Delete" policy actions with confirmation dialogs
**Effort:** Large
1. [x] Add `duplicateWorkflow(workflowId)` server action in `app/actions/workflow/duplicate-workflow.ts` with company-scoped authorization and safe payload cloning.
2. [x] Add `deleteWorkflow(workflowId)` server action in `app/actions/workflow/delete-workflow.ts` with company-scoped authorization and idempotent behavior.
3. [x] Add row action UI in `app/(dashboard)/settings/workflows/page.tsx` for Duplicate/Delete with confirm dialogs and optimistic disabled states.
4. [x] Revalidate `/settings/workflows` and target policy routes after duplicate/delete to avoid stale lists.
5. [x] Add tests for authorization, payload integrity, and failure handling in `tests/workflow/workflow-policy-management.test.ts`.

### Task 5.3: Ensure mobile responsiveness (stacked layout for desktop tables/parallel steps)
**Effort:** Medium
1. [x] Convert workflows list rows in `app/(dashboard)/settings/workflows/page.tsx` to mobile-safe stacked cards below `sm` breakpoints.
2. [x] Verify `components/workflows/workflow-steps.tsx` and `components/workflows/parallel-step-container.tsx` preserve readability and action affordance on narrow viewports.
3. [x] Ensure header controls in `components/workflows/workflow-builder-header.tsx` do not overflow on small screens.
4. [x] Validate touch targets for step actions and dialog actions meet minimum accessible size.
5. [x] Add viewport-focused regression checks for mobile/desktop behavior in `tests/workflow/workflow-policy-management.test.ts`.

### Task 5.4: Implement "Unsaved Changes" and "Dirty State" alerts
**Effort:** Medium
1. [x] Load existing workflow payload for edit mode in `app/(dashboard)/settings/workflows/[id]/page.tsx` and initialize form defaults from persisted data.
2. [x] Ensure `hooks/use-dirty-state.ts` covers browser unload and in-app route navigation without false positives after successful save.
3. [x] Ensure successful save resets dirty state using server-returned canonical values (not stale local form snapshots).
4. [x] Block destructive navigation paths (Back/Cancel/direct route changes) behind the same unsaved-changes confirmation flow.
5. [ ] Add tests for clean/dirty transitions and post-save navigation behavior in `tests/workflow/workflow-policy-management.test.ts`.

### Task 5.5: Final end-to-end testing of complex Multi-Role scenarios
**Effort:** Large
1. [x] Extend runtime fixtures in `tests/workflow/workflow-engine-runtime.test.ts` for multi-role + multi-project requests with mixed sequential/parallel branches.
2. [x] Validate aggregate outcomes for approve/reject/auto-approve combinations across all matched sub-flows.
3. [x] Validate fallback behavior when primary approvers are self, inactive, or missing under mixed scope constraints.
4. [x] Validate watcher notifications and audit records are emitted exactly once per final workflow state transition.
5. [x] Record final milestone acceptance criteria and unresolved edge cases in the change log before marking milestone complete.

## Next Steps
- Task Checklist files for 5.1 through 5.5 are ready (`02_checklist_workflow-engine_t5.X.md`).
- Execute Task 5.4 using `doc/workflow/workflow-engine/02_checklist_workflow-engine_t5.4.md` and update this file and `doc/workflow/workflow-engine/02_task_plan_workflow-engine.md` in real time.
- Mark completed tasks with `[x]` and record structural re-planning in the change log.

## Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-13 | 1.0 | Initial Milestone 5 detailed breakdown created from master plan and current workflow implementation status. |
| 2026-02-13 | 1.1 | Created Tier-3 checklist files for Tasks 5.1 to 5.5 and updated execution entry point to Task 5.1 checklist. |
| 2026-02-13 | 1.2 | Completed Task 5.1 with DataTable overview refactor, skeleton parity, deterministic UTC timestamp rendering, and removal of debug quick links. |
| 2026-02-13 | 1.3 | Completed Task 5.2 with duplicate/delete server actions, confirmation dialogs in overview rows, route revalidation, and policy management tests. |
| 2026-02-13 | 1.4 | Completed Task 5.3 with mobile stacked workflows layout, responsive step/header hardening, touch-target adjustments, and viewport regression checks. |
| 2026-02-13 | 1.5 | Implemented Task 5.4 logic: getWorkflow action, edit mode form initialization, and unsaved changes dialog protection. |
| 2026-02-13 | 1.6 | Completed Task 5.5: Final multi-role runtime validation. Engine proven to handle UNION roles, mixed auto-approval/manual paths, and atomic audit/notification emission. Milestone 5 closure confirmed. |
