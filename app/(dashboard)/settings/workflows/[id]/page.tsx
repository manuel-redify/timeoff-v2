"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { WorkflowBuilderHeader } from "@/components/workflows/workflow-builder-header"
import { TriggersBlock } from "@/components/workflows/triggers-block"
import { WorkflowSteps } from "@/components/workflows/workflow-steps"
import { WatchersBlock } from "@/components/workflows/watchers-block"
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
import { workflowSchema, WorkflowFormValues } from "@/lib/validations/workflow"
import { saveWorkflow } from "@/app/actions/workflow/save-workflow"
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
    const [isLoadingOptions, setIsLoadingOptions] = useState(true)

    // Initialize form with react-hook-form and zod resolver
    const form = useForm<WorkflowFormValues>({
        resolver: zodResolver(workflowSchema),
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

    // Load options on mount
    useEffect(() => {
        const loadOptions = async () => {
            try {
                const data = await getWorkflowOptions()
                setOptions(data)
            } catch {
                toast.error("Failed to load workflow options")
            } finally {
                setIsLoadingOptions(false)
            }
        }
        loadOptions()
    }, [])

    async function handleSave(data: WorkflowFormValues) {
        try {
            const result = await saveWorkflow(data)

            if (result.success) {
                toast.success(isNew ? "Workflow created successfully" : "Workflow updated successfully")

                // Reset form dirty state after successful save
                form.reset(data, { keepValues: true })

                if (isNew && result.data?.id) {
                    // Redirect to the edit page for the newly created workflow
                    router.push(`/settings/workflows/${result.data.id}`)
                }
            } else {
                toast.error(result.error || "Failed to save workflow")
            }
        } catch {
            toast.error("An unexpected error occurred while saving")
        }
    }

    function handleCancel() {
        requestNavigation(() => router.push("/settings/workflows"))
    }

    function handleBack() {
        requestNavigation(() => router.push("/settings/workflows"))
    }

    if (isLoadingOptions || !options) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        )
    }

    return (
        <FormProvider {...form}>
            <form
                onSubmit={form.handleSubmit(handleSave)}
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

                    <WatchersBlock options={{
                        roles: options.roles,
                        users: options.users,
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
