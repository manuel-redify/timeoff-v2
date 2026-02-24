"use server"

import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/rbac"

export interface WorkflowListItem {
    id: string
    name: string
    status: "ACTIVE" | "INACTIVE"
    updatedAt: string
    stepsCount: number
}

interface GetWorkflowsResponse {
    success: boolean
    data?: WorkflowListItem[]
    error?: string
}

export async function getWorkflows(): Promise<GetWorkflowsResponse> {
    try {
        const user = await getCurrentUser()

        if (!user || !user.companyId) {
            return { success: false, error: "Unauthorized" }
        }

        const rows = await prisma.workflow.findMany({
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
        })

        const workflows: WorkflowListItem[] = rows.map((row) => {
            const rules = row.rules as {
                name?: string
                isActive?: boolean
                steps?: Array<unknown>
            }

            return {
                id: row.id,
                name: rules.name?.trim() || "Untitled policy",
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
