# Detailed Phase - Milestone 2: Policy Builder UI - Core & Triggers
**Parent:** [02_task_plan_workflow-engine.md](file:///c:/Code/timeoff-v2/doc/workflow/workflow-engine/02_task_plan_workflow-engine.md)
**Files Involved:** 
- `app/(dashboard)/settings/workflows/page.tsx` [NEW]
- `app/(dashboard)/settings/workflows/[id]/page.tsx` [NEW]
- `components/workflows/workflow-builder-header.tsx` [NEW]
- `components/workflows/triggers-block.tsx` [NEW]
- `components/ui/multi-select.tsx` [NEW]
- `lib/validations/workflow.ts` [NEW]

### Task 2.1: Routing & Basic Layout
1. [x] Create `/settings/workflows` index page with `DataTable` skeleton (preparing for M5).
2. [x] Create `/settings/workflows/[id]` dynamic route for the Builder.
3. [x] Implement a central layout container for the builder (max-width, padding).
*Effort: S*

### Task 2.2: Sticky Header & Policy Title
1. [x] Build `WorkflowBuilderHeader` with `sticky top-0`.
2. [x] Implement the prominent, borderless Title input (H1 style).
3. [x] Add Status toggle (Active/Inactive) and Save/Cancel buttons.
4. [x] Integrate `Loader2` for saving state.
*Effort: S*

### Task 2.3: Reusable MultiSelect
1. [X] Implement `MultiSelect` using shadcn `Popover` and `Command`.
2. [X] Implement "Any" logic: Selecting "Any" clears other options and disables them.
3. [X] Ensure keyboard navigation and accessibility.
*Effort: M*

### Task 2.4: Trigger Condition Block
1. [X] Create `TriggersBlock` using a shadcn `Card`.
2. [X] Implement 2-column grid for fields: Request Type, Contract, Role, Department, Project Type.
3. [X] Fetch data from Prisma (via Server Actions or API) for the selection lists.
*Effort: M*

### Task 2.5: Form State & Validation
1. [X] Define `workflowSchema` in `lib/validations/workflow.ts` using Zod.
2. [X] Connect the builder to `react-hook-form` with `zodResolver`.
3. [X] Implement "Dirty state" detection to warn on unsaved changes.
*Effort: S*

## 🔄 Next Steps
- Complete Task 2.1: Setup routes.
- Proceed to Task 2.2: Implement Header.
- Update Master Plan upon milestone completion.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-12 | 1.0 | Initial Milestone 2 breakdown |
