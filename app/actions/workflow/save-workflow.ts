"use server"

import { revalidatePath } from "next/cache"
import { workflowSchema, WorkflowFormValues } from "@/lib/validations/workflow"
import { getCurrentUser } from "@/lib/rbac"
import prisma from "@/lib/prisma"

interface SaveWorkflowResponse {
    success: boolean
    data?: { id: string }
    error?: string
}

export async function saveWorkflow(
    formData: WorkflowFormValues
): Promise<SaveWorkflowResponse> {
    try {
        const user = await getCurrentUser()

        if (!user || !user.companyId) {
            return { success: false, error: "Unauthorized" }
        }

        // Validate the form data
        const validatedData = workflowSchema.safeParse(formData)

        if (!validatedData.success) {
            return {
                success: false,
                error: validatedData.error.issues.map((issue) => issue.message).join(", "),
            }
        }

        const data = validatedData.data
        const workflowId = data.id || crypto.randomUUID()
        const payload = JSON.stringify({
            id: workflowId,
            name: data.name,
            isActive: data.isActive,
            requestTypes: data.requestTypes,
            contractTypes: data.contractTypes,
            subjectRoles: data.subjectRoles,
            departments: data.departments,
            projectTypes: data.projectTypes,
            steps: data.steps,
            watchers: data.watchers,
        })

        const existingPolicy = await prisma.comment.findFirst({
            where: {
                companyId: user.companyId,
                entityType: "WORKFLOW_POLICY",
                entityId: workflowId,
            },
            select: { id: true },
        })

        if (existingPolicy) {
            await prisma.comment.update({
                where: { id: existingPolicy.id },
                data: {
                    comment: payload,
                    byUserId: user.id,
                    at: new Date(),
                },
            })
        } else {
            await prisma.comment.create({
                data: {
                    companyId: user.companyId,
                    byUserId: user.id,
                    entityType: "WORKFLOW_POLICY",
                    entityId: workflowId,
                    comment: payload,
                },
            })
        }

        // Revalidate the workflows list page
        revalidatePath("/settings/workflows")
        revalidatePath(`/settings/workflows/${workflowId}`)

        return {
            success: true,
            data: { id: workflowId },
        }
    } catch (error) {
        console.error("Failed to save workflow:", error)
        return {
            success: false,
            error: "Failed to save workflow. Please try again.",
        }
    }
}
