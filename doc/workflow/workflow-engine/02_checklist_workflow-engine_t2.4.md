# Checklist - Task 2.4: Trigger Condition Block
**Parent:** [02_detailed_m2_workflow-engine.md](file:///c:/Code/timeoff-v2/doc/workflow/workflow-engine/02_detailed_m2_workflow-engine.md)

### Steps
- [ ] Step 1: Create `components/workflows/triggers-block.tsx`.
- [ ] Step 2: Implement shadcn `Card` structure with Title and Description.
- [ ] Step 3: Setup 2-column grid layout for desktop (`grid-cols-2`).
- [ ] Step 4: Implement Trigger Fields using `FormField` and the custom `MultiSelect`:
    - [ ] Request Type
    - [ ] Contract Type (standard `Select` with Prisma data + "Any")
    - [ ] Subject Role
    - [ ] Department
    - [ ] Project Type
- [ ] Step 5: Implement data fetching logic to populate selection lists from Prisma.
- [ ] Step 6: Verify layout responsiveness (stacks on mobile).

### Done When
- [ ] Triggers block displays all 5 required fields.
- [ ] Selection lists are populated with real data from the database.
- [ ] Custom `MultiSelect` components function correctly within the block.
- [ ] Layout matches PRD §8.3 (2-column grid on desktop).

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-12 | 1.0 | Checklist creation |
