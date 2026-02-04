# Checklist - Task 2.3: API Endpoints & Service Layer
**Parent:** `doc/workflow/project-management-settings/02_detailed_m2_project-management-settings_v1.md`

### Steps
- [ ] Step 1: Create `lib/services/project-service.ts`.
- [ ] Step 2: Implement `getProjects` service method with filtering by search term and archived status.
- [ ] Step 3: Implement `createProject` service method (including automatic `Client` creation if a new name is provided).
- [ ] Step 4: Implement `updateProject` service method (handling basic fields and status).
- [ ] Step 5: Create `app/api/projects/route.ts` with `GET` and `POST` handlers.
- [ ] Step 6: Create `app/api/projects/[id]/route.ts` with `PATCH` handler.
- [ ] Step 7: Implement Admin-only middleware/check for all project endpoints.
- [ ] Step 8: Test endpoints using a REST client or scripts.

### Done When
- [ ] `GET /api/projects` returns the list of projects correctly.
- [ ] `POST /api/projects` creates a project and optionally a associated client.
- [ ] `PATCH /api/projects/[id]` updates project details correctly.
- [ ] Non-admin users are blocked from these endpoints.

## 🔄 Next Steps (Agent Instructions)
1. Complete all steps above autonomously.
2. Update this file live after each step.
3. Upon completion:
   - Update Parent Detailed Phase (Tier 2) and Master Plan (Tier 1) to `[x]`.
   - Commit changes via Git.
   - Archive this checklist.
   - Ask user: "Task 2.3 complete. Proceed to Task 2.4?"
