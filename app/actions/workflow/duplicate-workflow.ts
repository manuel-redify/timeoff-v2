"use server"

import { revalidatePath } from "next/cache"

import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/rbac"

interface DuplicateWorkflowResponse {
    success: boolean
    data?: { id: string }
    error?: string
}

interface WorkflowPayload {
    id?: string
    name?: string
    isActive?: boolean
    requestTypes?: unknown[]
    contractTypes?: unknown[]
    subjectRoles?: unknown[]
    departments?: unknown[]
    projectTypes?: unknown[]
    steps?: unknown[]
    watchers?: unknown[]
}

export async function duplicateWorkflow(workflowId: string): Promise<DuplicateWorkflowResponse> {
    try {
        const user = await getCurrentUser()

        if (!user || !user.companyId) {
            return { success: false, error: "Unauthorized" }
        }

        const existingPolicy = await prisma.comment.findFirst({
            where: {
                companyId: user.companyId,
                entityType: "WORKFLOW_POLICY",
                entityId: workflowId,
            },
            select: {
                comment: true,
            },
        })

        if (!existingPolicy) {
            return { success: false, error: "Workflow not found" }
        }

        let parsed: WorkflowPayload
        try {
            parsed = JSON.parse(existingPolicy.comment) as WorkflowPayload
        } catch {
            return { success: false, error: "Workflow payload is invalid" }
        }

        const duplicatedId = crypto.randomUUID()
        const duplicateName = (parsed.name?.trim() || "Untitled policy") + " (Copy)"
        const payload = JSON.stringify({
            ...parsed,
            id: duplicatedId,
            name: duplicateName,
        })

        await prisma.comment.create({
            data: {
                companyId: user.companyId,
                byUserId: user.id,
                entityType: "WORKFLOW_POLICY",
                entityId: duplicatedId,
                comment: payload,
            },
        })

        revalidatePath("/settings/workflows")
        revalidatePath(`/settings/workflows/${workflowId}`)
        revalidatePath(`/settings/workflows/${duplicatedId}`)

        return {
            success: true,
            data: { id: duplicatedId },
        }
    } catch (error) {
        console.error("Failed to duplicate workflow:", error)
        return {
            success: false,
            error: "Failed to duplicate workflow. Please try again.",
        }
    }
}

