"use server"

import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/rbac"

export interface WorkflowOptions {
    leaveTypes: { value: string; label: string }[]
    contractTypes: { value: string; label: string }[]
    roles: { value: string; label: string }[]
    departments: { value: string; label: string }[]
    projectTypes: { value: string; label: string }[]
    users: { value: string; label: string }[]
}

export async function getWorkflowOptions(): Promise<WorkflowOptions> {
    const user = await getCurrentUser()

    if (!user || !user.companyId) {
        throw new Error("User or Company not found")
    }

    const [leaveTypes, contractTypes, roles, departments, projects, users] = await Promise.all([
        prisma.leaveType.findMany({
            where: { companyId: user.companyId },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
        prisma.contractType.findMany({
            orderBy: { name: "asc" },
        }),
        prisma.role.findMany({
            where: { companyId: user.companyId },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
        prisma.department.findMany({
            where: { companyId: user.companyId },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
        prisma.project.findMany({
            where: { companyId: user.companyId },
            select: { type: true },
            distinct: ["type"],
            orderBy: { type: "asc" },
        }),
        prisma.user.findMany({
            where: { companyId: user.companyId, activated: true },
            select: { id: true, name: true, email: true },
            orderBy: { name: "asc" },
        }),
    ])

    return {
        leaveTypes: leaveTypes.map((lt: { id: string; name: string }) => ({ value: lt.id, label: lt.name })),
        contractTypes: contractTypes.map((ct: { id: string; name: string }) => ({ value: ct.id, label: ct.name })),
        roles: roles.map((r: { id: string; name: string }) => ({ value: r.id, label: r.name })),
        departments: departments.map((d: { id: string; name: string }) => ({ value: d.id, label: d.name })),
        projectTypes: projects
            .map((p: { type: string }) => ({ value: p.type, label: p.type }))
            .filter((p) => p.value), // Ensure no empty types
        users: users.map((u: { id: string; name: string | null; email: string }) => ({
            value: u.id,
            label: u.name || u.email,
        })),
    }
}
