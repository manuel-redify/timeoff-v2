# Area Management
**Version:** v1 | **Date:** 2026-02-02
**Related Skills:** Settings, Admin Features | **Dependencies:** 00_doc_master_v2.md, roles_management_feature.md

## Overview
Area Management is a settings feature that allows administrators to create, edit, and delete organizational areas. Areas are used to group users and define role assignments within the company structure. Each area displays the count of assigned users with tooltip details.

## Location
- **Page:** `/settings/areas`
- **API Base:** `/api/areas`
- **Access:** Admin-only

## Features

### 1. Create Area
- Opens dialog from "Add Area" button
- Requires unique area name within company
- Validation: Name is required, must be unique per company

### 2. Edit Area
- Edit action in dropdown menu per area row
- Opens dialog with pre-populated name
- Validation: Same as create (unique name check excludes current area)

### 3. Delete Area
- Delete action in dropdown menu (red text)
- **Restriction:** Cannot delete areas in use
- Blocked if area has:
  - User role area assignments (`userRoleAreas`)
  - Approval rules (`approvalRules`)
- Shows error: "Cannot delete area that is in use. Remove users and approval rules first."

### 4. User Count Display
- Shows unique user count per area in table
- Tooltip displays list of assigned user names
- Count excludes deleted users (`deletedAt: null`)

## Data Model

### Area (Prisma)
```prisma
model Area {
  id            String         @id @default(uuid())
  name          String
  companyId     String         @map("company_id")
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")
  approvalRules ApprovalRule[]
  company       Company        @relation(fields: [companyId], references: [id], onDelete: Cascade)
  userRoleAreas UserRoleArea[]

  @@unique([companyId, name])
  @@index([companyId])
  @@map("areas")
}
```

### Relationships
- **Company:** Each area belongs to one company
- **UserRoleArea:** Junction table linking users to roles in specific areas
- **ApprovalRule:** Approval routing can be scoped to areas

## API Endpoints

### GET /api/areas
Returns all areas for the company with user counts.
**Response:**
```json
{
  "success": true,
  "data": [{
    "id": "uuid",
    "name": "Sales",
    "createdAt": "2026-02-02T...",
    "userRoleAreas": [...],
    "_count": {
      "userRoleAreas": 5,
      "uniqueUsers": 3
    }
  }]
}
```

### POST /api/areas
Creates new area.
**Body:** `{ "name": "Sales" }`
**Errors:**
- 400: "Area with this name already exists"
- 403: "Only admins can create areas"

### PUT /api/areas/:id
Updates area name.
**Body:** `{ "name": "Marketing" }`
**Errors:**
- 404: "Area not found"
- 400: "Area with this name already exists"

### DELETE /api/areas/:id
Deletes area if not in use.
**Errors:**
- 404: "Area not found"
- 400: "Cannot delete area that is in use"

## UI Components

### Page Structure
- **Header:** Title, description, "Add Area" button
- **Table:** 4 columns (Name, Users, Created, Actions)
- **Dialogs:** Create/Edit forms with name input
- **Empty State:** Shirt icon, "No areas found" message

### Icons
- **Page Icon:** Shirt (Lucide)
- **Empty State:** Shirt (large, muted)
- **Users Column:** Users icon with count

## Security
- **RBAC:** Admin-only access (checked via `isAdmin`)
- **Company Scope:** All operations filtered by `companyId`
- **Validation:** Zod schema validation on all inputs

## Related Features
- **Roles Management:** Areas are referenced in role-area assignments
- **User Management:** Users can be assigned to areas via `UserRoleArea`
- **Approval Rules:** Areas can define approval routing scope

## Change Log
**v1:** Initial documentation for Area Management feature implementation