# Checklist - Task 1.2: Upgrade `Project` model
**Parent:** `doc/workflow/project-management-settings/02_detailed_m1_project-management-settings_v1.md`

### Steps
- [ ] Step 1: Add `isBillable Boolean @default(true) @map("is_billable")` to `Project` model.
- [ ] Step 2: Add `color String?` to `Project` model.
- [ ] Step 3: Add `clientId String? @map("client_id")` to `Project` model.
- [ ] Step 4: Add `client Client? @relation(fields: [clientId], references: [id])` to `Project` model.
- [ ] Step 5: Add `@@index([clientId])` to `Project` model.
- [ ] Step 6: Verify no breaking changes with legacy `type` and `archived` fields (migration handled in 1.4).

### Done When
- [ ] Prisma schema is valid (`npx prisma validate`).
- [ ] `Project` model contains all new fields and correct client relation.
