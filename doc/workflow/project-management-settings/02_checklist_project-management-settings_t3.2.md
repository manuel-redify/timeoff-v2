# Checklist - Task 3.2: Allocation Logic & Visual Feedback
**Parent:** `doc/workflow/project-management-settings/02_detailed_m3_project-management-settings_v1.md`

### Steps
- [ ] Step 1: Implement a subscription or `watch` mechanism to calculate the sum of all row allocations.
- [ ] Step 2: Add a "Total Allocation" summary display in the card footer.
- [ ] Step 3: Implement conditional styling: text turns red and `AlertTriangle` appears when sum > 100.
- [ ] Step 4: Add form validation rule: `allocation` must be between 0 and 100.
- [ ] Step 5: Implement cross-field validation for the period: `endDate` must be `>= startDate` or null.
- [ ] Step 6: Provide immediate inline error messages for invalid date ranges.

### Done When
- [ ] Total allocation is accurately summed across all rows.
- [ ] Visual warning triggers correctly at > 100%.
- [ ] Saving is prevented if any row has an invalid date range.

## 🔄 Next Steps (Agent Instructions)
1. Complete all steps above autonomously.
2. Update this file live after each step.
3. Upon completion:
   - Update Parent Detailed Phase (Tier 2) and Master Plan (Tier 1) to `[x]`.
   - Commit changes via Git.
   - Archive this checklist.
   - Ask user: "Task 3.2 complete. Proceed to Task 3.3?"
