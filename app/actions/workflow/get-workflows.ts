"use server"

import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/rbac"

export interface WorkflowListItem {
    id: string
    name: string
    appliesTo: string
    status: "ACTIVE" | "INACTIVE"
    updatedAt: string
    stepsCount: number
}

interface GetWorkflowsResponse {
    success: boolean
    data?: WorkflowListItem[]
    error?: string
}

interface WorkflowRules {
    name?: string
    isActive?: boolean
    steps?: Array<unknown>
    subjectRoles?: unknown[]
    departments?: unknown[]
    contractTypes?: unknown[]
    requestTypes?: unknown[]
    projectTypes?: unknown[]
}

export async function getWorkflows(): Promise<GetWorkflowsResponse> {
    try {
        const user = await getCurrentUser()

        if (!user || !user.companyId) {
            return { success: false, error: "Unauthorized" }
        }

        const [rows, roles, departments, contractTypes, leaveTypes] = await Promise.all([
            prisma.workflow.findMany({
                where: {
                    companyId: user.companyId,
                },
                orderBy: { updatedAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    isActive: true,
                    rules: true,
                    updatedAt: true,
                },
            }),
            prisma.role.findMany({
                where: { companyId: user.companyId },
                select: { id: true, name: true },
            }),
            prisma.department.findMany({
                where: { companyId: user.companyId },
                select: { id: true, name: true },
            }),
            prisma.contractType.findMany({
                select: { id: true, name: true },
            }),
            prisma.leaveType.findMany({
                where: { companyId: user.companyId },
                select: { id: true, name: true },
            }),
        ])

        const roleLabels = new Map(roles.map((item) => [item.id, item.name]))
        const departmentLabels = new Map(departments.map((item) => [item.id, item.name]))
        const contractTypeLabels = new Map(contractTypes.map((item) => [item.id, item.name]))
        const leaveTypeLabels = new Map(leaveTypes.map((item) => [item.id, item.name]))
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

        const resolveLabel = (value: unknown, labelMap: Map<string, string>): string => {
            const raw = String(value || "").trim()
            if (!raw) return ""
            if (raw.toLowerCase() === "any") return "Any"
            const mapped = labelMap.get(raw)
            if (mapped) return mapped
            if (uuidPattern.test(raw)) return "Unavailable"
            return raw
        }

        const workflows: WorkflowListItem[] = rows.map((row) => {
            const rules = row.rules as WorkflowRules

            return {
                id: row.id,
                name: rules.name?.trim() || "Untitled policy",
                appliesTo: (() => {
                    const subjectRoles = Array.isArray(rules.subjectRoles) ? rules.subjectRoles : []
                    const matchedDepartments = Array.isArray(rules.departments) ? rules.departments : []
                    const matchedContractTypes = Array.isArray(rules.contractTypes) ? rules.contractTypes : []
                    const requestTypes = Array.isArray(rules.requestTypes) ? rules.requestTypes : []
                    const projectTypes = Array.isArray(rules.projectTypes) ? rules.projectTypes : []

                    const firstRole = subjectRoles.find((value) => String(value).toLowerCase() !== "any")
                    const firstDepartment = matchedDepartments.find((value) => String(value).toLowerCase() !== "any")
                    const firstContractType = matchedContractTypes.find((value) => String(value).toLowerCase() !== "any")
                    const firstRequestType = requestTypes[0]
                    const firstProjectType = projectTypes.find((value) => String(value).toLowerCase() !== "any")

                    const roleLabel = firstRole ? resolveLabel(firstRole, roleLabels) : "Any role"
                    const departmentLabel = firstDepartment ? resolveLabel(firstDepartment, departmentLabels) : "Any department"
                    const contractTypeLabel = firstContractType ? resolveLabel(firstContractType, contractTypeLabels) : "Any contract"
                    const requestTypeLabel = firstRequestType ? resolveLabel(firstRequestType, leaveTypeLabels) : "Any request"
                    const projectTypeLabel = firstProjectType ? String(firstProjectType) : "Any project"

                    return [roleLabel, departmentLabel, contractTypeLabel, requestTypeLabel, projectTypeLabel]
                        .filter(Boolean)
                        .join(" | ")
                })(),
                status: rules.isActive ? "ACTIVE" : "INACTIVE",
                updatedAt: row.updatedAt.toISOString(),
                stepsCount: Array.isArray(rules.steps) ? rules.steps.length : 0,
            }
        })

        return { success: true, data: workflows }
    } catch (error) {
        console.error("Failed to load workflows:", error)
        return {
            success: false,
            error: "Failed to load workflows. Please try again.",
        }
    }
}