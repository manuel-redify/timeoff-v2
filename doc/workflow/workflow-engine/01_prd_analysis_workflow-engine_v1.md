# PRD Analysis - Admin Workflow Engine
**Version:** v1
**Date:** 2026-02-12
**Source PRD:** `doc/prd/prd_workflow_engine.md`

## 🎯 Objective
Create a dynamic Workflow Engine to decouple approval logic from source code. Support multi-role aggregation (Global vs Project-Specific), sequential/parallel steps, and a timeline-based builder UI with strict shadcn/ui specifications.

## 📋 Feature & Logic Map
| ID | Role | Feature | Functional Logic & Requirements | Edge Cases & Error Handling |
|:---|:---|:---|:---|:---|
| F01 | Admin | Policy Builder (Triggers) | Define application criteria via AND logic: Request Type, Contract Type (dynamic + "Any"), Subject Role (dynamic + "Any"), Department (dynamic + "Any"), Project Type (`Project`, `Staff Aug`, `Any`). | **Edge Case:** "Any" selection must clear and disable specific selections in the same field. |
| F02 | Admin | Step Definition (Sequence) | Sequential vertical timeline. Each step: Resolver (Role, Dept Mgr, Line Mgr, User), Context Scope (Global, Same Area/Project/Dept), Action (Require Approval/Auto-Approve). | **Conflict:** Self-approval resets step to SKIPPED. **Validation:** Resolvers required unless Auto-Approve is ON. |
| F03 | Admin | Parallel Steps | Allow multiple Approvers in a single step (horizontal group). All must approve for the step to complete? (PRD says "Master Request is APPROVED only when ALL generated Sub-Flows are completed"). | **Edge Case:** Mixed sequential and parallel steps in the same policy. |
| F04 | Admin | Watcher Definition | Non-blocking notifications. Resolver + Scope. No sequence, no "Action" state. | **Priority:** If User = Watcher AND Approver, Approver role takes precedence. |
| F05 | System | Policy Matching (Runtime) | Additive logic: Collect all policies matching User Role + all Project Roles + "Any Role". UNION of all matched policies. | **Edge Case:** No policies found -> Trigger Fallback Safety Net. |
| F06 | System | Sub-Flow Generation | Parallel instantiation of flows for User Role and Project Roles independently. | **Logic:** Master Approved only if ALL Sub-Flows are Approved. |
| F07 | System | Fallback Safety Net | Level 1: Policy-specific fallback -> Level 2: Dept Mgr -> Level 3: Admin. | **Requirement:** System must never stall without a resolver. |
| F08 | System | Request Immutability | Once sent, request cannot be modified. Delete & Recreate only. | **Edge Case:** Attempting to edit a pending request in UI. |
| F09 | Admin | Admin Override | Force Approve/Reject with Audit logging. | **Requirement:** Logging is mandatory for accountability. |
| F10 | UI | Overview Page | `/settings/workflows` with DataTable, Skeleton loading, Empty State, specific Badge statuses. | **Mobile:** Transform to stacked Cards below 768px. |
| F11 | UI | Builder Layout | Sticky header, Dirty state alerts, Prominent Name input, saving state (Loader2). | **UX:** Unsaved changes must trigger AlertDialog on exit. |

## 🏗️ Data Entities (Domain Model)
- **WorkflowPolicy:** Logical container of triggers and ordered steps.
- **WorkflowTrigger:** Criteria mapping (RequestType, ContractType, SubjectRole, etc.).
- **WorkflowStep:** Individual approval node with Resolver and Context constraints.
- **WorkflowWatcher:** Notification node.
- **SubFlow:** Runtime instance of an approval sequence for a specific Role+Context.
- **Resolver:** Union of User, Role, Department Manager, or Line Manager references.

## 🔗 Dependencies & Blockers
- **Internal:** F01 (Triggers) and F02 (Steps) are required for a valid Policy. Engine runtime depends on these definitions.
- **External:** Depends on existing `Role`, `Department`, `Project`, `User`, `ContractType` entities being queryable.

## 🔧 Technical Stack & Constraints
- **Stack:** Next.js (implied), React, Tailwind CSS, shadcn/ui, lucide-react, TanStack Table, react-hook-form + zod.
- **Performance:** Engine tree generation must be < 200ms.
- **Constraint:** Use exact shadcn components (`Popover`, `Command`, `Skeleton`, `Badge`, `AlertDialog`, `useToast`). No custom modals for policy editing.

## 🚫 Scope Boundaries
- **In-Scope:** Builder UI, Runtime Engine (Additive Logic), Fallback Net, Audit Logging, Multi-Role aggregation.
- **Out-of-Scope:** Modification of pending requests (Delete only), complex "conditional branching" beyond the defined trigger/scope logic.

## ❓ Clarifications Needed
1. **Parallel vs Sub-Flows:** Does a "Parallel Step" within a single policy behave the same as multiple independent "Sub-Flows" from different policies?
2. **Auto-Approve Logic:** If "Auto-Approve" is ON for a step, does it still generate a notification for history?
3. **Circular Dependencies:** System should prevent circular sequences (though unlikely given vertical timeline).
4. **Prisma Mapping:** PRD says "No DDL changes", but the existing `ApprovalRule` has a flat structure. Confirm if "Workflow Policy" is a brand new JSON-based storage in a metadata field or if we are expanding `ApprovalRule` (PRD explicitly says "Query and Service Layer" change, suggesting we might be over-provisioning logical structure onto flat DB records).
