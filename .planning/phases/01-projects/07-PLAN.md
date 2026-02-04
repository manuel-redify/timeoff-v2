---
phase: 01-projects
plan: 07
type: execute
wave: 5
depends_on: ["06"]
files_modified: [docs/phase-01-commit-sequence.md]
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Clear, atomic commit sequence is defined for Phase 1"
  artifacts:
    - "docs/phase-01-commit-sequence.md"
  key_links:
    - "Commit planning ensures traceability and reproducibility"
---

<objectives>
[Atomic commit sequence plan]
Purpose: Define the exact commit boundaries and messages to implement Phase 1 incrementally.
Output: A documented sequence of commits with messages and purposes.
</objectives>

<execution_context>
@.planning/ROADMAP.md
@/gsd-discuss-phase
</execution_context>

<context>
Align with existing commit conventions and project history tracking.
</context>

<tasks>

  <task type="auto">
    <name>01. Draft atomic commit plan for Phase 1</name>
    <files>docs/phase-01-commit-sequence.md</files>
    <action>
      Create a detailed commit plan listing 7-10 commits in logical order:
      - Feat: add Prisma schema
      - Feat: API routes
      - Feat: UI scaffolding
      - Fix: RBAC gating
      - Feat: audit logging
      - Test: API tests
      - Test: service tests
      - Docs: PITFALLS mapping for Phase 1
      - etc.
    </action>
    <verify>
      - The commit plan file exists and describes each commit with purpose
    </verify>
    <done>
      Atomic commit sequence documented for Phase 1
    </done>
  </task>

</tasks>

<verification>
Documentation of commit strategy prepared
</verification>

<output>
After completion, create `.planning/phases/01-projects/07-07-PLAN-SUMMARY.md`
</output>
