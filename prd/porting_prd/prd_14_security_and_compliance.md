# PRD 14: Security & Compliance

**Document Version:** 1.0  
**Date:** January 11, 2026  
**Status:** Draft  
**Author:** Senior Product Manager  
**Related PRDs:** PRD 00 (Overview), PRD 01 (User Management), PRD 12 (Database Schema), PRD 13 (API Specifications)

---

## Executive Summary

This document defines the security architecture and compliance requirements for TimeOff Management Application v2. The transition to a modern stack (Next.js, Clerk, Supabase) requires a robust approach to data protection, access control, and regulatory compliance (GDPR).

### Goals and Objectives

1.  **Zero Trust Authentication**: Leverage Clerk for secure, identity-based access.
2.  **Fine-Grained Authorization**: Implement Row-Level Security (RLS) in Supabase to ensure data isolation.
3.  **Data Protection**: Ensure encryption at rest and in transit.
4.  **Compliance**: Adhere to GDPR and other relevant data privacy standards.
5.  **Auditability**: Maintain comprehensive logs of sensitive actions.

---

## 1. Authentication Strategy

The application uses **Clerk** as the primary identity provider.

### 1.1 Authentication Flows
- **User Login**: Managed by Clerk (Email/Password, OAuth).
- **Session Management**: Handled by Clerk's JWT-based sessions.
- **MFA**: Support for Multi-Factor Authentication (optional configuration in Clerk).

### 1.2 Identity Synchronization
- Clerk `user_id` is stored as `clerk_id` in the Supabase `users` table.
- A webhook listener at `/api/webhooks/clerk` synchronizes user metadata (email, name) between Clerk and Supabase.

---

## 2. Authorization & Access Control

Authorization is enforced at both the application (API) and database (RLS) layers.

### 2.1 Role-Based Access Control (RBAC)
Base roles defined in PRD 01:
- **Administrator**: Full system access.
- **Supervisor**: Department-level management.
- **Employee**: Individual and team visibility (view-only).

### 2.2 Row-Level Security (RLS)
Supabase RLS ensures that even if an API route is compromised, the database only serves data the user is authorized to see.

#### Core RLS Policies (Examples):
- **Companies**: Users can only `SELECT` their own company record.
- **Users**: Users can `SELECT` colleagues in their company; only Admins can `UPDATE/DELETE`.
- **Leave Requests**:
    - Users can `SELECT/UPDATE/DELETE` their own requests.
    - Supervisors can `SELECT/UPDATE` requests from users in their supervised departments.
    - Admins can `SELECT/UPDATE/DELETE` all requests in their company.
- **Audit Logs**: Read-only; only accessible by Admins.

---

## 3. Data Protection

### 3.1 Encryption
- **In Transit**: All communication must be over HTTPS (TLS 1.2+).
- **At Rest**: Supabase (PostgreSQL) provides transparent data encryption (TDE) for data at rest and backups.

### 3.2 Sensitive Data Handling
- **Passwords**: Never stored in the application database (handled by Clerk).
- **API Tokens**: Integration tokens (for iCal feeds) should be stored as hashed values or UUIDs with limited scope.

---

## 4. Compliance & Privacy (GDPR)

The application is designed to be GDPR compliant.

### 4.1 Data Subjects' Rights
- **Right to Access**: Users can view all their data via the Profile and Leave History sections.
- **Right to Rectification**: Users can update their profile; Admins can rectify employee data.
- **Right to Erasure**: Hard-delete functionality for users (cascading to personal data) as defined in PRD 01.
- **Data Portability**: JSON/CSV export functionality in PRD 09 and PRD 10.

### 4.2 Data Retention
- **Active Users**: Data retained for the duration of the employment.
- **Deactivated Users**: Data retained according to company policy (managed via `deleted_at` soft-deletes).
- **Hard Deletion**: Admins can trigger permanent deletion of user records.

---

## 5. Security Best Practices

### 5.1 Infrastructure Security
- **Vercel**: Leverage Vercel's edge security and DDoS protection.
- **Supabase**: Restricted database access; only the application server and authorized developers (via Supabase dashboard) can connect.

### 5.2 Application Security
- **CSRF Protection**: Native to Next.js and Supabase Client.
- **SQL Injection**: Prevented by parameterized queries through Supabase/PostgREST.
- **XSS Prevention**: React's automatic escaping for dynamic content; safe usage of `dangerouslySetInnerHTML`.
- **Input Validation**: `zod` schema validation for all API endpoints (PRD 13).

---

## 6. Audit Logging

Sensitive actions must be logged in the `audit_logs` table:
- User login/logout (via Clerk logs).
- Profile updates (Admin-initiated).
- Allowance adjustments.
- Leave request approvals/rejections.
- System configuration changes.

---

## 7. Vulnerability Management

- **Dependency Scanning**: Regular use of `npm audit` and automated tools (e.g., Dependabot).
- **Security Updates**: Timely updates of Next.js, Clerk, and Supabase SDKs.

---

*End of PRD 14 - Security & Compliance*
