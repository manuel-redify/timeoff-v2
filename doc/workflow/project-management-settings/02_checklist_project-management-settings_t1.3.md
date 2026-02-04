# Checklist - Task 1.3: Upgrade `UserProject` model
**Parent:** `doc/workflow/project-management-settings/02_detailed_m1_project-management-settings_v1.md`

### Steps
- [ ] Step 1: Add `allocation Decimal @default(100) @db.Decimal(5, 2)` to `UserProject` model.
- [ ] Step 2: Add `startDate DateTime @default(now()) @map("start_date")` to `UserProject` model.
- [ ] Step 3: Add `endDate DateTime? @map("end_date")` to `UserProject` model.
- [ ] Step 4: Verify the unique constraint `@@unique([userId, projectId, roleId])` remains valid.

### Done When
- [ ] Prisma schema is valid (`npx prisma validate`).
- [ ] `UserProject` model contains allocation and date fields with correct defaults and mappings.

## 🔄 Next Steps (Agent Instructions)
1. Complete all steps above autonomously.
2. Update this file live after each step.
3. Upon completion:
   - Update Parent Detailed Phase (Tier 2) and Master Plan (Tier 1) to `[x]`.
   - Commit changes via Git.
   - Archive this checklist.
   - Ask user: "Task [X.Y] complete. Proceed to [Next Task]?"