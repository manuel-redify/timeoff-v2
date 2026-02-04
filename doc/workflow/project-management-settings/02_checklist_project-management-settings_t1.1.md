# Checklist - Task 1.1: New `Client` model implementation
**Parent:** `doc/workflow/project-management-settings/02_detailed_m1_project-management-settings_v1.md`

### Steps
- [ ] Step 1: Add `Client` model to `prisma/schema.prisma` with standard fields (`id`, `name`, `companyId`, `createdAt`, `updatedAt`).
- [ ] Step 2: Add unique constraint `@@unique([companyId, name])` and map to `clients` table.
- [ ] Step 3: Add `projects Project[]` relation to `Client`.
- [ ] Step 4: Add `client Client? @relation(fields: [clientId], references: [id])` to `Project` model (Task 1.2 prep).
- [ ] Step 5: Add `clientId String? @map("client_id")` and index to `Project` model.
- [ ] Step 6: Add `clients Client[]` to `Company` model for cascading deletes.

### Done When
- [ ] Prisma schema is valid (`npx prisma validate`).
- [ ] `Client` model is correctly linked to `Company` and referenced by `Project`.
