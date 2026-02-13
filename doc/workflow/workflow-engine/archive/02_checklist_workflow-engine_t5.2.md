# Checklist - Task 5.2
**Parent:** 02_detailed_m5_workflow-engine.md

### Steps
- [x] Step 1: Implement `duplicateWorkflow(workflowId)` in `app/actions/workflow/duplicate-workflow.ts` with company-scoped authorization.
- [x] Step 2: Implement `deleteWorkflow(workflowId)` in `app/actions/workflow/delete-workflow.ts` with company-scoped authorization and idempotent deletion semantics.
- [x] Step 3: Add Duplicate/Delete row actions and confirmation dialogs in `app/(dashboard)/settings/workflows/page.tsx`.
- [x] Step 4: Revalidate affected routes after duplicate/delete to keep list/detail views in sync.
- [x] Step 5: Add server-action and UI-path tests in `tests/workflow/workflow-policy-management.test.ts`.

### Done When
- [x] Duplicate action creates a safe cloned policy with new identity and preserved workflow structure.
- [x] Delete action removes the target policy safely and handles repeated requests gracefully.
- [x] Confirmation dialogs prevent accidental destructive actions.
- [x] Overview list and detail routes reflect duplicate/delete operations immediately after completion.
- [x] Automated tests cover auth, success paths, and expected failure behavior.

## Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-13 | 1.0 | Checklist creation for Task 5.2 (Duplicate/Delete actions and confirmations). |
| 2026-02-13 | 1.1 | Completed Task 5.2 with duplicate/delete server actions, confirmation-dialog row actions, route revalidation, and Jest coverage for auth/success/failure paths. |
