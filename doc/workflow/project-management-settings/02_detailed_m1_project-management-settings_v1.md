# Detailed Phase - Milestone 1
**Parent:** `doc/workflow/project-management-settings/02_task_plan_ project-management-settings_v1.md`
**Files Involved:** `prisma/schema.prisma`

### Task 1.1: New `Client` model implementation
1. [ ] Define `Client` model in `prisma/schema.prisma` with `id`, `name`, `companyId`.
2. [ ] Add unique constraint on `[companyId, name]`.
3. [ ] Establish `@relation` from `Client` to `Company`.
4. [ ] Link `Client` to `Project` model.
*Effort: S | Status: [ ]*

### Task 1.2: Upgrade `Project` model
1. [ ] Add `isBillable` (Boolean, default true).
2. [ ] Add `color` (String, optional).
3. [ ] Add `clientId` (String, optional) with relation to `Client`.
4. [ ] Check existing legacy fields (`type`, `archived`) and ensure compatibility.
*Effort: S | Status: [ ]*

### Task 1.3: Upgrade `UserProject` model
1. [ ] Add `allocation` (Decimal 5,2, default 100).
2. [ ] Add `startDate` (DateTime, default now).
3. [ ] Add `endDate` (DateTime, optional).
*Effort: S | Status: [ ]*

### Task 1.4: Prisma migration and client regeneration
1. [ ] Run `npx prisma migrate dev` to generate SQL and update DB.
2. [ ] Verify `lib/generated/prisma` is updated.
*Effort: M | Status: [ ]*
