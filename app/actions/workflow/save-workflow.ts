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

function normalizeStepSequences(steps: WorkflowFormValues["steps"]): WorkflowFormValues["steps"] {
    let sequence = 1
    const groupToSequence = new Map<string, number>()

    return steps.map((step) => {
        if (step.parallelGroupId) {
            const existing = groupToSequence.get(step.parallelGroupId)
            if (existing) {
                return { ...step, sequence: existing }
            }
            groupToSequence.set(step.parallelGroupId, sequence)
            const assigned = sequence
            sequence += 1
            return { ...step, sequence: assigned }
        }

        const assigned = sequence
        sequence += 1
        return { ...step, sequence: assigned }
    })
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

        const normalizedSteps = normalizeStepSequences(data.steps)

        const rules = {
            id: workflowId,
            name: data.name,
            isActive: data.isActive,
            requestTypes: data.requestTypes,
            contractTypes: data.contractTypes,
            subjectRoles: data.subjectRoles,
            departments: data.departments,
            projectTypes: data.projectTypes,
            steps: normalizedSteps,
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

            await prisma.audit.create({
                data: {
                    entityType: "workflow",
                    entityId: workflowId,
                    attribute: "workflow.policy.update",
                    oldValue: null,
                    newValue: JSON.stringify({ name: data.name, isActive: data.isActive }),
                    companyId: user.companyId,
                    byUserId: user.id,
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

            await prisma.audit.create({
                data: {
                    entityType: "workflow",
                    entityId: workflowId,
                    attribute: "workflow.policy.create",
                    oldValue: null,
                    newValue: JSON.stringify({ name: data.name, isActive: data.isActive }),
                    companyId: user.companyId,
                    byUserId: user.id,
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
