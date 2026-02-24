"use server"

import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/rbac"
import { WorkflowFormValues } from "@/lib/validations/workflow"

interface GetWorkflowResponse {
    success: boolean
    data?: WorkflowFormValues
    error?: string
}

export async function getWorkflow(id: string): Promise<GetWorkflowResponse> {
    try {
        const user = await getCurrentUser()

        if (!user || !user.companyId) {
            return { success: false, error: "Unauthorized" }
        }

        const workflow = await prisma.workflow.findFirst({
            where: {
                id: id,
                companyId: user.companyId,
            },
            select: {
                rules: true,
            },
        })

        if (!workflow) {
            return { success: false, error: "Workflow not found" }
        }

        try {
            const data = workflow.rules as WorkflowFormValues
            return { success: true, data }
        } catch (error) {
            console.error("Failed to parse workflow payload:", error)
            return { success: false, error: "Workflow data is corrupted" }
        }
    } catch (error) {
        console.error("Failed to fetch workflow:", error)
        return { success: false, error: "Internal server error" }
    }
}
