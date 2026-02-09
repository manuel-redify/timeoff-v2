# Checklist - Task 2.4
**Parent:** `02_detailed_m2_calendar-page-restyle.md`

### Steps
- [ ] Step 1: Install `@tanstack/react-virtual` or confirm use of standard virtualization strategy.
- [ ] Step 2: Extract the table body rendering logic to support row windowing.
- [ ] Step 3: Implement virtualization for the employee rows (vertical virtualization).
- [ ] Step 4: Ensure the sticky column ("Employee") and sticky headers ("Dates") remain correctly positioned during scroll.
- [ ] Step 5: Test performance with 100+ simulated users to ensure 60fps scrolling.
- [ ] Step 6: Fix any scroll sync issues between the virtualized body and static headers.

### Done When
- [ ] The calendar remains performant and smooth with >50 users.
- [ ] Sticky headers and columns do not flicker or disconnect during virtualization.
- [ ] Vertical scrollbar reflects the total number of users accurately.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-09 | 1.0 | Checklist creation |
