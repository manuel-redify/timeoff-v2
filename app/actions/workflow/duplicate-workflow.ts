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

        const existingWorkflow = await prisma.workflow.findFirst({
            where: {
                id: workflowId,
                companyId: user.companyId,
            },
            select: {
                rules: true,
            },
        })

        if (!existingWorkflow) {
            return { success: false, error: "Workflow not found" }
        }

        const parsed = existingWorkflow.rules as WorkflowPayload

        const duplicatedId = crypto.randomUUID()
        const duplicateName = (parsed.name?.trim() || "Untitled policy") + " (Copy)"
        const newRules = {
            ...parsed,
            id: duplicatedId,
            name: duplicateName,
        }

        await prisma.workflow.create({
            data: {
                id: duplicatedId,
                name: duplicateName,
                rules: newRules as any,
                isActive: parsed.isActive ?? false,
                companyId: user.companyId,
                createdBy: user.id,
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
