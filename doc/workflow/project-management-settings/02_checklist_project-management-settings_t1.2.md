# Checklist - Task 1.2: Upgrade `Project` model
**Parent:** `doc/workflow/project-management-settings/02_detailed_m1_project-management-settings_v1.md`

### Steps
- [X] Step 1: Add `isBillable Boolean @default(true) @map("is_billable")` to `Project` model.
- [X] Step 2: Add `color String?` to `Project` model.
- [X] Step 3: Add `clientId String? @map("client_id")` to `Project` model.
- [X] Step 4: Add `client Client? @relation(fields: [clientId], references: [id])` to `Project` model.
- [X] Step 5: Add `@@index([clientId])` to `Project` model.
- [X] Step 6: Verify no breaking changes with legacy `type` and `archived` fields (migration handled in 1.4).

### Done When
- [X] Prisma schema is valid (`npx prisma validate`).
- [X] `Project` model contains all new fields and correct client relation.

## 🔄 Next Steps (Agent Instructions)
1. Complete all steps above autonomously.
2. Update this file live after each step.
3. Upon completion:
   - Update Parent Detailed Phase (Tier 2) and Master Plan (Tier 1) to `[x]`.
   - Commit changes via Git.
   - Archive this checklist.
   - Ask user: "Task [X.Y] complete. Proceed to [Next Task]?"