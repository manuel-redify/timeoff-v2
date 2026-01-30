"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/smtp2go";

interface CreateUserParams {
  email: string;
  name: string;
  lastname: string;
  roleId: string;
  areaId?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  country?: string;
  contractType?: string;
}

interface CreateUserResponse {
  success: boolean;
  userId?: string;
  error?: string;
  emailSent?: boolean;
  emailError?: string;
}

const DEV_DEFAULT_PASSWORD = "TempPassword123!";

export async function createUser(params: CreateUserParams): Promise<CreateUserResponse> {
  try {
    // Auth check: Verify session exists and user is admin
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized: No session found" };
    }

    if (!session.user.isAdmin) {
      return { success: false, error: "Forbidden: Admin access required" };
    }

    // Tenant check: Extract companyId from session
    const companyId = session.user.companyId;
    if (!companyId) {
      return { success: false, error: "Invalid session: Company ID missing" };
    }

    // Duplicate check: Verify email doesn't already exist
    const existingUser = await prisma.user.findUnique({
      where: { email: params.email },
    });

    if (existingUser) {
      return { success: false, error: "Email already exists" };
    }

    // Foreign key validation: Verify roleId exists and belongs to the admin's company
    const role = await prisma.role.findUnique({
      where: { 
        id: params.roleId,
        companyId: companyId 
      },
    });

    if (!role) {
      return { success: false, error: "Invalid role ID or role not found in your company" };
    }

    // Verify areaId exists and belongs to the admin's company (if provided)
    if (params.areaId) {
      const area = await prisma.area.findUnique({
        where: { 
          id: params.areaId,
          companyId: companyId 
        },
      });

      if (!area) {
        return { success: false, error: "Invalid area ID or area not found in your company" };
      }
    }

    // Verify departmentId exists and belongs to the admin's company (if provided)
    if (params.departmentId) {
      const department = await prisma.department.findUnique({
        where: { 
          id: params.departmentId,
          companyId: companyId 
        },
      });

      if (!department) {
        return { success: false, error: "Invalid department ID or department not found in your company" };
      }
    }

    // Password logic: Hash DEV_DEFAULT_PASSWORD if in development mode
    let hashedPassword: string | null = null;
    if (process.env.NODE_ENV === "development") {
      hashedPassword = await bcrypt.hash(DEV_DEFAULT_PASSWORD, 12);
    }

    // Implement prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user record
      const user = await tx.user.create({
        data: {
          email: params.email,
          name: params.name,
          lastname: params.lastname,
          companyId: companyId,
          departmentId: params.departmentId || null,
          startDate: params.startDate ? new Date(params.startDate) : new Date(),
          endDate: params.endDate ? new Date(params.endDate) : null,
          country: params.country || null,
          contractType: params.contractType || "Employee",
          password: hashedPassword,
          activated: true,
          isAdmin: false,
          isAutoApprove: false,
        },
      });

      // Create UserRoleArea mapping
      await tx.userRoleArea.create({
        data: {
          userId: user.id,
          roleId: params.roleId,
          areaId: params.areaId || null,
        },
      });

      // Create audit log entry
      await tx.audit.create({
        data: {
          entityType: "User",
          entityId: user.id,
          attribute: "creation",
          oldValue: null,
          newValue: JSON.stringify({
            email: params.email,
            name: params.name,
            lastname: params.lastname,
            roleId: params.roleId,
            areaId: params.areaId,
            departmentId: params.departmentId,
          }),
          companyId: companyId,
          byUserId: session.user.id,
        },
      });

      return user;
    });

    // Send welcome email (wrapped in try/catch to prevent user creation rollback)
    let emailSuccess = false;
    let emailError: string | undefined;

    try {
      const isProduction = process.env.NODE_ENV === "production";
      const temporaryPassword = isProduction ? undefined : DEV_DEFAULT_PASSWORD;
      
      const emailResult = await sendWelcomeEmail({
        to: params.email,
        name: params.name,
        isProduction,
        temporaryPassword,
      });

      emailSuccess = emailResult.success;
      if (!emailResult.success) {
        emailError = emailResult.error;
        console.error("Email sending failed:", emailResult.error);
      }
    } catch (emailErr) {
      emailError = emailErr instanceof Error ? emailErr.message : "Unknown email error";
      console.error("Email sending error:", emailErr);
    }

    // Create email audit record
    try {
      await prisma.emailAudit.create({
        data: {
          email: params.email,
          subject: "Welcome to TimeOff Management",
          body: emailSuccess 
            ? "Welcome email sent successfully" 
            : `Failed to send welcome email: ${emailError}`,
          companyId: companyId,
          userId: result.id,
        },
      });
    } catch (auditErr) {
      console.error("Failed to create email audit record:", auditErr);
    }

    return { 
      success: true, 
      userId: result.id,
      emailSent: emailSuccess,
      emailError: emailError,
    };

  } catch (error) {
    console.error("Error creating user:", error);
    return { 
      success: false, 
      error: "Internal server error during user creation" 
    };
  }
}