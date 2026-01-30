# Invite-Only User Provisioning Workflow

**Version:** v1  
**Date:** 2026-01-30  
**Purpose:** Complete guide for admin-only user creation in the TimeOff Management System

## 🎯 Overview

The TimeOff Management System uses an **invite-only model** for user provisioning:

- **Admin users** can create new accounts via the admin interface
- **New users** are created with temporary passwords
- **First-time login** requires password change
- **Google OAuth** can be linked after initial setup
- **Self-registration** is disabled for security

## 👥 Administrator User Creation

### 1. Access User Management

1. **Navigate to Admin Users**
   ```
   URL: /admin/users
   Requires: Admin role
   ```

2. **Create New User Form**
   ```typescript
   Required Fields:
   - Email (unique)
   - First Name
   - Last Name
   - Department
   - Role
   - Contract Type
   - Start Date
   - Country
   
   Optional Fields:
   - End Date (for contracts)
   - Default Role
   ```

### 2. User Creation Process

1. **Fill User Information**
   ```
   Email: user@company.com
   Name: John
   Last Name: Doe
   Department: Engineering
   Role: Software Developer
   Contract Type: FULL_TIME
   Start Date: 2024-01-15
   Country: US
   ```

2. **System Actions**
   ```typescript
   Backend Process:
   1. Validates email uniqueness
   2. Creates user with temporary password
   3. Sets company association
   4. Sets department and default role
   5. Sends welcome notification (optional)
   
   Security Measures:
   - Email verification (if enabled)
   - Password requirements enforcement
   - Audit logging for creation
   ```

### 3. Temporary Password Policy

New users are created with system-generated passwords:

```typescript
// Default temporary password format
const defaultPassword = generateSecurePassword();
// Requirements: 12+ characters, mixed case, numbers, symbols

// Example output
// Temporary password: "xK9#mP2$vQ5"
// Sent to admin for secure transfer
```

## 🔐 First-Time User Login

### 1. Initial Authentication

1. **User Receives Credentials**
   ```
   Email: user@company.com
   Temporary Password: xK9#mP2$vQ5
   Expiration: 72 hours from creation
   ```

2. **Login Process**
   ```
   Step 1: Navigate to /login
   Step 2: Enter email and temporary password
   Step 3: Click "Sign In"
   Step 4: System validates credentials
   Step 5: User is redirected to dashboard
   ```

### 2. Password Reset Requirement

The system enforces password change on first login:

```typescript
// Frontend Logic
if (user.isFirstLogin) {
  showPasswordChangeModal();
}

// Backend Validation
await validatePasswordRequirements(newPassword);
await updateUserPassword(userId, hashedNewPassword);
await logAuditEvent(userId, 'PASSWORD_CHANGED');
await sendNotification(userId, 'PASSWORD_RESET_SUCCESS');
```

### 3. Password Requirements

New passwords must meet security requirements:

```
Minimum Length: 12 characters
Required: At least one uppercase letter
Required: At least one lowercase letter  
Required: At least one number
Required: At least one special character
Cannot: Be the same as previous 3 passwords
Cannot: Include user's name or email
```

## 🔗 Google OAuth Integration

### Post-Setup OAuth Linking

After initial login and password change, users can link Google OAuth:

1. **User Navigates to Profile**
   ```
   URL: /profile
   Section: Account Settings
   ```

2. **Link Google Account**
   ```typescript
   Process:
   1. Click "Link Google Account"
   2. Redirect to Google OAuth
   3. User authenticates with Google
   4. System creates Account record
   5. User can now sign in with Google
   ```

### OAuth Account Creation

```typescript
// Auth.js Session Callback
async signIn({ user, account }) {
  if (account?.provider === "google") {
    // Create Account record
    await prisma.account.create({
      data: {
        userId: user.id,
        type: "oauth",
        provider: "google",
        providerAccountId: account.providerAccountId,
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        expires_at: account.expires_at,
      }
    });
    
    // Update user record
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // OAuth data populated
      }
    });
    
    return true;
  }
}
```

## 🛡️ Security Controls

### Admin Privileges

Only users with `isAdmin: true` can:

```typescript
const adminPrivileges = [
  'CREATE_USER',
  'DELETE_USER', 
  'MODIFY_USER_ROLE',
  'SET_COMPANY_SETTINGS',
  'VIEW_ALL_USERS',
  'MANAGE_DEPARTMENTS',
  'OVERRIDE_WORKFLOW_RULES'
];
```

### Audit Trail

All user management actions are logged:

```typescript
// Audit Log Entry
await prisma.audit.create({
  data: {
    entityType: 'USER',
    entityId: userId,
    attribute: 'USER_CREATED',
    oldValue: null,
    newValue: JSON.stringify(userData),
    companyId: adminUser.companyId,
    byUserId: adminUser.id
  }
});
```

### Access Revocation

Administrators can immediately revoke access:

1. **Session Deletion**
   ```
   Method: npx prisma studio → Sessions table
   Action: Delete user's active session records
   Effect: Immediate logout required
   ```

2. **Account Deactivation**
   ```
   Method: User management interface
   Action: Set activated: false
   Effect: Prevents all future login attempts
   ```

## 🔄 User Lifecycle Management

### Contract-Based Access

```typescript
// Auth.js Sign-in Validation
async signIn({ user, account }) {
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email }
  });
  
  // Contract validation
  if (dbUser.endDate && new Date(dbUser.endDate) < new Date()) {
    return false; // Block login for expired contracts
  }
  
  if (!dbUser.activated) {
    return false; // Block login for deactivated accounts
  }
  
  return true;
}
```

### Role-Based Access

```typescript
// RBAC Functions
export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.isAdmin ?? false;
}

export async function canManageUser(targetUserId: string) {
  const currentUser = await getCurrentUser();
  
  // Admins can manage anyone
  if (currentUser.isAdmin) return true;
  
  // Users can manage themselves
  if (currentUser.id === targetUserId) return true;
  
  return false;
}
```

## 📧 Administrative Functions

### Bulk User Operations

Administrators can perform batch operations:

```typescript
// Bulk User Creation
await createMultipleUsers(userDataArray);

// Bulk Role Updates
await updateMultipleUserRoles(userIds, newRole);

// Bulk Department Assignment
await assignUsersToDepartment(userIds, departmentId);
```

### User Data Import

```typescript
// CSV Import Process
1. Parse CSV file
2. Validate required fields
3. Check for duplicates
4. Create users with temporary passwords
5. Send welcome emails with credentials
6. Log import summary
```

## 🔍 User Status Management

### Account States

```typescript
const userStates = {
  ACTIVE: 'activated: true',
  INACTIVE: 'activated: false', 
  PENDING: 'activated: true, emailVerified: false',
  EXPIRED: 'endDate < currentDate',
  SUSPENDED: 'suspended: true'
};
```

### Status Transitions

```typescript
// Valid state transitions
const allowedTransitions = {
  'PENDING → ACTIVE': 'emailVerification',
  'ACTIVE → INACTIVE': 'adminDeactivation',
  'ACTIVE → EXPIRED': 'automaticExpiration',
  'INACTIVE → ACTIVE': 'adminReactivation'
};
```

## 📊 Reporting and Analytics

### User Metrics

Administrators can view user statistics:

```typescript
const userMetrics = {
  totalUsers: await prisma.user.count(),
  activeUsers: await prisma.user.count({ where: { activated: true } }),
  adminUsers: await prisma.user.count({ where: { isAdmin: true } }),
  usersByDepartment: await getUsersByDepartment(),
  recentLogins: await getRecentLoginActivity(),
  contractExpirations: await getUpcomingContractExpirations()
};
```

### Export Capabilities

```typescript
// Export Formats
const exportOptions = {
  CSV: 'Export all users to CSV',
  PDF: 'Generate user directory PDF',
  EXCEL: 'Export to Excel format'
};
```

## 🚀 API Endpoints for User Management

### Core User Operations

```typescript
// Create User
POST /api/users
{
  email: string;
  name: string;
  lastname: string;
  departmentId: string;
  defaultRoleId: string;
  contractType: string;
  startDate: Date;
  endDate?: Date;
  country: string;
}

// Update User  
PUT /api/users/[id]
{
  // All user fields except email and companyId
}

// Delete User
DELETE /api/users/[id]
// Soft delete: sets deletedAt timestamp

// Get Users
GET /api/users
// Supports: filtering, pagination, search
```

### Administrative Endpoints

```typescript
// Get Audit Log
GET /api/audit
// Filters: userId, entityType, dateRange

// Bulk Operations
POST /api/users/bulk
// Create, update, delete multiple users

// Role Management
PUT /api/users/[id]/role
POST /api/users/[id]/departments
```

## 🔧 Configuration Options

### Security Policies

```typescript
// Security Settings
const securityPolicies = {
  passwordMinLength: 12,
  passwordComplexity: true,
  sessionTimeout: '30 days',
  maxLoginAttempts: 5,
  lockoutDuration: '15 minutes',
  requireEmailVerification: true,
  enableTwoFactorAuth: false // Future feature
};
```

### Email Templates

```typescript
// Welcome Email
const welcomeEmail = {
  subject: 'Welcome to TimeOff Management',
  template: 'WELCOME_WITH_TEMP_PASSWORD',
  variables: ['userName', 'tempPassword', 'loginUrl', 'expiryHours']
};

// Password Changed
const passwordChangedEmail = {
  subject: 'Your Password Has Been Changed',
  template: 'PASSWORD_CHANGE_CONFIRMATION',
  variables: ['userName', 'changeTime', 'ipAddress']
};
```

## 🛠️ Troubleshooting

### Common Issues

#### User Cannot Reset Password
```
Problem: User doesn't see password change option
Solution:
1. Verify user is logged in correctly
2. Check if forcePasswordReset flag is set
3. Ensure browser cookies are enabled
4. Try clearing browser cache
```

#### OAuth Linking Fails
```
Problem: "Account already linked" error
Solution:
1. Check if Google account is already linked to another user
2. Verify Google OAuth configuration
3. Contact administrator to unlink existing account
4. Ensure redirect URIs match exactly
```

#### Admin Cannot Create Users
```
Problem: Create user button disabled or error
Solution:
1. Verify admin has isAdmin: true
2. Check department exists
3. Validate all required fields are filled
4. Check browser console for JavaScript errors
5. Review server logs for detailed error messages
```

### Debug Tools

```typescript
// User Creation Debugging
console.log('User creation attempt:', userData);
console.log('Validation results:', validationResult);
console.log('Database response:', dbResponse);

// Session Debugging  
console.log('Current session:', await auth());
console.log('User permissions:', await getCurrentUser());
```

---

**Next Steps:**
- Train administrators on the invite-only workflow
- Set up automated user provisioning (if needed)
- Configure email templates and delivery
- Establish user management SLAs and policies
- Implement regular security audits