# Checklist - Task 2.2: Create/Edit Project Modal
**Parent:** `doc/workflow/project-management-settings/02_detailed_m2_project-management-settings_v1.md`

### Steps
- [ ] Step 1: Define `ProjectFormValues` type and `projectSchema` using `zod`.
- [ ] Step 2: Create `components/settings/projects/project-dialog.tsx`.
- [ ] Step 3: Implement the base `Dialog` structure with trigger and content.
- [ ] Step 4: Implement the `Form` with fields: `name`, `clientId`, `isBillable`, `description`.
- [ ] Step 5: Implement the Color Picker component (12 presets + optional hex).
- [ ] Step 6: Implement searchable `ClientSelect` using `Popover` + `Command`.
- [ ] Step 7: Add the "Add '[Name]'" shortcut to create a client on the fly.
- [ ] Step 8: Connect form submission to the (mocked/placeholder) service layer.

### Done When
- [ ] Dialog opens correctly with all form fields.
- [ ] Form validation prevents submission with empty name.
- [ ] Client selection allows searching and shows the "Add New" option.

## 🔄 Next Steps (Agent Instructions)
1. Complete all steps above autonomously.
2. Update this file live after each step.
3. Upon completion:
   - Update Parent Detailed Phase (Tier 2) and Master Plan (Tier 1) to `[x]`.
   - Commit changes via Git.
   - Archive this checklist.
   - Ask user: "Task 2.2 complete. Proceed to Task 2.3?"
