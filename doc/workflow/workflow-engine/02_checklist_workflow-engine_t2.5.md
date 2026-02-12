# Checklist - Task 2.5: Form State & Validation
**Parent:** [02_detailed_m2_workflow-engine.md](file:///c:/Code/timeoff-v2/doc/workflow/workflow-engine/02_detailed_m2_workflow-engine.md)

### Steps
- [ ] Step 1: Create `lib/validations/workflow.ts` and define `workflowSchema` with Zod.
- [ ] Step 2: Implement validation rules:
    - [ ] Policy Name: min 1 character.
    - [ ] Triggers: Ensure at least one condition is set (or "Any" is selected).
- [ ] Step 3: Integrate `react-hook-form` with `zodResolver` in the builder page component.
- [ ] Step 4: Map Builder inputs (Header + TriggersBlock) to the form state.
- [ ] Step 5: Implement `useBeforeUnload` / "Dirty state" logic to trigger an `AlertDialog` if the user leaves with unsaved changes.
- [ ] Step 6: Verify that `FormMessage` displays validation errors correctly under invalid fields.

### Done When
- [ ] Empty Policy Name triggers a validation error.
- [ ] Submitting the form with valid data correctly captures the state.
- [ ] Navigating away with unsaved changes prompts a confirmation dialog (per PRD §8.2).
- [ ] "Save Policy" button shows loading state during submission.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-12 | 1.0 | Checklist creation |
