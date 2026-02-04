# Checklist - Task 1.4: Prisma migration and client regeneration
**Parent:** `doc/workflow/project-management-settings/02_detailed_m1_project-management-settings_v1.md`

### Steps
- [ ] Step 1: Run `npx prisma migrate dev --name init_projects_light` to create and apply DB migration.
- [ ] Step 2: Verify the generated SQL migration file in `prisma/migrations`.
- [ ] Step 3: Run `npx prisma generate` to ensure the Prisma client in `lib/generated/prisma` is updated.
- [ ] Step 4: Verify that the new models (`Client`) and fields are accessible in the generated client.

### Done When
- [ ] Database schema is updated and migration is successfully recorded.
- [ ] Prisma client is regenerated without errors.

## 🔄 Next Steps (Agent Instructions)
1. Complete all steps above autonomously.
2. Update this file live after each step.
3. Upon completion:
   - Update Parent Detailed Phase (Tier 2) and Master Plan (Tier 1) to `[x]`.
   - Commit changes via Git.
   - Archive this checklist.
   - Ask user: "Task [X.Y] complete. Proceed to [Next Task]?"