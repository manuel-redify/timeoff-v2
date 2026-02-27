import * as z from "zod"

const stepSchema = z.object({
    id: z.string().optional(),
    sequence: z.number().int().positive().optional(),
    resolver: z.enum(["ROLE", "DEPARTMENT_MANAGER", "LINE_MANAGER", "SPECIFIC_USER"]).optional(),
    resolverId: z.string().optional(),
    scope: z.array(z.enum(["GLOBAL", "SAME_AREA", "SAME_DEPARTMENT", "SAME_PROJECT"])).default(["GLOBAL"]),
    autoApprove: z.boolean().default(false),
    parallelGroupId: z.string().optional(),
}).superRefine((step, ctx) => {
    if (step.autoApprove) return;

    if (!step.resolver) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Resolver is required unless Auto-Approve is enabled",
            path: ["resolver"],
        });
        return;
    }

    if ((step.resolver === "ROLE" || step.resolver === "SPECIFIC_USER") && !step.resolverId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Resolver target is required for selected resolver type",
            path: ["resolverId"],
        });
    }
});

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
    // Steps
    steps: z.array(stepSchema).min(1, "At least one approver step is required").default([]),
    watchers: z.array(z.object({
        id: z.string().optional(),
        resolver: z.enum(["ROLE", "DEPARTMENT_MANAGER", "LINE_MANAGER", "SPECIFIC_USER"]),
        resolverId: z.string().optional(),
        scope: z.array(z.enum(["GLOBAL", "SAME_AREA", "SAME_DEPARTMENT", "SAME_PROJECT"])).default(["GLOBAL"]),
        notificationOnly: z.boolean().default(true),
        notifyByEmail: z.boolean().default(true),
        notifyByPush: z.boolean().default(true),
    }).refine((watcher) => watcher.notifyByEmail || watcher.notifyByPush, {
        message: "At least one notification channel must be enabled",
        path: ["notifyByEmail"],
    })).default([]),
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
