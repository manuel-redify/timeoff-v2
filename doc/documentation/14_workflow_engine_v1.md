# Workflow Engine (Admin)
**Version:** v1 | **Date:** 2026-02-13

## Overview
The Workflow Engine allows administrators to define complex approval and notification rules for leave requests based on user roles, projects, and departments.

## Core Features
- **Multi-Role UNION Matching**: Requester roles (default + active project roles) are used to match multiple policies simultaneously.
- **Sub-Flow Aggregation**: Each matched policy generates an independent sub-flow. Master outcome is computed by an aggregator (REJECTED if any required step rejects, APPROVED only when all required steps are complete).
- **Parallel & Sequential Steps**: Policies support both sequential ordering and parallel approval groups.
- **Atomic Audits & Notifications**: Notifications and audit logs are emitted exactly once per final state transition (e.g., when the aggregator flips the master status to APPROVED).
- **Fallback Logic**: Level 2 (Department Manager) and Level 3 (Company Admin) fallbacks prevent workflow stalls when primary approvers are missing or self-approving.

## Technical Architecture
- **Service**: `WorkflowResolverService` (resolution, sub-flow generation, aggregation).
- **Audit**: `WorkflowAuditService` (canonical event construction).
- **API**: `/api/leave-requests/[id]/approve` (transactional step update + outcome aggregation).

## Acceptance Criteria Verified
- [x] Multi-project role coverage in runtime fixtures.
- [x] Correct REJECTED/APPROVED/PENDING master state flipping.
- [x] Fallback activation when primary is requester.
- [x] Single-emission notification/audit stability.
