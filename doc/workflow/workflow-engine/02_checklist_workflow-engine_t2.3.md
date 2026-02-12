# Checklist - Task 2.3: Reusable MultiSelect
**Parent:** [02_detailed_m2_workflow-engine.md](file:///c:/Code/timeoff-v2/doc/workflow/workflow-engine/02_detailed_m2_workflow-engine.md)

### Steps
- [ ] Step 1: Create `components/ui/multi-select.tsx` skeleton.
- [ ] Step 2: Implement Popover/Command structure for list searching and selection.
- [ ] Step 3: Implement Badge rendering for selected items within the trigger button.
- [ ] Step 4: Add "Any" option logic:
    - [ ] Selecting "Any" removes all other selections.
    - [ ] Selecting "Any" disables other options.
    - [ ] Selecting a specific option removes "Any".
- [ ] Step 5: Ensure the component integrates with `react-hook-form`'s `Controller`.
- [ ] Step 6: Test multi-selection behavior and "Any" auto-clearing logic.

### Done When
- [ ] MultiSelect renders a list of searchable items.
- [ ] Tags (Badges) appear/disappear based on selection.
- [ ] "Any" logic correctly toggles selection states as per PRD §8.3.
- [ ] Component is keyboard accessible (Esc to close, Arrow keys for navigation).

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-12 | 1.0 | Checklist creation |
