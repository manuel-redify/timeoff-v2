# PRD | Auth Migration to Auth.js - FINAL VERSION

**Document Version:** 2.0 (Final for AI Agent Implementation)  
**Created by:** Manuel Magnani  
**Last Updated:** January 27, 2026  
**Project:** Timeoff v2  
**Approved for Implementation:** Yes

---

## Executive Summary

Migrate the Timeoff application's authentication system from **Clerk** to **Auth.js (v5)** to establish the **Neon Database as the single source of truth** and resolve data synchronization issues.

**Key Objectives:**
1. Remove dependency on Clerk third-party service
2. Implement invite-only user provisioning (no public signup)
3. Enable flexible authentication: Credentials (dev) + OAuth (prod)
4. Ensure immediate access revocation via database session strategy
5. Maintain multi-tenancy security (company isolation)

**Stack:** Next.js 14+ (App Router), Tailwind CSS, Prisma ORM, Neon PostgreSQL, Auth.js v5

---

## 1. Context & Requirements

### 1.1 Current State
- **Auth Provider:** Clerk (external service)
- **Problem:** Data synchronization issues between Clerk and Neon DB
- **User Creation:** Currently possible via Clerk UI (needs restriction)

### 1.2 Target State
- **Auth Provider:** Auth.js (self-hosted, open-source)
- **Single Source of Truth:** Neon Database
- **User Creation:** Admin-only via internal form (invite-based)

### 1.3 Environment-Specific Behavior

| Feature | Development | Production |
|---------|-------------|------------|
| **Email/Password Login** | ✅ Enabled | ❌ Disabled |
| **Google OAuth** | ⚙️ Toggleable via env var | ✅ Always Enabled |
| **User Signup** | ❌ Disabled | ❌ Disabled |
| **Access Control** | Database Strategy | Database Strategy |

### 1.4 Critical Constraints
- **Cost:** Solution must be free/open-source
- **Security:** Multi-tenant isolation (users only see their company's data)
- **Compliance:** Immediate access revocation on deactivation/termination
- **Extensibility:** OAuth provider system must support future additions (MS, etc.)

---

## 2. Database Schema Updates

### 2.1 Current Schema Analysis

**Existing User Model Fields (to retain):**
- `id`, `email`, `name`, `lastname`
- `companyId` (foreign key - CRITICAL for tenancy)
- `departmentId` (nullable)
- `startDate`, `endDate` (termination date)
- `country`, `contractType`
- `activated` (boolean flag)
- `isAdmin`, `isAutoApprove`
- `defaultRoleId` (nullable - primary role reference)
- `createdAt`, `updatedAt`, `deletedAt`

**Fields to REMOVE:**
- ❌ `clerkId` (no longer needed)

**Related Tables:**
- `UserRoleArea` (many-to-many: User ↔ Role ↔ Area)
- `Company`, `Department`, `Role`, `Area`
- `Audit`, `EmailAudit`

### 2.2 Prisma Schema Changes

#### A. Update User Model

Add Auth.js required fields to existing User model:

```prisma
model User {
  id                      String                    @id @default(uuid())
  // REMOVE: clerkId field entirely
  
  email                   String                    @unique
  name                    String
  lastname                String
  
  // AUTH.JS ADDITIONS (add these 4 fields)
  password                String?                   // Nullable: used only in dev for credentials
  image                   String?                   // OAuth provider avatar URL
  emailVerified           DateTime?                 // Required by Auth.js adapter
  
  companyId               String                    @map("company_id")
  departmentId            String?                   @map("department_id")
  startDate               DateTime                  @default(now()) @map("start_date") @db.Date
  endDate                 DateTime?                 @map("end_date") @db.Date
  country                 String?                   @db.Char(2)
  contractType            String                    @default("Employee") @map("contract_type")
  activated               Boolean                   @default(true)
  isAdmin                 Boolean                   @default(false) @map("is_admin")
  isAutoApprove           Boolean                   @default(false) @map("is_auto_approve")
  defaultRoleId           String?                   @map("default_role_id")
  createdAt               DateTime                  @default(now()) @map("created_at")
  updatedAt               DateTime                  @updatedAt @map("updated_at")
  deletedAt               DateTime?                 @map("deleted_at")
  icalFeedToken           String                    @unique @default(uuid()) @map("ical_feed_token")
  
  // AUTH.JS RELATIONS (add these 2)
  accounts                Account[]
  sessions                Session[]
  
  // Existing relations (keep all)
  delegateDelegations     ApprovalDelegation[]      @relation("DelegateDelegations")
  supervisorDelegations   ApprovalDelegation[]      @relation("SupervisorDelegations")
  approvalSteps           ApprovalStep[]
  auditLogs               Audit[]
  comments                Comment[]
  supervisedDepartments   DepartmentSupervisor[]
  managedDepartments      Department[]              @relation("DepartmentBoss")
  emailAudits             EmailAudit[]
  approvedLeaves          LeaveRequest[]            @relation("ApproverLeaves")
  leaveRequests           LeaveRequest[]            @relation("UserLeaves")
  notificationPreferences NotificationPreference[]
  notifications           Notification[]
  schedules               Schedule[]
  allowanceAdjustments    UserAllowanceAdjustment[]
  feeds                   UserFeed[]
  projects                UserProject[]
  roleAreas               UserRoleArea[]
  company                 Company                   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  defaultRole             Role?                     @relation("UserDefaultRole", fields: [defaultRoleId], references: [id])
  department              Department?               @relation(fields: [departmentId], references: [id])
  teams                   Team[]                    @relation("UserTeams")

  @@index([email])
  @@index([companyId])
  @@index([departmentId])
  @@index([lastname])
  @@index([deletedAt])
  @@map("users")
}
```

#### B. Add Auth.js Adapter Models

Add these three models required by `@auth/prisma-adapter`:

```prisma
model Account {
  id                String  @id @default(uuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}
```

### 2.3 Role Assignment Strategy

**Dual-Track Approach:**

1. **defaultRoleId:** Stores the user's primary/main role
   - Used for quick role checks
   - Set during user creation
   - Single value (nullable)

2. **UserRoleArea:** Stores all role-area assignments
   - Supports multiple roles per user
   - Links User ↔ Role ↔ Area
   - Used for complex permission checks

**On User Creation:**
```typescript
// 1. Create User with defaultRoleId
const user = await prisma.user.create({
  data: {
    email, name, lastname,
    companyId,
    defaultRoleId: primaryRoleId, // Set primary role
    // ... other fields
  }
});

// 2. Create initial UserRoleArea record
await prisma.userRoleArea.create({
  data: {
    userId: user.id,
    roleId: primaryRoleId,
    areaId: primaryAreaId
  }
});
```

### 2.4 Migration Execution

```bash
# Generate migration
npx prisma migrate dev --name auth_js_migration

# Expected changes:
# - DROP COLUMN "clerk_id" FROM users
# - ADD COLUMN "password" VARCHAR(255) NULL
# - ADD COLUMN "image" VARCHAR(255) NULL
# - ADD COLUMN "email_verified" TIMESTAMP NULL
# - CREATE TABLE "accounts" (...)
# - CREATE TABLE "sessions" (...)
# - CREATE TABLE "verification_tokens" (...)
```

---

## 3. Authentication Configuration

### 3.1 Environment Variables

Create/update `.env` and `.env.local`:

```bash
# ============================================
# AUTH.JS CORE
# ============================================
# Generate with: openssl rand -base64 33
AUTH_SECRET="your-generated-32-char-secret-here"

# Google OAuth Credentials (from Google Cloud Console)
AUTH_GOOGLE_ID="123456789-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-xxxxxxxxxxxxxxxxxxxx"

# ============================================
# APPLICATION LOGIC
# ============================================
# Development: Password for credential-created users
DEV_DEFAULT_PASSWORD="Welcome2024!"

# Development: Enable/disable OAuth in dev environment
# "true" = OAuth works in dev | "false" = OAuth blocked in dev
ENABLE_OAUTH_IN_DEV="false"

# Auto-managed by Next.js (DO NOT set manually)
# NODE_ENV="development" | "production"

# ============================================
# EMAIL SERVICE (RESEND)
# ============================================
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"

# ============================================
# SEED SCRIPT (First-time setup)
# ============================================
SEED_ADMIN_EMAIL="admin@acmecorp.com"
SEED_ADMIN_NAME="Admin"
SEED_ADMIN_PASSWORD="ChangeMe123!"
SEED_COMPANY_NAME="ACME Corp"

# ============================================
# DATABASE (Already configured)
# ============================================
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
```

### 3.2 Google OAuth Setup

**Google Cloud Console Configuration:**

1. Navigate to: https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID (Web Application)
3. Configure:

**Authorized Redirect URIs:**
```
http://localhost:3000/api/auth/callback/google
https://[YOUR-PRODUCTION-DOMAIN]/api/auth/callback/google
```

**Authorized JavaScript Origins:**
```
http://localhost:3000
https://[YOUR-PRODUCTION-DOMAIN]
```

4. Copy Client ID → `AUTH_GOOGLE_ID`
5. Copy Client Secret → `AUTH_GOOGLE_SECRET`

### 3.3 Auth.js Configuration (`auth.ts`)

Create `auth.ts` (or `lib/auth.ts`):

```typescript
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  
  // CRITICAL: Use database strategy for immediate revocation
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,   // Update every 24 hours
  },

  providers: [
    // Provider 1: Google OAuth (Prod + Dev toggleable)
    ...(process.env.NODE_ENV === "production" || process.env.ENABLE_OAUTH_IN_DEV === "true"
      ? [
          GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            authorization: {
              params: {
                prompt: "consent",
                access_type: "offline",
                response_type: "code",
              },
            },
          }),
        ]
      : []),

    // Provider 2: Credentials (Dev ONLY)
    ...(process.env.NODE_ENV === "development"
      ? [
          CredentialsProvider({
            name: "Email and Password",
            credentials: {
              email: { label: "Email", type: "email" },
              password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
              if (!credentials?.email || !credentials?.password) {
                return null;
              }

              const user = await prisma.user.findUnique({
                where: { email: credentials.email },
                include: { company: true },
              });

              if (!user || !user.password) {
                return null;
              }

              const isValid = await bcrypt.compare(
                credentials.password,
                user.password
              );

              if (!isValid) {
                return null;
              }

              // Note: Additional checks (activated, endDate) 
              // are handled in the signIn callback below
              return {
                id: user.id,
                email: user.email,
                name: `${user.name} ${user.lastname}`,
                image: user.image,
              };
            },
          }),
        ]
      : []),
  ],

  callbacks: {
    // CRITICAL SECURITY GATE: Runs for ALL providers
    async signIn({ user, account }) {
      try {
        // Fetch full user record from database
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { company: true },
        });

        // ==========================================
        // CHECK 1: User must exist in database
        // ==========================================
        if (!dbUser) {
          console.error(`[Auth] User not found: ${user.email}`);
          return false; // Deny login
        }

        // ==========================================
        // CHECK 2: User must be activated
        // ==========================================
        if (!dbUser.activated) {
          console.error(`[Auth] User deactivated: ${user.email}`);
          return false; // Deny login
        }

        // ==========================================
        // CHECK 3: Contract termination date check
        // ==========================================
        if (dbUser.endDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const endDate = new Date(dbUser.endDate);
          endDate.setHours(0, 0, 0, 0);

          if (endDate < today) {
            console.error(`[Auth] Contract terminated: ${user.email}`);
            return false; // Deny login
          }
        }

        // ==========================================
        // OAUTH ACCOUNT LINKING
        // ==========================================
        if (account && account.provider !== "credentials") {
          // Check if this OAuth account is already linked
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
          });

          // If not linked, link it now
          if (!existingAccount) {
            await prisma.account.create({
              data: {
                userId: dbUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              },
            });
          }
        }

        return true; // Allow login

      } catch (error) {
        console.error("[Auth] signIn callback error:", error);
        return false;
      }
    },

    // Extend session with custom fields
    async session({ session, user }) {
      if (session.user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            companyId: true,
            isAdmin: true,
            name: true,
            lastname: true,
          },
        });

        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.companyId = dbUser.companyId;
          session.user.isAdmin = dbUser.isAdmin;
          session.user.name = `${dbUser.name} ${dbUser.lastname}`;
        }
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  debug: process.env.NODE_ENV === "development",
});
```

### 3.4 TypeScript Type Extensions

Create `types/next-auth.d.ts`:

```typescript
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      companyId: string;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    companyId: string;
    isAdmin: boolean;
  }
}
```

### 3.5 Middleware for Route Protection

Create `middleware.ts` in root:

```typescript
export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/actions/:path*",
  ],
};
```

---

## 4. User Management Features

### 4.1 Admin: Create User Action

Create `lib/actions/user.ts` (or similar):

```typescript
"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/resend";

const prisma = new PrismaClient();

export async function createUser(formData: {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  contractType: string;
  departmentId: string;
  roleId: string;      // Primary role
  areaId: string;      // Primary area
  isAdmin: boolean;
  endDate?: string;    // Optional termination date
}) {
  // ==========================================
  // STEP 1: Authentication & Authorization
  // ==========================================
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("Unauthorized: No session found");
  }

  if (!session.user.isAdmin) {
    throw new Error("Forbidden: Admin privileges required");
  }

  // CRITICAL: Extract companyId from session (NOT from form)
  const adminCompanyId = session.user.companyId;

  // ==========================================
  // STEP 2: Validation
  // ==========================================
  const existingUser = await prisma.user.findUnique({
    where: { email: formData.email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Validate role and area belong to admin's company
  const [role, area, department] = await Promise.all([
    prisma.role.findFirst({
      where: { id: formData.roleId, companyId: adminCompanyId },
    }),
    prisma.area.findFirst({
      where: { id: formData.areaId, companyId: adminCompanyId },
    }),
    prisma.department.findFirst({
      where: { id: formData.departmentId, companyId: adminCompanyId },
    }),
  ]);

  if (!role || !area || !department) {
    throw new Error("Invalid role, area, or department");
  }

  // ==========================================
  // STEP 3: Password Handling
  // ==========================================
  let hashedPassword: string | null = null;

  if (process.env.NODE_ENV === "development") {
    const defaultPassword = process.env.DEV_DEFAULT_PASSWORD || "Welcome2024!";
    hashedPassword = await bcrypt.hash(defaultPassword, 12);
  }
  // In production, password remains null (OAuth only)

  // ==========================================
  // STEP 4: Database Transaction
  // ==========================================
  const newUser = await prisma.$transaction(async (tx) => {
    // 4a. Create User
    const user = await tx.user.create({
      data: {
        email: formData.email,
        name: formData.firstName,
        lastname: formData.lastName,
        password: hashedPassword,
        companyId: adminCompanyId,
        departmentId: formData.departmentId,
        defaultRoleId: formData.roleId,
        country: formData.country,
        contractType: formData.contractType,
        isAdmin: formData.isAdmin,
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        activated: true,
      },
    });

    // 4b. Create UserRoleArea (primary assignment)
    await tx.userRoleArea.create({
      data: {
        userId: user.id,
        roleId: formData.roleId,
        areaId: formData.areaId,
      },
    });

    // 4c. Create Audit Log
    await tx.audit.create({
      data: {
        entityType: "USER",
        entityId: user.id,
        attribute: "created",
        oldValue: null,
        newValue: JSON.stringify({
          email: user.email,
          name: `${user.name} ${user.lastname}`,
        }),
        companyId: adminCompanyId,
        byUserId: session.user.id,
      },
    });

    return user;
  });

  // ==========================================
  // STEP 5: Send Welcome Email
  // ==========================================
  try {
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`;
    
    await sendWelcomeEmail({
      to: newUser.email,
      name: newUser.name,
      loginUrl,
      isProduction: process.env.NODE_ENV === "production",
    });

    // Log email send
    await prisma.emailAudit.create({
      data: {
        email: newUser.email,
        subject: "Welcome to Timeoff",
        body: `Welcome email sent to ${newUser.name}`,
        userId: newUser.id,
        companyId: adminCompanyId,
      },
    });
  } catch (emailError) {
    console.error("[createUser] Email send failed:", emailError);
    // Don't fail the entire operation if email fails
  }

  return {
    success: true,
    userId: newUser.id,
    message: "User created successfully",
  };
}
```

### 4.2 Email Service Integration

Update/create `lib/resend.ts`:

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail({
  to,
  name,
  loginUrl,
  isProduction,
}: {
  to: string;
  name: string;
  loginUrl: string;
  isProduction: boolean;
}) {
  const subject = "Welcome to Timeoff - ACME Corp";

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background-color: #f9fafb; }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background-color: #4F46E5; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Timeoff!</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>You have been invited to join ACME Corp's Timeoff management system.</p>
            
            ${
              isProduction
                ? `<p><strong>Login Instructions:</strong> Click the button below and sign in with your Google Workspace account (@acmecorp.com).</p>`
                : `<p><strong>Login Instructions:</strong> Click the button below and use your email address with the temporary password provided by your administrator.</p>`
            }
            
            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Access Timeoff</a>
            </div>
            
            <p>If you have any questions, please contact your administrator.</p>
            
            <p>Best regards,<br>The Timeoff Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textBody = `
Hello ${name},

You have been invited to join ACME Corp's Timeoff management system.

${isProduction ? "Login with your Google Workspace account:" : "Login with your email and the temporary password provided by your administrator:"}

${loginUrl}

If you have any questions, please contact your administrator.

Best regards,
The Timeoff Team
  `;

  await resend.emails.send({
    from: "Timeoff <noreply@yourdomain.com>", // Update with your verified domain
    to,
    subject,
    html: htmlBody,
    text: textBody,
  });
}
```

### 4.3 Admin UI: User Creation Form

Create form component with these requirements:

**Form Fields:**
- First Name (text, required)
- Last Name (text, required)
- Email (email, required)
- Country (select, required) - Fetch from existing data or use ISO codes
- Contract Type (select, required) - Options: Employee, Contractor, Intern
- Department (select, required) - Fetch from `prisma.department` WHERE `companyId = session.user.companyId`
- Role (select, required) - Fetch from `prisma.role` WHERE `companyId = session.user.companyId`
- Area (select, required) - Fetch from `prisma.area` WHERE `companyId = session.user.companyId`
- Admin Privileges (checkbox, default: false)
- Termination Date (date, optional)

**Client-Side Validation:**
- Email format validation
- All required fields completed
- Termination date must be future date or blank

**Server Action Call:**
```typescript
const result = await createUser(formData);
if (result.success) {
  // Show success message
  // Redirect to user list or reset form
}
```

### 4.4 User Deactivation (Offboarding)

Create `lib/actions/user.ts` (add to existing file):

```typescript
export async function deactivateUser(userId: string) {
  const session = await auth();
  
  if (!session?.user?.isAdmin) {
    throw new Error("Unauthorized");
  }

  const adminCompanyId = session.user.companyId;

  // Verify user belongs to admin's company
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId: adminCompanyId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  await prisma.$transaction(async (tx) => {
    // Deactivate user
    await tx.user.update({
      where: { id: userId },
      data: { activated: false },
    });

    // Audit log
    await tx.audit.create({
      data: {
        entityType: "USER",
        entityId: userId,
        attribute: "activated",
        oldValue: "true",
        newValue: "false",
        companyId: adminCompanyId,
        byUserId: session.user.id,
      },
    });

    // Immediately revoke all active sessions
    await tx.session.deleteMany({
      where: { userId },
    });
  });

  return { success: true };
}
```

---

## 5. First-Time Setup: Seed Script

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ==========================================
  // STEP 1: Load environment variables
  // ==========================================
  const SEED_COMPANY_NAME = process.env.SEED_COMPANY_NAME || "ACME Corp";
  const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
  const SEED_ADMIN_NAME = process.env.SEED_ADMIN_NAME || "Admin";
  const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

  if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
    throw new Error(
      "Missing required seed environment variables: SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD"
    );
  }

  // ==========================================
  // STEP 2: Check/Create Company
  // ==========================================
  let company = await prisma.company.findFirst({
    where: { name: SEED_COMPANY_NAME },
  });

  if (!company) {
    console.log(`📦 Creating company: ${SEED_COMPANY_NAME}`);
    company = await prisma.company.create({
      data: {
        name: SEED_COMPANY_NAME,
        country: "US", // Default, update as needed
        timezone: "America/New_York",
        dateFormat: "YYYY-MM-DD",
      },
    });
  } else {
    console.log(`✅ Company already exists: ${SEED_COMPANY_NAME}`);
  }

  // ==========================================
  // STEP 3: Check/Create Admin User
  // ==========================================
  let adminUser = await prisma.user.findUnique({
    where: { email: SEED_ADMIN_EMAIL },
  });

  if (!adminUser) {
    console.log(`👤 Creating admin user: ${SEED_ADMIN_EMAIL}`);
    
    const hashedPassword = await bcrypt.hash(SEED_ADMIN_PASSWORD, 12);

    adminUser = await prisma.user.create({
      data: {
        email: SEED_ADMIN_EMAIL,
        name: SEED_ADMIN_NAME,
        lastname: "User",
        password: hashedPassword,
        emailVerified: new Date(), // Mark as verified
        companyId: company.id,
        isAdmin: true,
        activated: true,
        country: "US",
        contractType: "Employee",
      },
    });

    console.log(`✅ Admin user created successfully`);
  } else {
    console.log(`✅ Admin user already exists: ${SEED_ADMIN_EMAIL}`);
  }

  // ==========================================
  // STEP 4: Create Default Role & Area (Optional)
  // ==========================================
  let defaultRole = await prisma.role.findFirst({
    where: { companyId: company.id, name: "Employee" },
  });

  if (!defaultRole) {
    console.log("📋 Creating default role: Employee");
    defaultRole = await prisma.role.create({
      data: {
        name: "Employee",
        priorityWeight: 0,
        companyId: company.id,
      },
    });
  }

  let defaultArea = await prisma.area.findFirst({
    where: { companyId: company.id, name: "General" },
  });

  if (!defaultArea) {
    console.log("🗂️ Creating default area: General");
    defaultArea = await prisma.area.create({
      data: {
        name: "General",
        companyId: company.id,
      },
    });
  }

  // Link admin to default role/area
  const existingRoleArea = await prisma.userRoleArea.findFirst({
    where: { userId: adminUser.id },
  });

  if (!existingRoleArea) {
    console.log("🔗 Linking admin to default role and area");
    await prisma.userRoleArea.create({
      data: {
        userId: adminUser.id,
        roleId: defaultRole.id,
        areaId: defaultArea.id,
      },
    });
  }

  console.log("🎉 Seed completed successfully!");
  console.log(`
  ==========================================
  📝 SEED SUMMARY
  ==========================================
  Company: ${company.name}
  Admin Email: ${adminUser.email}
  Admin Password: ${SEED_ADMIN_PASSWORD}
  
  🔐 You can now login at /login
  ==========================================
  `);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Update `package.json`:**

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

**Run seed:**
```bash
npx prisma db seed
```

---

## 6. Login Page Implementation

Update `app/login/page.tsx`:

```tsx
import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await auth();
  
  if (session) {
    redirect("/dashboard");
  }

  const isProduction = process.env.NODE_ENV === "production";
  const showCredentials = !isProduction;
  const showOAuth = isProduction || process.env.ENABLE_OAUTH_IN_DEV === "true";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Timeoff</h2>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        {searchParams.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {getErrorMessage(searchParams.error)}
          </div>
        )}

        <div className="space-y-4">
          {/* OAuth Providers */}
          {showOAuth && (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
            >
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  {/* Google Icon SVG */}
                </svg>
                Continue with Google
              </button>
            </form>
          )}

          {/* Credentials Form (Dev Only) */}
          {showCredentials && (
            <>
              {showOAuth && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>
              )}

              <form
                action={async (formData: FormData) => {
                  "use server";
                  await signIn("credentials", {
                    email: formData.get("email") as string,
                    password: formData.get("password") as string,
                    redirectTo: "/dashboard",
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Sign in
                </button>
              </form>

              <p className="text-xs text-center text-amber-600 bg-amber-50 p-2 rounded">
                🔧 Development Mode: OAuth {showOAuth ? "enabled" : "disabled"}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getErrorMessage(error: string): string {
  switch (error) {
    case "OAuthAccountNotLinked":
      return "Your email is not registered. Please contact your administrator.";
    case "CredentialsSignin":
      return "Invalid email or password.";
    default:
      return "An error occurred. Please try again.";
  }
}
```

---

## 7. Security Considerations

### 7.1 Session Strategy Rationale

**Why Database Strategy:**
- ✅ Immediate revocation on `activated = false`
- ✅ Immediate revocation on `endDate` change
- ✅ No waiting for JWT expiration
- ✅ Compliance with data protection requirements

**Trade-off:**
- ⚠️ One additional DB query per authenticated request
- ✅ Acceptable for HR/timeoff management use case

### 7.2 CSRF Protection

Auth.js automatically handles CSRF protection via:
- `AUTH_SECRET` for token signing
- SameSite cookies (default: `lax`)
- CSRF tokens in forms

**No additional configuration needed.**

### 7.3 Cookie Settings

Default Auth.js cookie configuration:
```typescript
cookies: {
  sessionToken: {
    name: "next-auth.session-token",
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    },
  },
}
```

### 7.4 Password Security

**Hashing:** bcryptjs with 12 rounds
**Storage:** Only in development environment
**Production:** `password` field remains `NULL` (OAuth only)

---

## 8. Implementation Checklist

### Phase 1: Preparation ✅
- [ ] **Backup Database** - Create snapshot before any changes
- [ ] **Install Packages:**
  ```bash
  npm install next-auth@beta @auth/prisma-adapter bcryptjs
  npm install -D @types/bcryptjs tsx
  ```
- [ ] **Environment Setup** - Add all variables to `.env` and `.env.local`
- [ ] **Google OAuth Setup** - Configure callback URLs in Google Console

### Phase 2: Database Migration ✅
- [ ] **Update `schema.prisma`:**
  - Remove `clerkId` from User
  - Add `password`, `image`, `emailVerified` to User
  - Add `accounts`, `sessions` relations to User
  - Add `Account`, `Session`, `VerificationToken` models
- [ ] **Generate Migration:**
  ```bash
  npx prisma migrate dev --name auth_js_migration
  ```
- [ ] **Verify Schema** - Check all relations are correct
- [ ] **Test Migration** - Run on local database first

### Phase 3: Auth Implementation ✅
- [ ] **Create `auth.ts`** - Implement configuration with all guards
- [ ] **Create `types/next-auth.d.ts`** - TypeScript extensions
- [ ] **Create `middleware.ts`** - Route protection
- [ ] **Test Auth Config** - Verify no syntax errors

### Phase 4: Seed & Bootstrap ✅
- [ ] **Create `prisma/seed.ts`** - Implement seed script
- [ ] **Update `package.json`** - Add seed command
- [ ] **Run Seed:**
  ```bash
  npx prisma db seed
  ```
- [ ] **Verify Seed** - Check company and admin user created

### Phase 5: User Management ✅
- [ ] **Create `lib/actions/user.ts`:**
  - Implement `createUser` action
  - Implement `deactivateUser` action
- [ ] **Update `lib/resend.ts`** - Implement `sendWelcomeEmail`
- [ ] **Create Admin Form UI** - User creation form component
- [ ] **Test User Creation** - Create test user via form

### Phase 6: Login & UI ✅
- [ ] **Update `app/login/page.tsx`** - Implement login page
- [ ] **Test Dev Login** - Credentials provider
- [ ] **Test OAuth Login** - Google provider
- [ ] **Verify Guards** - Test all denial scenarios

### Phase 7: Clerk Cleanup ✅
- [ ] **Uninstall Clerk:**
  ```bash
  npm uninstall @clerk/nextjs
  ```
- [ ] **Remove Clerk Code** - Search and remove all Clerk references
- [ ] **Remove Clerk ENV vars** - Clean up `.env`
- [ ] **Final Test** - Complete end-to-end testing

### Phase 8: Production Deployment ✅
- [ ] **Pre-deployment Checklist:**
  - [ ] All tests passing
  - [ ] Database backup verified
  - [ ] Environment variables set in Vercel/hosting
  - [ ] Google OAuth production callback configured
- [ ] **Deploy to Production**
- [ ] **Smoke Test** - Test login in production
- [ ] **Monitor Logs** - Watch for errors in first 24h

---

## 9. Testing Scenarios

### Authentication Flows

#### Dev Environment (Credentials)
```
✅ PASS: Correct email + correct password → Login success
❌ FAIL: Correct email + wrong password → "Invalid credentials"
❌ FAIL: Non-existent email → "Invalid credentials"
```

#### Dev Environment (OAuth - if enabled)
```
✅ PASS: Google account for provisioned user → Login success
❌ FAIL: Google account for non-provisioned user → "User not found"
```

#### Production (OAuth Only)
```
✅ PASS: Google Workspace account for provisioned user → Login success
❌ FAIL: Personal Gmail for provisioned user → "User not found" (if not in DB)
❌ FAIL: Any credentials login attempt → Form not visible
```

### Authorization Guards

```
Given: User exists in database with activated = false
When: User attempts login (any provider)
Then: Login denied with "Account deactivated"

Given: User exists with endDate = 2025-01-01 (past)
When: User attempts login on 2026-01-27
Then: Login denied with "Contract terminated"

Given: User exists with endDate = 2026-12-31 (future)
When: User attempts login on 2026-01-27
Then: Login success

Given: User exists with no endDate
When: User attempts login
Then: Login success (if other checks pass)
```

### Admin User Creation

```
Given: Admin logged in
When: Admin creates user with email user@acmecorp.com
Then: 
  - User record created with companyId = admin's companyId
  - UserRoleArea record created
  - Audit log entry created
  - Welcome email sent
  - User can login immediately

Given: Admin logged in to CompanyA
When: Admin tries to create user in CompanyB
Then: Operation blocked (companyId extracted from session)

Given: Non-admin user logged in
When: User tries to access /admin/users/create
Then: Access denied by middleware
```

### Session Management

```
Given: User logged in with active session
When: Admin deactivates user (activated = false)
Then: User's next request is denied (database session check)

Given: User logged in
When: User's endDate updated to yesterday
Then: User's next request is denied

Given: User logged in
When: Browser closed and reopened within 30 days
Then: Session persists, user still authenticated
```

### Multi-Tenancy

```
Given: User from CompanyA logged in
When: User requests data
Then: Only data with companyId = CompanyA visible

Given: Admin from CompanyA creates user
When: User record created
Then: User's companyId = CompanyA (not from form input)
```

---

## 10. Rollback Strategy

**If Critical Issues Occur Post-Migration:**

### Step 1: Immediate Actions
```bash
# Put app in maintenance mode (if possible via hosting platform)
# Example for Vercel:
vercel --prod --env MAINTENANCE_MODE=true
```

### Step 2: Database Rollback
```bash
# Restore from backup taken in Phase 1
# Example for Neon (adjust for your setup):
pg_restore --clean --if-exists -d $DATABASE_URL backup_pre_migration.sql

# Or use Neon's point-in-time recovery via dashboard
```

### Step 3: Code Rollback
```bash
# Revert to previous commit
git log --oneline  # Find commit hash before migration
git revert <migration-commit-hash>
git push origin main

# Or hard reset (if no other changes made):
git reset --hard <commit-before-migration>
git push origin main --force
```

### Step 4: Clerk Re-activation
```bash
# Reinstall Clerk
npm install @clerk/nextjs

# Restore Clerk environment variables in .env and hosting platform
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Deploy previous version
vercel --prod
```

### Step 5: Verification
- [ ] Test login with Clerk
- [ ] Verify user data intact
- [ ] Check audit logs for corruption
- [ ] Monitor error logs for 1 hour
- [ ] Remove maintenance mode

### Critical Files to Backup Before Migration
```
- prisma/schema.prisma
- auth.ts (or lib/auth.ts)
- middleware.ts
- .env (both dev and prod)
- lib/actions/user.ts
- app/login/page.tsx
- package.json
- package-lock.json
```

**Backup Command:**
```bash
# Create backup directory
mkdir backup_pre_auth_migration
cp prisma/schema.prisma backup_pre_auth_migration/
cp auth.ts backup_pre_auth_migration/
cp middleware.ts backup_pre_auth_migration/
cp .env backup_pre_auth_migration/.env.backup
cp lib/actions/user.ts backup_pre_auth_migration/
cp app/login/page.tsx backup_pre_auth_migration/
cp package.json backup_pre_auth_migration/
cp package-lock.json backup_pre_auth_migration/

# Create database dump
pg_dump $DATABASE_URL > backup_pre_auth_migration/database_backup.sql
```

---

## 11. Package Versions

**Exact versions for reproducibility:**

```json
{
  "dependencies": {
    "next-auth": "^5.0.0-beta.25",
    "@auth/prisma-adapter": "^2.7.4",
    "bcryptjs": "^2.4.3",
    "resend": "^4.0.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "tsx": "^4.7.0"
  }
}
```

**Installation command:**
```bash
npm install next-auth@5.0.0-beta.25 @auth/prisma-adapter@2.7.4 bcryptjs@2.4.3 resend@4.0.0
npm install -D @types/bcryptjs@2.4.6 tsx@4.7.0
```

---

## 12. Post-Migration Monitoring

### Week 1: Critical Monitoring

**Metrics to Track:**
- Login success rate (should be >95%)
- Failed authentication attempts (investigate >5% failure rate)
- Session creation/validation errors
- Email delivery rate (welcome emails)

**Logs to Monitor:**
```bash
# Check for auth errors
grep "\[Auth\]" logs/production.log

# Check database session issues
grep "session" logs/production.log | grep "ERROR"

# Monitor email failures
grep "sendWelcomeEmail" logs/production.log | grep "failed"
```

**Alerts to Set:**
- Auth error rate > 5% in 1 hour
- Email send failure > 10% in 1 hour
- Database connection errors
- Session validation failures

### Month 1: Performance Monitoring

**Database Queries:**
- Monitor session lookup performance
- Optimize if P95 latency > 100ms

**User Feedback:**
- Collect feedback on login experience
- Address any UX issues promptly

---

## 13. Future Enhancements (Out of Scope)

These are NOT part of this migration but documented for future reference:

1. **Additional OAuth Providers:**
   - Microsoft/Azure AD
   - GitHub (for tech teams)

2. **Advanced Features:**
   - Two-factor authentication (2FA)
   - Single Sign-On (SSO) with SAML
   - Remember device functionality

3. **Password Management (if ever needed):**
   - Self-service password reset
   - Password strength requirements
   - Password expiration policies

4. **Session Management:**
   - View active sessions
   - Revoke specific sessions
   - Session activity logs

---

## 14. Support & Documentation

### For Developers

**Auth.js Documentation:**
- Main: https://authjs.dev
- Prisma Adapter: https://authjs.dev/reference/adapter/prisma
- Providers: https://authjs.dev/reference/core/providers

**Prisma Documentation:**
- Client: https://www.prisma.io/docs/concepts/components/prisma-client
- Migrations: https://www.prisma.io/docs/concepts/components/prisma-migrate

### For Users

**Login Help:**
- Production: "Use your Google Workspace account (@acmecorp.com)"
- Development: "Use your email and the password provided by your admin"

**Common Issues:**
- "User not found" → Contact admin to provision your account
- "Account deactivated" → Contact HR department
- "Contract terminated" → Contact HR department

---

## 15. Approval & Sign-off

**Document Status:** ✅ APPROVED FOR IMPLEMENTATION

**Prepared for:** AI Agent Execution  
**Complexity Level:** Medium (8-12 hours development time)  
**Risk Level:** Medium (includes database migration)

**Pre-Implementation Requirements:**
- [ ] Database backup verified
- [ ] Google OAuth credentials obtained
- [ ] All environment variables documented
- [ ] Rollback plan reviewed

**Implementation Ready:** ✅ YES

---

## Appendix A: Common Error Messages

### User-Facing Errors

| Error Code | User Message | Technical Reason |
|-----------|--------------|------------------|
| USER_NOT_FOUND | "Your email is not registered. Please contact your administrator." | User email not in database |
| ACCOUNT_DEACTIVATED | "Your account has been deactivated. Please contact your administrator." | activated = false |
| CONTRACT_TERMINATED | "Your contract has ended. Please contact HR for assistance." | endDate < today |
| INVALID_CREDENTIALS | "Invalid email or password." | Wrong password (dev) |
| OAUTH_ERROR | "Authentication failed. Please try again." | OAuth provider error |

### Developer Debug Errors

```typescript
// In auth.ts signIn callback:
console.error(`[Auth] User not found: ${user.email}`);
console.error(`[Auth] User deactivated: ${user.email}`);
console.error(`[Auth] Contract terminated: ${user.email}`);
console.error(`[Auth] signIn callback error:`, error);
```

---

## Appendix B: SQL Queries for Verification

### Check Migration Success

```sql
-- Verify User table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Verify Auth.js tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('accounts', 'sessions', 'verification_tokens');

-- Check seed data
SELECT id, email, name, "companyId", "isAdmin", activated
FROM users
WHERE email = 'admin@acmecorp.com';
```

### Monitor Active Sessions

```sql
-- Count active sessions
SELECT COUNT(*) as active_sessions
FROM sessions
WHERE expires > NOW();

-- Sessions by user
SELECT u.email, COUNT(s.id) as session_count
FROM users u
LEFT JOIN sessions s ON u.id = s."userId"
WHERE s.expires > NOW()
GROUP BY u.email
ORDER BY session_count DESC;
```

---

**END OF DOCUMENT**

This PRD is complete and ready for AI agent implementation. All ambiguities have been resolved, and the document provides exhaustive guidance for migration execution.
