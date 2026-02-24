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

        const existingWorkflow = await prisma.workflow.findFirst({
            where: {
                id: workflowId,
                companyId: user.companyId,
            },
            select: { id: true },
        })

        if (!existingWorkflow) {
            revalidatePath("/settings/workflows")
            revalidatePath(`/settings/workflows/${workflowId}`)
            return { success: true, data: { deleted: false } }
        }

        await prisma.workflow.delete({
            where: {
                id: existingWorkflow.id,
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
