---
phase: 01-projects
plan: 05
type: execute
wave: 4
depends_on: ["03", "04"]
files_modified: [tests/project.api.test.ts, tests/project.service.test.ts]
autonomous: true
user_setup: []
must_haves:
  truths:
    - "API and service layer are covered by automated tests"
  artifacts:
    - "tests/project.api.test.ts"
    - "tests/project.service.test.ts"
  key_links:
    - "Tests verify contract between API and service layer"
---

<objectives>
[Testing strategy for Phase 1]
Purpose: codify a testing approach that validates API, service logic, and data integrity with Prisma.
Output: Test suites for API and service layer; guidance for CI integration.
</objectives>

<execution_context>
@.planning/ROADMAP.md
@/gsd-discuss-phase
</execution_context>

<context>
Leveraging existing test infra patterns in TimeOff; adapt to Projects module
</context>

<tasks>

  <task type="auto">
    <name>01. API integration tests (project.api.test.ts)</name>
    <files>tests/project.api.test.ts</files>
    <action>
      Implement tests for:
      - GET /api/projects returns 200 and array
      - POST /api/projects with valid payload returns 201
      - Basic error handling for invalid payload
    </action>
    <verify>
      - Tests pass in CI; test runner reports success
    </verify>
    <done>
      API tests scaffolded for Phase 1
    </done>
  </task>

  <task type="auto">
    <name>02. Service layer tests (project.service.test.ts)</name>
    <files>tests/project.service.test.ts</files>
    <action>
      Implement tests for project.service.ts behavior: createProject, getProjects, updateProject, setArchived
    </action>
    <verify>
      - Tests pass and validate expected outcomes
    </verify>
    <done>
      Service layer tests in place
    </done>
  </task>

</tasks>

<verification>
Testing suite wired; CI should run tests on PRs
</verification>

<output>
After completion, create `.planning/phases/01-projects/05-05-PLAN-SUMMARY.md`
</output>
