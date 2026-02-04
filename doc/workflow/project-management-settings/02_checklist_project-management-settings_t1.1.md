# Checklist - Task 1.1: New `Client` model implementation
**Parent:** `doc/workflow/project-management-settings/02_detailed_m1_project-management-settings_v1.md`

### Steps
- [x] Step 1: Add `Client` model to `prisma/schema.prisma` with standard fields (`id`, `name`, `companyId`, `createdAt`, `updatedAt`).
- [x] Step 2: Add unique constraint `@@unique([companyId, name])` and map to `clients` table.
- [x] Step 3: Add `projects Project[]` relation to `Client`.
- [x] Step 4: Add `client Client? @relation(fields: [clientId], references: [id])` to `Project` model (Task 1.2 prep).
- [x] Step 5: Add `clientId String? @map("client_id")` and index to `Project` model.
- [x] Step 6: Add `clients Client[]` to `Company` model for cascading deletes.

### Done When
- [x] Prisma schema is valid (`npx prisma validate`).
- [x] `Client` model is correctly linked to `Company` and referenced by `Project`.

## 🔄 Next Steps (Agent Instructions)
1. Complete all steps above autonomously.
2. Update this file live after each step.
3. Upon completion:
   - Update Parent Detailed Phase (Tier 2) and Master Plan (Tier 1) to `[x]`.
   - Commit changes via Git.
   - Archive this checklist.
   - Ask user: "Task [X.Y] complete. Proceed to [Next Task]?"