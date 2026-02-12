# Checklist - Task 2.4: Trigger Condition Block
**Parent:** [02_detailed_m2_workflow-engine.md](file:///c:/Code/timeoff-v2/doc/workflow/workflow-engine/02_detailed_m2_workflow-engine.md)

### Steps
- [x] Step 1: Create `components/workflows/triggers-block.tsx`.
- [x] Step 2: Implement shadcn `Card` structure with Title and Description.
- [x] Step 3: Setup 2-column grid layout for desktop (`grid-cols-2`).
- [x] Step 4: Implement Trigger Fields using `FormField` and the custom `MultiSelect`:
    - [x] Request Type
    - [x] Contract Type (standard `Select` with Prisma data + "Any")
    - [x] Subject Role
    - [x] Department
    - [x] Project Type
- [x] Step 5: Implement data fetching logic to populate selection lists from Prisma.
- [x] Step 6: Verify layout responsiveness (stacks on mobile).

### Done When
- [x] Triggers block displays all 5 required fields.
- [x] Selection lists are populated with real data from the database.
- [x] Custom `MultiSelect` components function correctly within the block.
- [x] Layout matches PRD §8.3 (2-column grid on desktop).

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-12 | 1.0 | Checklist creation |
