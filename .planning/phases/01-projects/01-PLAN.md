---
phase: 01-projects
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [prisma/schema.prisma]
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Project model exists in Prisma schema (Project with id, name, description)"
    - "Migration file generated for Project model and applied to DB"
  artifacts:
    - "prisma/schema.prisma updated with Project model and enum"
  key_links:
    - "API layer consumes Prisma Project model via service layer"
---

<objectives>
Phase objective: Introduce Phase 1 core Project CRUD and basic management data model that cleanly slots into the existing TimeOff system, adhering to RBAC, audit trails, and brownfield patterns.
Output: Prisma Project model, initial DB migration, basic API surface, and initial UI scaffolding.
</objectives>

<execution_context>
@.planning/ROADMAP.md
@.planning/STACK.md
@/gsd-discuss-phase
</execution_context>

<context>
@.planning/STATE.md
Referenced prior patterns: Prisma usage, RBAC middleware, audit logging, and UI components in /src with shadcn/ui.
</context>

<tasks>

  <task type="auto">
    <name>01. Prisma: Add Project model and enum to schema.prisma</name>
    <files>prisma/schema.prisma</files>
    <action>
      Extend the Prisma schema with:
      - model Project {
          id          Int       @id @default(autoincrement())
          name        String
          description String?
          client      String?
          status      ProjectStatus @default(ACTIVE)
          archived    Boolean   @default(false)
          createdAt   DateTime  @default(now())
          updatedAt   DateTime  @updatedAt
        }
      
      enum ProjectStatus {
        ACTIVE
        ARCHIVED
      }
      
      Then, run:
      - npx prisma generate
      - npx prisma migrate dev --name add-project-model
    </action>
    <verify>
      - prisma migrate status shows applied migration for add-project-model
      - The database exposes a Project table with columns: id, name, description, client, status, archived, createdAt, updatedAt
    </verify>
    <done>
      Project model and DB migration in place and usable by the service layer
    </done>
  </task>

  <task type="auto">
    <name>02. Prepare initial API surface and service interface</name>
    <files>src/app/api/projects/route.ts, src/app/api/projects/[id]/route.ts, src/server/services/project.service.ts</files>
    <action>
      Create a minimal API surface for /api/projects supporting GET (list) and POST (create), and a service layer with core CRUD methods:
      - src/server/services/project.service.ts:
        - export async function getProjects(): Promise<Project[]>
        - export async function createProject(input): Promise<Project>
        - export async function getProject(id): Promise<Project | null>
        - export async function updateProject(id, input): Promise<Project>
        - export async function setProjectArchived(id, archived:boolean): Promise<Project>
      - src/app/api/projects/route.ts: implement GET and POST delegating to the service.
      - src/app/api/projects/[id]/route.ts: implement GET and PATCH delegating to the service.
    </action>
    <verify>
      - Accessing /api/projects returns 200 and an array (GET)
      - POST /api/projects with {name, description} returns 201 and a Project object
    </verify>
    <done>
      API surface and service layer skeleton in place for Phase 1
    </done>
  </task>

</tasks>

<verification>
Basic API surface exercised by manual checks and automated unit tests in subsequent plans
</verification>

<success_criteria>
Phase 1 success: Prisma model exists; database migrated; API surface and service layer wired; 1-2 UI scaffolds ready for integration; and the phase ready for further integration tasks in Wave 2.
</success_criteria>

<output>
After completion, create `.planning/phases/01-projects/01-01-PLAN-SUMMARY.md`
</output>
