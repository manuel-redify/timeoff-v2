# PRD Analysis - Approval Routing Fix
**Version:** v1
**Date:** 2026-01-23

## 🎯 Objective
Ensure leave requests created in Basic Mode are visible and actionable in the new Approval Dashboard by automatically creating `approval_steps` for authorized supervisors.

## 📋 Functional Requirements
1. **Submission Logic Update**: When a leave request is submitted in Basic Mode, the system must create an `approval_step` for each potential approver (Department Supervisors, Department Boss, or Company Admins as fallback).
2. **Dashboard Visibility**: Requests in Basic Mode must appear in the "Pending Requests" view of the authorized approvers.
3. **Approval Finalization**: Completing an approval step for a Basic Mode request must transition the request itself to 'APPROVED' and record the `approver_id`.

## 🔧 Technical Requirements
- **Stack**: Next.js 14 (App Router), Prisma ORM, Neon PostgreSQL.
- **Constraints**: Maintain the "Any-to-Approve" logic of Basic Mode (meaning multiple users can have a step for the same request, and one action clears the request).

## 🚫 Out of Scope
- Migrating existing legacy requests (focus is on new requests).
- Changing Advanced Mode logic.

## ❓ Clarifications Needed
- None at this stage; the root cause is clearly the dashboard's reliance on `approval_steps` which Basic Mode currently skips.
