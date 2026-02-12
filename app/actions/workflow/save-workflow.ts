"use server"

import { revalidatePath } from "next/cache"
import { workflowSchema, WorkflowFormValues } from "@/lib/validations/workflow"
import { getCurrentUser } from "@/lib/rbac"

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

        // TODO: Implement actual database save logic
        // For now, we'll simulate a successful save
        console.log("Saving workflow:", {
            ...data,
            companyId: user.companyId,
        })

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Revalidate the workflows list page
        revalidatePath("/settings/workflows")

        return {
            success: true,
            data: { id: data.id || crypto.randomUUID() },
        }
    } catch (error) {
        console.error("Failed to save workflow:", error)
        return {
            success: false,
            error: "Failed to save workflow. Please try again.",
        }
    }
}
