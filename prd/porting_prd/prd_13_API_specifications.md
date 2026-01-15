# PRD 13: API Specifications

**Document Version:** 1.0  
**Date:** January 11, 2026  
**Status:** Draft  
**Author:** Senior Product Manager
**Related PRDs:** [PRD 00 (Overview)], [PRD 01-11 (Features)], [PRD 12 (Database Schema)]

---

## Executive Summary

This document defines the RESTful API specifications for TimeOff Management Application v2. It outlines the endpoints, request/response formats, authentication patterns, and error handling mechanisms required to support the features defined in PRDs 01 through 11, utilizing the database schema defined in PRD 12.

---

## 1. API Standards & Error Handling

### 1.1 Communication Protocol
- **Base URL:** `/api`
- **Protocol:** HTTPS only
- **Format:** JSON (Request/Response)
- **Character Encoding:** UTF-8

### 1.2 RESTful Patterns
- **GET:** Retrieve resources (read-only)
- **POST:** Create new resources or perform actions
- **PUT/PATCH:** Update existing resources
- **DELETE:** Remove/Deactivate resources

### 1.3 Standard Response Formats

#### Success Response (200 OK, 201 Created)
All successful responses follow a standard envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional descriptive message"
}
```

#### Error Response (4xx, 5xx)
All error responses provide a consistent structure for troubleshooting:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Optional field name for validation errors",
      "reason": "Specific reason for the error"
    },
    "validationErrors": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### 1.4 TypeScript Definition

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  validationErrors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}
```

### 1.5 Authentication
- **Mechanism:** Clerk JWT
- **Pattern:** `Authorization: Bearer <CLERK_SESSION_TOKEN>`
- **Validation:** Server-side validation via Clerk SDK and custom middleware.

### 1.6 Rate Limiting
- **Default Limit:** 100 requests per 1 minute window per IP/User.
- **Headers:**
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in window
  - `X-RateLimit-Reset`: UTC epoch time when the limit resets

### 1.7 Example Responses

| Scenario | Status | Example |
|----------|--------|---------|
| **Success** | 200 | `{"success": true, "data": {"id": "123"}, "message": "Created"}` |
| **Validation**| 400 | `{"success": false, "error": {"code": "VALIDATION_ERROR", "validationErrors": [{"field": "date", "message": "Required"}]}}` |
| **Auth** | 401 | `{"success": false, "error": {"code": "UNAUTHORIZED", "message": "Invalid token"}}` |
| **Forbidden** | 403 | `{"success": false, "error": {"code": "FORBIDDEN", "message": "Admin role required"}}` |
| **Server** | 500 | `{"success": false, "error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred"}}` |


---

## 2. Authentication & Authorization

### 2.1 Clerk Integration
- **Mechanism:** JWT (JSON Web Token) provided by Clerk.
- **Header:** `Authorization: Bearer <CLERK_SESSION_TOKEN>`
- **Middleware:** `authMiddleware` validates the token and extracts `clerk_id`.
- **User Mapping:** API routes resolve `clerk_id` to the internal `user_id` from the `users` table.

### 2.2 Permissions (RLS & Logic)
- **RLS:** Supabase Row Level Security enforced at the database layer.
- **Application Level:** API routes verify user roles (Admin, Supervisor) before executing restricted actions.

---

## 3. API Endpoints

### 3.1 User Management (`/api/users`)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/` | List all users (paginated, filtered) | Admin/Supervisor |
| GET | `/:id` | Get detailed user profile | Self/Admin |
| PATCH | `/:id` | Update user profile | Self (limited)/Admin |
| POST | `/invite` | Invite new user (Clerk creation + DB record) | Admin |
| DELETE | `/:id` | Deactivate/Delete user | Admin |
| GET | `/me` | Get current authenticated user session | All |

### 3.2 Company & Structure (`/api/company`)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/settings` | Get company-wide configuration | All (read-only) |
| PATCH | `/settings` | Update company configuration | Admin |
| GET | `/departments` | List company departments | All (read-only) |
| POST | `/departments` | Create new department | Admin |
| PATCH | `/departments/:id`| Update department details | Admin |
| GET | `/holidays` | List public holidays for company | All |
| POST | `/holidays` | Add/Sync public holidays | Admin |

### 3.3 Leave Types (`/api/leave-types`)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/` | List active leave types | All |
| POST | `/` | Create new leave type | Admin |
| PATCH | `/:id` | Update leave type properties | Admin |
| DELETE | `/:id` | Deactivate leave type | Admin |

### 3.4 Leave Workflow (`/api/leave-requests`)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/` | List my leave requests | All |
| POST | `/` | Submit new leave request | All |
| GET | `/:id` | Get request details with audit trail | Requester/Approver/Admin |
| POST | `/:id/approve` | Approve a pending request | Approver/Admin |
| POST | `/:id/reject` | Reject a pending request (requires comment)| Approver/Admin |
| DELETE | `/:id` | Cancel a pending request | Requester |
| POST | `/:id/revoke` | Request revocation of approved leave | Requester/Admin |

### 3.5 Allowances (`/api/allowance`)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/user/:userId` | Get current year/history breakdown | Self/Supervisor/Admin |
| POST | `/adjust` | Add manual adjustment (days in lieu) | Admin |
| GET | `/summary` | Get team allowance overview | Supervisor/Admin |

### 3.6 Calendar & Visualization (`/api/calendar`)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/month` | Absences for specific month (grid) | All |
| GET | `/wall-chart` | Timeline view for team/company | All (subject to RLS) |
| GET | `/list` | Tabular view of absences | All |
| GET | `/ical/:token` | External iCal feed (no auth required) | Public (w/ token) |

---

## 4. Webhook Specifications

### 4.1 Clerk Webhooks
The application listens for Clerk webhooks at `/api/webhooks/clerk`:
- `user.created`: Sync new Clerk user to `users` table.
- `user.updated`: Update email/name in `users` table.
- `user.deleted`: Mark user as deleted in `users` table.

---

## 5. Implementation Notes

- **Input Validation:** Use `zod` for request body schema validation.
- **Calculated Fields:** Allowance calculations (days deducted) should be calculated on the fly or returned as part of the request payload to ensure consistency.
- **Concurrency:** Use Postgres transactions when performing sensitive operations (e.g., creating a leave request that affects multiple tables).

---

*End of PRD 13 - API Specifications*
