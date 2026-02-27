"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { toastError } from "@/lib/toast-helper"

import { WorkflowBuilderHeader } from "@/components/workflows/workflow-builder-header"
import { TriggersBlock } from "@/components/workflows/triggers-block"
import { WorkflowSteps } from "@/components/workflows/workflow-steps"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { workflowSchema, WorkflowFormValues } from "@/lib/validations/workflow"
import { saveWorkflow } from "@/app/actions/workflow/save-workflow"
import { getWorkflow } from "@/app/actions/workflow/get-workflow"
import { getWorkflowOptions } from "@/app/actions/workflow/get-options"
import { useDirtyState } from "@/hooks/use-dirty-state"

interface WorkflowBuilderPageProps {
    params: Promise<{
        id: string
    }>
}

export default function WorkflowBuilderPage({ params }: WorkflowBuilderPageProps) {
    const router = useRouter()
    const { id } = use(params)
    const isNew = id === "new"
    const [options, setOptions] = useState<Awaited<ReturnType<typeof getWorkflowOptions>> | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Initialize form with react-hook-form and zod resolver
    const form = useForm<WorkflowFormValues>({
        resolver: zodResolver(workflowSchema) as any,
        defaultValues: {
            name: isNew ? "New Workflow" : "",
            isActive: true,
            requestTypes: [],
            contractTypes: [],
            subjectRoles: [],
            departments: [],
            projectTypes: [],
            steps: [],
            watchers: [],
        },
        mode: "onChange",
    })

    // Get dirty state from form
    const isDirty = form.formState.isDirty

    // Dirty state management
    const { showDialog, setShowDialog, confirmNavigation, cancelNavigation, requestNavigation } = useDirtyState({
        isDirty,
        message: "You have unsaved changes. Are you sure you want to leave?",
        enabled: true,
    })

    // Load data and options on mount
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [optionsData, workflowResult] = await Promise.all([
                    getWorkflowOptions(),
                    !isNew ? getWorkflow(id) : Promise.resolve(null)
                ])

                setOptions(optionsData)

                if (workflowResult && workflowResult.success && workflowResult.data) {
                    // Reset form with existing workflow data to establish baseline
                    form.reset(workflowResult.data)
                } else if (workflowResult && !workflowResult.success) {
                    toastError(workflowResult.error || "Failed to load workflow")
                    router.push("/settings/workflows")
                }
            } catch (error) {
                console.error("Failed to load workflow builder data:", error)
                toastError("Failed to load initial data")
            } finally {
                setIsLoading(false)
            }
        }
        loadInitialData()
    }, [id, isNew, router, form])

    async function handleSave(data: WorkflowFormValues) {
        try {
            const result = await saveWorkflow(data)

            if (result.success) {
                toast.success(isNew ? "Workflow created successfully" : "Workflow updated successfully")

                // Reset form dirty state after successful save with canonical data
                form.reset(data)

                if (isNew && result.data?.id) {
                    // Redirect to the edit page for the newly created workflow
                    router.push(`/settings/workflows/${result.data.id}`)
                }
            } else {
                toastError(result.error || "Failed to save workflow")
            }
        } catch {
            toastError("An unexpected error occurred while saving")
        }
    }

    function handleCancel() {
        requestNavigation(() => router.push("/settings/workflows"))
    }

    function handleBack() {
        requestNavigation(() => router.push("/settings/workflows"))
    }

    if (isLoading || !options) {
        return (
            <div className="space-y-6" data-testid="workflow-builder-skeleton">
                <div className="sticky top-0 z-50 border-b border-neutral-200 bg-white px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-sm" />
                        <Skeleton className="h-8 w-64" />
                        <div className="ml-auto flex items-center gap-2">
                            <Skeleton className="h-11 w-24 rounded-sm" />
                            <Skeleton className="h-11 w-28 rounded-sm" />
                        </div>
                    </div>
                </div>

                <main className="space-y-6 py-6">
                    <div className="rounded-lg border border-neutral-200 p-6">
                        <Skeleton className="mb-2 h-6 w-52" />
                        <Skeleton className="mb-6 h-4 w-80" />
                        <div className="grid gap-4 md:grid-cols-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>

                    <div className="rounded-lg border border-neutral-200 p-6">
                        <Skeleton className="mb-4 h-6 w-56" />
                        <div className="space-y-4">
                            <Skeleton className="h-40 w-full" />
                            <Skeleton className="h-40 w-full" />
                            <Skeleton className="h-11 w-48 rounded-sm" />
                        </div>
                    </div>

                    <div className="rounded-lg border border-neutral-200 p-6">
                        <Skeleton className="mb-4 h-6 w-40" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                </main>
            </div>
        )
    }

    return (
        <FormProvider {...form}>
            <form
                onSubmit={form.handleSubmit(handleSave as any)}
                className="flex flex-col min-h-[calc(100vh-8rem)]"
                data-testid="workflow-builder-page"
            >
                <WorkflowBuilderHeader
                    isNew={isNew}
                    onCancel={handleCancel}
                    onBack={handleBack}
                />

                {/* Scrollable Content Area */}
                <main className="flex-1 py-6 space-y-6">
                    <TriggersBlock
                        options={{
                            leaveTypes: options.leaveTypes,
                            contractTypes: options.contractTypes,
                            roles: options.roles,
                            departments: options.departments,
                            projectTypes: options.projectTypes,
                        }}
                    />

                    {/* Workflow Timeline */}
                    <WorkflowSteps options={{
                        roles: options.roles,
                        users: options.users
                    }} />
                </main>
            </form>

            {/* Unsaved Changes Dialog */}
            <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={cancelNavigation}>
                            Stay on Page
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmNavigation}>
                            Leave Without Saving
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </FormProvider>
    )
}
