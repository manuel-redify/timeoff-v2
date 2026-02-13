"use server"

import { revalidatePath } from "next/cache"

import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/rbac"

interface DeleteWorkflowResponse {
    success: boolean
    data?: { deleted: boolean }
    error?: string
}

export async function deleteWorkflow(workflowId: string): Promise<DeleteWorkflowResponse> {
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
            select: { id: true },
        })

        if (!existingPolicy) {
            revalidatePath("/settings/workflows")
            revalidatePath(`/settings/workflows/${workflowId}`)
            return { success: true, data: { deleted: false } }
        }

        await prisma.comment.delete({
            where: {
                id: existingPolicy.id,
            },
        })

        revalidatePath("/settings/workflows")
        revalidatePath(`/settings/workflows/${workflowId}`)

        return {
            success: true,
            data: { deleted: true },
        }
    } catch (error) {
        console.error("Failed to delete workflow:", error)
        return {
            success: false,
            error: "Failed to delete workflow. Please try again.",
        }
    }
}

