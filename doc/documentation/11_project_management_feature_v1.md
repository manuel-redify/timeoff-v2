# Feature Documentation - Project Management Settings
**Version:** v1 | **Date:** 2026-02-05 | **Status:** 🟢 Complete

## Overview

The Project Management Settings feature enables organizations to manage projects, clients, and resource allocation within the TimeOff application. This module provides comprehensive tools for tracking project assignments, managing billable vs non-billable work, and ensuring optimal resource distribution across teams.

## Table of Contents

1. [Feature Scope](#feature-scope)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Core Entities](#core-entities)
4. [Allocation Logic](#allocation-logic)
5. [User Interface](#user-interface)
6. [API Reference](#api-reference)
7. [Audit Trail](#audit-trail)

---

## Feature Scope

### Capabilities

- **Project Management**: Create, edit, archive, and delete projects
- **Client Management**: Organize projects by client/customer
- **Resource Allocation**: Assign users to projects with percentage allocation
- **Role Assignment**: Assign specific roles to users on each project
- **Date-based Assignments**: Set start and end dates for project assignments
- **Billable Tracking**: Mark projects as billable or non-billable
- **Visual Organization**: Color-code projects for easy identification
- **Audit Logging**: Track all changes to projects and assignments

### Out of Scope

- Time tracking within projects
- Project budgeting and financial reporting
- Gantt charts or project timelines
- Task management within projects

---

## User Roles & Permissions

### Admin Users

**Full Access:**
- View all projects (active and archived)
- Create new projects
- Edit existing projects
- Archive/unarchive projects
- Delete projects (when no users assigned)
- Manage client list
- View and edit user project assignments

### Regular Users

**Read-Only Access:**
- View projects they are assigned to
- View their own allocation percentages
- View project details (name, client, status)

**No Access:**
- Cannot create or edit projects
- Cannot modify assignments
- Cannot view projects they are not assigned to

---

## Core Entities

### Client

Represents a customer or external organization that projects are delivered for.

**Fields:**
- `name` - Client name (unique per company)
- `companyId` - Owning company reference

**Business Rules:**
- Client names must be unique within a company
- Clients can be created inline during project creation
- Deleting a client does not delete associated projects (client reference is set to null)

### Project

Represents a unit of work or initiative within the organization.

**Fields:**
- `name` - Project name (unique per company)
- `type` - Project type/category (e.g., "CLIENT_PROJECT", "INTERNAL")
- `description` - Optional project description
- `status` - ACTIVE, INACTIVE, or COMPLETED
- `archived` - Boolean flag for soft archiving
- `isBillable` - Whether project time is billable to client
- `color` - Hex color code for UI display
- `clientId` - Optional reference to associated client

**Business Rules:**
- Project names must be unique within a company
- Projects cannot be deleted if they have user assignments
- Archived projects are hidden from assignment dropdowns
- Inactive projects are visible but marked accordingly

### UserProject (Assignment)

Links users to projects with allocation details.

**Fields:**
- `userId` - Assigned user
- `projectId` - Assigned project
- `roleId` - Optional role on the project
- `allocation` - Percentage allocation (0-100, default 100)
- `startDate` - Assignment start date
- `endDate` - Optional assignment end date

**Business Rules:**
- No duplicate assignments for same user/project/role combination
- Total allocation per user should not exceed 100%
- End date must be after start date
- Assignments to archived projects are not allowed

---

## Allocation Logic

### Overview

The allocation system ensures users are not over-allocated across multiple projects. Each assignment specifies a percentage of the user's capacity dedicated to that project.

### Validation Rules

1. **Single Assignment Range:**
   - Minimum: 0%
   - Maximum: 100%
   - Default: 100%

2. **Total Allocation per User:**
   - Warning when total exceeds 100%
   - Visual indicator (red badge) for over-allocation
   - No hard enforcement (allows temporary over-allocation)

3. **Assignment Conflicts:**
   - System warns but allows overlapping date ranges
   - Users can be assigned to multiple projects simultaneously

### UI Indicators

| Total Allocation | Badge Style | Warning |
|-----------------|-------------|---------|
| < 100% | Secondary (gray) | None |
| = 100% | Default (primary) | None |
| > 100% | Destructive (red) | "Total allocation exceeds 100%" |

### Example Scenarios

**Scenario 1: Full-time single project**
```
Project A: 100%
Total: 100% ✓
```

**Scenario 2: Split across two projects**
```
Project A: 60%
Project B: 40%
Total: 100% ✓
```

**Scenario 3: Over-allocated (warning)**
```
Project A: 80%
Project B: 50%
Total: 130% ⚠️
```

---

## User Interface

### Project Settings Page

**Path:** `/settings/projects`

**Components:**

1. **Header**
   - Page title: "Projects"
   - Description: "Manage projects and assign team members"
   - "New Project" button (opens create dialog)

2. **DataTable**
   - Columns: Name, Client, Status, Billable, Users, Actions
   - Search functionality
   - Archive filter toggle
   - Row actions: Edit, Archive/Unarchive, Delete

3. **Empty State**
   - Icon: FolderOpen
   - Message: "No projects found"
   - Subtext: "Create a new project to get started"

### Create/Edit Project Dialog

**Layout:**
- Responsive grid: 1 column (mobile) / 2 columns (desktop)
- Scrollable content with max height

**Fields:**
1. **Project Name** (required) - Text input
2. **Client** (optional) - Searchable dropdown with inline creation
3. **Description** (optional) - Textarea
4. **Billable Project** - Toggle switch
5. **Color** - Color picker with presets and custom option

**Color Picker Features:**
- 12 preset colors with tooltips
- Visual selection indicator (ring + scale)
- Custom color picker with dashed border
- Keyboard accessible

### User Project Assignments Card

**Location:** User edit/create forms

**Components:**

1. **Header**
   - Title: "Project Assignments"
   - Total allocation badge (with warning state)
   - "Add Project" button

2. **Assignment Rows**
   - Project selector (dropdown)
   - Role selector (dropdown, optional)
   - Allocation input (0-100, with % suffix)
   - Start date picker (required)
   - End date picker (optional)
   - Remove button (trash icon)

3. **Responsive Layout**
   - Mobile: Single column stack
   - Tablet: 2 columns
   - Desktop: 5 columns

4. **Validation Feedback**
   - Red warning when total allocation > 100%
   - Accessible alert with aria-live="assertive"
   - Warning icon (SVG) for high contrast

### Project Actions Dropdown

**Menu Items:**
1. Edit Project
2. View Details
3. Archive/Unarchive
4. Delete (disabled when users assigned, with tooltip)

**Delete Protection:**
- Button disabled when project has assigned users
- Tooltip explains: "Cannot delete project with N assigned user(s). Unassign users first."

---

## API Reference

### Projects API

#### List Projects
```
GET /api/projects
```

**Query Parameters:**
- `search` - Filter by name/description/client
- `archived` - Include archived projects (boolean)

**Response:** Array of Project objects with client and user count

#### Get Project
```
GET /api/projects/:id
```

**Response:** Project object with relations

#### Create Project
```
POST /api/projects
```

**Request Body:**
```json
{
  "name": "string",
  "clientId": "string | null",
  "isBillable": "boolean",
  "description": "string",
  "color": "string"
}
```

**Notes:**
- Creates new client if `clientId` starts with "new:"
- Audit log entry created automatically

#### Update Project
```
PATCH /api/projects/:id
```

**Request Body:**
```json
{
  "name": "string?",
  "clientId": "string?",
  "isBillable": "boolean?",
  "description": "string?",
  "color": "string?",
  "status": "ACTIVE | INACTIVE | COMPLETED?",
  "archived": "boolean?"
}
```

**Notes:**
- Only changed fields are logged in audit trail

#### Archive/Unarchive Project
```
PATCH /api/projects/:id
```

**Request Body:**
```json
{
  "archived": "boolean"
}
```

**Notes:**
- Separate audit log entry for archive/unarchive actions

#### Delete Project
```
DELETE /api/projects/:id
```

**Error Conditions:**
- 400: Cannot delete project with assigned users

**Notes:**
- Audit log captures full project state before deletion

### User Projects API

#### Get User Projects
```
GET /api/users/:id/projects
```

**Response:** Array of UserProject objects with project and role details

#### Sync User Projects
```
PUT /api/users/:id/projects
```

**Request Body:**
```json
{
  "assignments": [
    {
      "projectId": "string",
      "roleId": "string | null",
      "allocation": "number (0-100)",
      "startDate": "string (YYYY-MM-DD)",
      "endDate": "string | null (YYYY-MM-DD)"
    }
  ]
}
```

**Behavior:**
- Creates new assignments for items not in existing list
- Updates existing assignments with changes
- Removes assignments not in incoming list
- Bulk audit log entries created for all changes

---

## Audit Trail

### Tracked Events

All changes to projects and assignments are automatically logged.

#### Project Events

| Event | Attribute | oldValue | newValue |
|-------|-----------|----------|----------|
| Creation | "creation" | null | JSON of all fields |
| Modification | "modification" | JSON of changed fields | null |
| Archive | "archived" | `{archived: false}` | `{archived: true}` |
| Unarchive | "unarchived" | `{archived: true}` | `{archived: false}` |
| Deletion | "deletion" | JSON of full project state | null |

#### UserProject Events

| Event | Attribute | Details |
|-------|-----------|---------|
| Assignment Created | "assignment_created" | user, project, role, allocation, dates |
| Assignment Modified | "assignment_modified" | Changed fields with old/new values |
| Assignment Removed | "assignment_removed" | Full assignment details |

### Audit Log Schema

```json
{
  "entityType": "Project | UserProject",
  "entityId": "uuid",
  "attribute": "creation | modification | archived | unarchived | deletion | assignment_created | assignment_modified | assignment_removed",
  "oldValue": "JSON string or null",
  "newValue": "JSON string or null",
  "companyId": "uuid",
  "byUserId": "uuid",
  "at": "ISO timestamp"
}
```

### Querying Audit Logs

Audit logs are stored in the `audit` table and can be queried by:
- Entity type and ID (change history)
- Company (tenant isolation)
- User (who made changes)
- Date range (when changes occurred)

---

## Best Practices

### Project Naming

- Use clear, descriptive names
- Include client name for client projects: "Acme Corp - Website Redesign"
- Avoid abbreviations that may not be understood by all users

### Resource Allocation

- Aim for 100% total allocation per user
- Use allocation to indicate priority (higher % = higher priority)
- Review allocations regularly, especially during project transitions
- Set end dates when project work is expected to conclude

### Client Organization

- Create clients for all external work
- Use consistent naming conventions
- Consider creating an "Internal" client for non-billable work

### Color Coding

- Use consistent colors for client or project types
- Avoid colors that conflict with UI status indicators (red, green, yellow)
- Consider accessibility for color-blind users

---

## Troubleshooting

### Cannot Delete Project

**Issue:** Delete option is disabled
**Cause:** Project has assigned users
**Solution:**
1. Edit each assigned user's profile
2. Remove the project assignment from the "Project Assignments" card
3. Once all users are unassigned, delete the project

### Over-Allocation Warning

**Issue:** Total allocation shows red warning
**Cause:** User's assignments sum to > 100%
**Solution:**
1. Review user's project assignments
2. Adjust allocation percentages to better reflect actual capacity
3. Consider extending end dates on completed work

### Project Not Visible in Assignments

**Issue:** Project doesn't appear in dropdown
**Possible Causes:**
- Project is archived (unarchive to use)
- Project status is not ACTIVE (change status)
- No active projects exist (create a project first)

---

## Related Documentation

- [Database Schema](02_database_v1.md) - ER diagrams and field definitions
- [User Management](user_creation.md) - Creating and editing users
- [Roles Management](roles_management_feature.md) - Managing roles for assignments

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1 | 2026-02-05 | Initial documentation for Project Management Settings feature |
