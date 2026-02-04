---
phase: 01-projects
plan: 04
type: execute
wave: 3
depends_on: ["02"]
files_modified: [src/server/services/audit.service.ts, src/server/auth/rbac.ts, src/app/api/projects/route.ts, src/app/api/projects/[id]/route.ts]
autonomous: true
user_setup: []
must_haves:
  truths:
    - "RBAC gating is applied to all project endpoints"
    - "Audit trail is created on create/update/archive actions"
  artifacts:
    - "src/server/auth/rbac.ts"
    - "src/server/services/audit.service.ts"
    - "src/app/api/projects/route.ts"
    - "src/app/api/projects/[id]/route.ts"
  key_links:
    - "RBAC gating connects UI/API to existing role model"
---

<objectives>
[Security & observability hardening for Phase 1]
Purpose: Ensure access control and audit logging align with existing patterns.
Output: Gate checks in API, and audit entries for project lifecycle events.
</objectives>

<execution_context>
@.planning/ROADMAP.md
@/gsd-discuss-phase
</execution_context>

<context>
Leverage existing RBAC and audit patterns in TimeOff; avoid ad-hoc implementations; reuse existing audit log structure
</context>

<tasks>

  <task type="auto">
    <name>01. Integrate RBAC checks into project API routes</name>
    <files>src/app/api/projects/route.ts, src/app/api/projects/[id]/route.ts</files>
    <action>
      Insert gate checks at the start of each handler to require appropriate roles (e.g., admin, project_manager).
      Use existing RBAC utilities from the codebase to enforce permissions.
    </action>
    <verify>
      - Requests from unauthorized roles return 403
      - Authorized roles pass through to service layer
    </verify>
    <done>
      RBAC gating in place for Phase 1 project endpoints
    </done>
  </task>

  <task type="auto">
    <name>02. Emit audit logs for create/update/archive actions</name>
    <files>src/server/services/audit.service.ts, src/app/api/projects/route.ts, src/app/api/projects/[id]/route.ts</files>
    <action>
      After successful create/update/archive operations, call audit.service.log with action details including userId, projectId, action type, and timestamp.
    </action>
    <verify>
      - Audit entries appear in the Audit table/log with correct fields after relevant API calls
    </verify>
    <done>
      Audit trail integration wired for Phase 1
    </done>
  </task>

</tasks>

<verification>
Security and audit integration validated by unit tests in Plan 05
</verification>

<output>
After completion, create `.planning/phases/01-projects/04-04-PLAN-SUMMARY.md`
</output>
