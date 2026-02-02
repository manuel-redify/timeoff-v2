# Roles Management Feature Documentation

## Overview

The Roles Management feature allows administrators to create, edit, and delete organizational roles with priority levels. Roles are used throughout the system for user assignments, approval workflows, and area-based permissions.

## Feature Description

### Purpose
- **Organizational Structure**: Define hierarchical roles within the company
- **Priority Management**: Assign priority weights to determine role hierarchy
- **Permission Foundation**: Base for approval routing and access control
- **User Assignment**: Assign roles to users for default behaviors

### Business Value
- **Clear Hierarchy**: Establish clear reporting lines and responsibilities
- **Approval Workflows**: Enable role-based approval routing
- **Access Control**: Foundation for granular permission management
- **Scalability**: Support growing organizational complexity

## Technical Implementation

### Database Schema
```prisma
model Role {
  id               String         @id @default(uuid())
  name             String
  priorityWeight   Int            @default(0) @map("priority_weight")
  companyId        String         @map("company_id")
  createdAt        DateTime       @default(now()) @map("created_at")
  updatedAt        DateTime       @updatedAt @map("updated_at")
  
  // Relationships
  approvalRulesApp ApprovalRule[] @relation("ApproverRole")
  approvalRulesSub ApprovalRule[] @relation("SubjectRole")
  approvalSteps    ApprovalStep[]
  companiesDefault Company[]      @relation("CompanyDefaultRole")
  company          Company        @relation(fields: [companyId], references: [id], onDelete: Cascade)
  userProjects     UserProject[]
  userRoleAreas    UserRoleArea[]
  usersDefault     User[]         @relation("UserDefaultRole")
  watcherRules     WatcherRule[]

  @@unique([companyId, name])
  @@index([companyId])
  @@map("roles")
}
```

### Frontend Components

#### 1. Roles Management Page
**Location**: `app/(dashboard)/settings/roles/page.tsx`

**Features**:
- **Role Listing**: Table showing all roles with priority weights
- **Create Role**: Dialog for adding new roles
- **Edit Role**: Dialog for updating existing roles
- **Delete Role**: Dropdown menu option with confirmation
- **Usage Statistics**: Shows areas and users assigned to each role
- **Priority Weight**: Numeric display of role hierarchy level

**Interface**:
```typescript
interface Role {
  id: string
  name: string
  priorityWeight: number
  createdAt: string
  _count: {
    userRoleAreas: number
    usersDefault: number
  }
}
```

#### 2. Role Creation Form
**Schema Validation**:
```typescript
const createRoleSchema = z.object({
    name: z.string().min(1, "Role name is required"),
    priorityWeight: z.coerce.number().int().min(0, "Priority weight must be 0 or greater").default(0),
});
```

**Form Fields**:
- **Role Name**: Text input for role identifier
- **Priority Weight**: Number input (0-10+) for hierarchy level
- **Validation**: Real-time form validation with error messages

### API Implementation

#### 1. Roles API
**Location**: `app/api/roles/route.ts`

**Endpoints**:
- **GET**: Fetch all roles for the company
- **POST**: Create a new role

**GET Endpoint Features**:
- **Admin Authentication**: Only admins can view roles
- **Company Filtering**: Returns only roles for user's company
- **Usage Counts**: Includes counts of assignments
- **Priority Ordering**: Sorted by priority weight then name

**POST Endpoint Features**:
- **Name Uniqueness**: Validates no duplicate role names per company
- **Priority Validation**: Ensures valid priority weight values
- **Company Scoping**: Automatically assigns to user's company

#### 2. Individual Role API
**Location**: `app/api/roles/[id]/route.ts`

**Endpoints**:
- **PUT**: Update existing role
- **DELETE**: Delete role with usage validation

**PUT Endpoint Features**:
- **Ownership Verification**: Ensures role belongs to user's company
- **Duplicate Prevention**: Checks for name conflicts during updates
- **Selective Updates**: Allows updating name or priority independently

**DELETE Endpoint Features**:
- **Usage Validation**: Prevents deletion of roles in use
- **Comprehensive Check**: Validates against all related tables
- **Safe Deletion**: Cascades properly maintain data integrity

### Settings Integration

#### 1. Navigation Integration
**Location**: `app/(dashboard)/settings/layout.tsx:47`

```typescript
{
    title: "Roles",
    href: "/settings/roles",
    isAdmin: true,
},
```

#### 2. Sidebar Icon Mapping
**Location**: `app/(dashboard)/settings/components/settings-sidebar-v2.tsx:76`

```typescript
case "Roles":
    return Shield
```

#### 3. Access Control
- **Admin Only**: Only administrators can access role management
- **Role Guard**: `AdminGuard` component protects the entire page
- **Permission Validation**: Server-side validation on all operations

## User Experience

### Page Layout
1. **Header Section**: Title, description, and "Add Role" button
2. **Data Table**: Comprehensive role listing with all metadata
3. **Empty State**: Helpful messaging when no roles exist
4. **Action Menus**: Context-sensitive dropdown actions per role

### Interaction Patterns

#### Creating Roles
1. Click **"Add Role"** button
2. Fill **Role Name** (required)
3. Set **Priority Weight** (optional, defaults to 0)
4. Submit form → **Success toast** → Table refresh

#### Editing Roles
1. Click **more options (⋮)** → **"Edit Role"**
2. Pre-populated form with current values
3. Modify fields as needed
4. Submit form → **Success toast** → Table refresh

#### Deleting Roles
1. Click **more options (⋮)** → **"Delete Role"**
2. Confirmation dialog: `"Are you sure you want to delete role 'X'?"`
3. Confirm → **Success toast** if not in use, **Error** if in use

## Security & Access Control

### Permission Model
1. **Admin Required**: All role operations require admin privileges
2. **Company Scoping**: Users can only manage roles in their company
3. **Data Validation**: Comprehensive input sanitization and validation
4. **Usage Protection**: Prevents deletion of roles with dependencies

### API Security
```typescript
// Admin check
if (!user.isAdmin) {
    return ApiErrors.forbidden('Only admins can manage roles');
}

// Company ownership check
if (!user.companyId) {
    return ApiErrors.unauthorized('User not associated with a company');
}
```

### Database Constraints
- **Unique Names**: Role names must be unique per company
- **Referential Integrity**: Prevents deletion of roles with dependencies
- **Automatic Cascading**: Proper cleanup of related data when allowed

## Testing

### Test Scenarios

#### 1. CRUD Operations
- [ ] Create new role with valid data
- [ ] Create role with duplicate name (should fail)
- [ ] Edit role name and priority
- [ ] Edit to duplicate existing name (should fail)
- [ ] Delete unused role
- [ ] Delete role in use (should fail)

#### 2. Permission Testing
- [ ] Non-admin user access (should fail)
- [ ] Admin from different company (should fail)
- [ ] Valid admin access (should succeed)

#### 3. Edge Cases
- [ ] Empty role name submission
- [ ] Negative priority weight values
- [ ] Maximum valid priority weight values
- [ ] Special characters in role names

#### 4. UI Testing
- [ ] Form validation error display
- [ ] Success/error toast notifications
- [ ] Table sorting and pagination
- [ ] Responsive design on mobile

### Performance Considerations
- **Efficient Queries**: Optimized database queries with proper indexing
- **Minimal State**: Only necessary client-side state management
- **Caching**: Appropriate cache invalidation on changes

## Troubleshooting

### Common Issues

#### 1. "Role creation fails"
**Causes**: 
- Duplicate role name in company
- Invalid priority weight value
- User not admin

**Solutions**:
- Check existing role names
- Validate priority weight (>= 0)
- Verify admin privileges

#### 2. "Cannot delete role"
**Causes**: Role is assigned to users or used in workflows

**Solutions**:
- Reassign users to different roles
- Remove role from approval rules
- Update default company role

#### 3. "Changes not reflecting"
**Causes**: Cache issues or permission problems

**Solutions**:
- Clear browser cache
- Verify admin status
- Check network requests for errors

### Debug Steps
1. **Check Console**: Look for JavaScript errors
2. **Network Tab**: Verify API requests/responses
3. **Admin Status**: Confirm user has admin privileges
4. **Company Data**: Verify role exists in database
5. **API Logs**: Check server-side error logs

## API Response Examples

### Success Responses
```json
// GET /api/roles
{
  "success": true,
  "data": [
    {
      "id": "role-uuid",
      "name": "Manager",
      "priorityWeight": 8,
      "createdAt": "2026-01-30T10:00:00Z",
      "_count": {
        "userRoleAreas": 3,
        "usersDefault": 5
      }
    }
  ]
}

// POST /api/roles
{
  "success": true,
  "data": {
    "id": "new-role-uuid",
    "name": "Developer",
    "priorityWeight": 5,
    "companyId": "company-uuid",
    "createdAt": "2026-01-30T10:00:00Z",
    "updatedAt": "2026-01-30T10:00:00Z"
  }
}
```

### Error Responses
```json
// Validation Error
{
  "success": false,
  "error": {
    "message": "Invalid role data",
    "details": [
      {
        "field": "name",
        "message": "Role name is required",
        "code": "VALIDATION_ERROR"
      }
    ]
  }
}

// Duplicate Name Error
{
  "success": false,
  "error": {
    "message": "Role with this name already exists"
  }
}

// Permission Error
{
  "success": false,
  "error": {
    "message": "Only admins can manage roles"
  }
}

// Delete Prevention Error
{
  "success": false,
  "error": {
    "message": "Cannot delete role that is in use"
  }
}
```

## Future Enhancements

### Potential Improvements
1. **Bulk Operations**: Create/edit/delete multiple roles at once
2. **Role Templates**: Pre-configured role definitions for quick setup
3. **Permission Matrix**: Visual permission assignment per role
4. **Role Hierarchy**: Parent-child role relationships
5. **Audit Trail**: Track role creation/modification/deletion history
6. **Import/Export**: Bulk role management via CSV/Excel

### Integration Opportunities
- **User Management**: Default role assignment in user creation
- **Approval Workflows**: Role-based approval routing
- **Area Management**: Role-area permission assignments
- **Reporting**: Role usage statistics and analytics

---

**Last Updated**: January 30, 2026  
**Version**: 1.0  
**Maintainer**: Development Team