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

        const validatedData = workflowSchema.safeParse(formData)

        if (!validatedData.success) {
            return {
                success: false,
                error: validatedData.error.issues.map((issue) => issue.message).join(", "),
            }
        }

        const data = validatedData.data
        const workflowId = data.id || crypto.randomUUID()

        const rules = {
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
        }

        const existingWorkflow = await prisma.workflow.findFirst({
            where: {
                id: workflowId,
                companyId: user.companyId,
            },
            select: { id: true },
        })

        if (existingWorkflow) {
            await prisma.workflow.update({
                where: { id: workflowId },
                data: {
                    name: data.name,
                    rules: rules as any,
                    isActive: data.isActive,
                    updatedAt: new Date(),
                },
            })
        } else {
            await prisma.workflow.create({
                data: {
                    id: workflowId,
                    name: data.name,
                    rules: rules as any,
                    isActive: data.isActive,
                    companyId: user.companyId,
                    createdBy: user.id,
                },
            })
        }

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
