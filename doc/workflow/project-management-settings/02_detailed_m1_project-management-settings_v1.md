# Detailed Phase - Milestone 1
**Parent:** `doc/workflow/project-management-settings/02_task_plan_ project-management-settings_v1.md`
**Files Involved:** `prisma/schema.prisma`

### Task 1.1: New `Client` model implementation
1. [X] Define `Client` model in `prisma/schema.prisma` with `id`, `name`, `companyId`.
2. [X] Add unique constraint on `[companyId, name]`.
3. [X] Establish `@relation` from `Client` to `Company`.
4. [X] Link `Client` to `Project` model.
*Effort: S | Status: [X]*

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

## 🔄 Next Steps
- Complete all tasks in this file.
- Update the Master Plan (Tier 1) for each completed task.
- When the Milestone is 100% complete, ask for the next Milestone.