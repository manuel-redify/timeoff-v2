---
phase: 01-projects
plan: 06
type: execute
wave: 4
depends_on: ["05"]
files_modified: [PITFALLS.md]
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Known PITFALLS and mitigations are documented and adopted"
  artifacts:
    - "PITFALLS.md"
  key_links:
    - "Risk mitigation references in the phase plan"
---

<objectives>
[Risk mitigation planning]
Purpose: Align Phase 1 with PITFALLS.md guidance and document mitigations.
Output: Updated PITFALLS.md with Phase 1 project-specific mitigations.
</objectives>

<execution_context>
@.planning/ROADMAP.md
@/gsd-discuss-phase
</execution_context>

<context>
Derived from PITFALLS.md; ensure we avoid common pitfalls in an early phase
</context>

<tasks>

  <task type="auto">
    <name>01. Reference PITFALLS and capture Phase 1 mitigations</name>
    <files>PITFALLS.md</files>
    <action>
      Add a section mapping Phase 1 risks to mitigations such as:避免过度设计, ensure deadline alignment, guard RBAC with existing patterns, incremental rollout, etc. (Use existing PITFALLS.md structure)
    </action>
    <verify>
      - PITFALLS.md includes Phase 1 entries and mitigations
    </verify>
    <done>
      Risk mitigations documented for Phase 1
    </done>
  </task>

</tasks>

<verification>
Risk mitigations embedded in plan; referenceable by future checks
</verification>

<output>
After completion, create `.planning/phases/01-projects/06-06-PLAN-SUMMARY.md`
</output>
