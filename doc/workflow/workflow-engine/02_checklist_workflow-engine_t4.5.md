# Checklist - Task 4.5
**Parent:** 02_detailed_m4_workflow-engine.md

### Steps
- [ ] Step 1: Define canonical audit attributes for policy matching, fallback activation, aggregator decisions, and override events.
- [ ] Step 2: Add transaction-scoped audit writes in create/approve/reject/bulk endpoints for workflow runtime decisions.
- [ ] Step 3: Record admin force-approve/force-reject actions with actor, reason/comment, and previous state metadata.
- [ ] Step 4: Ensure all workflow audit records include `entityType`, `entityId`, `companyId`, and `byUserId`.
- [ ] Step 5: Add test coverage/assertions for audit emission in normal and override paths.

### Done When
- [ ] Audit schema/attributes are consistent across all workflow runtime paths.
- [ ] Runtime decision points emit auditable records inside the same transaction as state updates.
- [ ] Admin override actions are explicitly distinguishable from standard approvals/rejections.
- [ ] Core traceability fields are present on all new audit entries.
- [ ] Automated tests validate audit creation for both success and override scenarios.

## Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-13 | 1.0 | Checklist creation for Task 4.5 (Audit logging and admin overrides). |
