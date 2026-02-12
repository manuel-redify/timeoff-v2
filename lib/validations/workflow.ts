import * as z from "zod"

export const workflowSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Policy name is required"),
    isActive: z.boolean(),
    // Triggers - At least one trigger condition must be set
    requestTypes: z.array(z.string()).min(1, "Select at least one request type"),
    contractTypes: z.array(z.string()),
    subjectRoles: z.array(z.string()),
    departments: z.array(z.string()),
    projectTypes: z.array(z.string()),
})

export type WorkflowFormValues = z.infer<typeof workflowSchema>

// Helper to check if at least one trigger condition is set (beyond "Any")
export function hasTriggerCondition(values: WorkflowFormValues): boolean {
    const hasRequestTypes = values.requestTypes.length > 0
    const hasContractTypes = values.contractTypes.length > 0 && !values.contractTypes.includes("any")
    const hasSubjectRoles = values.subjectRoles.length > 0 && !values.subjectRoles.includes("any")
    const hasDepartments = values.departments.length > 0 && !values.departments.includes("any")
    const hasProjectTypes = values.projectTypes.length > 0 && !values.projectTypes.includes("any")

    return hasRequestTypes || hasContractTypes || hasSubjectRoles || hasDepartments || hasProjectTypes
}
