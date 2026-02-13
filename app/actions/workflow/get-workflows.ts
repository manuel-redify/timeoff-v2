"use server"

import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/rbac"

export interface WorkflowListItem {
    id: string
    name: string
    status: "ACTIVE" | "INACTIVE"
    createdAt: string
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

        const rows = await prisma.comment.findMany({
            where: {
                companyId: user.companyId,
                entityType: "WORKFLOW_POLICY",
            },
            orderBy: { at: "desc" },
            select: {
                entityId: true,
                comment: true,
                at: true,
            },
        })

        const workflows: WorkflowListItem[] = rows.flatMap((row) => {
            try {
                const parsed = JSON.parse(row.comment) as {
                    name?: string
                    isActive?: boolean
                    steps?: Array<unknown>
                }

                return [{
                    id: row.entityId,
                    name: parsed.name?.trim() || "Untitled policy",
                    status: parsed.isActive ? "ACTIVE" : "INACTIVE",
                    createdAt: row.at.toISOString(),
                    stepsCount: Array.isArray(parsed.steps) ? parsed.steps.length : 0,
                }]
            } catch {
                return []
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
