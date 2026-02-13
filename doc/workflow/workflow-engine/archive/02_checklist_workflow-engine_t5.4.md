# Checklist - Task 5.4
**Parent:** 02_detailed_m5_workflow-engine.md

### Steps
- [x] Step 1: Load persisted workflow payload for edit mode in `app/(dashboard)/settings/workflows/[id]/page.tsx`.
- [x] Step 2: Initialize form defaults from persisted data so dirty-state baseline is correct.
- [x] Step 3: Ensure `hooks/use-dirty-state.ts` handles browser unload and in-app navigation prompts correctly.
- [x] Step 4: Reset dirty state from canonical saved values after successful save.
- [x] Step 5: Add clean/dirty transition tests in `tests/workflow/workflow-policy-management.test.ts`.

### Done When
- [x] Edit mode opens with actual saved policy values, not placeholder defaults.
- [x] Unsaved changes prompts appear only when there are real unsaved modifications.
- [x] Back/Cancel/route navigation all use the same consistent confirmation behavior.
- [x] Successful save clears dirty state and allows navigation without false prompts.
- [x] Tests validate pre-save and post-save navigation behavior.

## Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-13 | 1.0 | Checklist creation for Task 5.4 (Unsaved changes and dirty-state behavior). |
