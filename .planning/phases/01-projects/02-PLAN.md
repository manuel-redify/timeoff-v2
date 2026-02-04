---
phase: 01-projects
plan: 02
type: execute
wave: 2
depends_on: ["01"]
files_modified: [src/app/api/projects/route.ts, src/app/api/projects/[id]/route.ts, src/server/services/project.service.ts]
autonomous: true
user_setup: []
must_haves:
  truths:
    - "API endpoints exist for listing and creating projects"
    - "Service layer encapsulates Prisma access to the Project model"
  artifacts:
    - "src/app/api/projects/route.ts"
    - "src/app/api/projects/[id]/route.ts"
    - "src/server/services/project.service.ts"
  key_links:
    - "API endpoints use service layer, which in turn uses Prisma to operate on Project"
---

<objectives>
[What this plan accomplishes]
Purpose: Establish the programmatic surface for CRUD operations on Project via API and service layer.
Output: Functional API handlers and a Prisma-based service interface.
</objectives>

<execution_context>
@.planning/ROADMAP.md
@/gsd-discuss-phase
</execution_context>

<context>
Codebase context: Next.js 16 app router, Prisma, and existing RBAC/audit integrations in TimeOff.
</context>

<tasks>

  <task type="auto">
    <name>01. Implement API route for /api/projects (GET, POST)</name>
    <files>src/app/api/projects/route.ts</files>
    <action>
      Implement Next.js App Router route with:
      - GET: return all projects via project.service.getProjects()
      - POST: accept { name, description, client?, status? } and create via project.service.createProject
      Validation: require name; reject with 400 otherwise
    </action>
    <verify>
      - curl -s http://localhost:3000/api/projects | jq shows array
      - curl -X POST -H 'Content-Type: application/json' -d '{"name":"Alpha","description":"Test project"}' http://localhost:3000/api/projects returns 201 and project data
    </verify>
    <done>
      API surface able to create/list projects via route.ts
    </done>
  </task>

  <task type="auto">
    <name>02. Implement API route for /api/projects/[id] (GET, PATCH)</name>
    <files>src/app/api/projects/[id]/route.ts</files>
    <action>
      Implement GET to fetch a single project and PATCH to update project data via project.service.updateProject
      Validate incoming IDs, and ensure numeric id is parsed
    </action>
    <verify>
      - GET /api/projects/1 returns 200 with a project or 404 if not found
      - PATCH /api/projects/1 with {name, description} returns 200 and updated project
    </verify>
    <done>
      Single-project API surface integrated with service layer
    </done>
  </task>

</tasks>

<verification>
API structure verified via manual tests; service layer imports Prisma client
</verification>

<success_criteria>
Phase 1, Plan 02 success: API endpoints wired to service layer; basic CRUD surface functional
</success_criteria>

<output>
After completion, create `.planning/phases/01-projects/02-02-PLAN-SUMMARY.md`
</output>
