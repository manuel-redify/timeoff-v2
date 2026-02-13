"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Copy, FileText, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getWorkflows, WorkflowListItem } from "@/app/actions/workflow/get-workflows"
import { duplicateWorkflow } from "@/app/actions/workflow/duplicate-workflow"
import { deleteWorkflow } from "@/app/actions/workflow/delete-workflow"
import { toast } from "sonner"

type Workflow = WorkflowListItem
type WorkflowActionType = "duplicate" | "delete"
type PendingAction = {
    type: WorkflowActionType
    workflow: Workflow
}

const SKELETON_ROWS = Array.from({ length: 5 }, (_, i) => i)

function formatUtcDate(dateIso: string): string {
    const date = new Date(dateIso)
    if (Number.isNaN(date.getTime())) {
        return "-"
    }

    return new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "UTC",
    }).format(date)
}

export default function WorkflowsPage() {
    const [workflows, setWorkflows] = useState<Workflow[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
    const [isActionSubmitting, setIsActionSubmitting] = useState(false)

    const loadWorkflows = useCallback(async () => {
        setIsLoading(true)
        try {
            const result = await getWorkflows()
            if (result.success) {
                setWorkflows(result.data || [])
            } else {
                setWorkflows([])
            }
        } catch (e) {
            console.error("Error loading workflows:", e)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadWorkflows()
    }, [loadWorkflows])

    const openActionDialog = (workflow: Workflow, type: WorkflowActionType) => {
        if (isActionSubmitting) {
            return
        }

        setPendingAction({ workflow, type })
    }

    const closeActionDialog = (open: boolean) => {
        if (!open && !isActionSubmitting) {
            setPendingAction(null)
        }
    }

    const handleConfirmAction = async () => {
        if (!pendingAction) {
            return
        }

        setIsActionSubmitting(true)
        const { workflow, type } = pendingAction

        try {
            if (type === "duplicate") {
                const result = await duplicateWorkflow(workflow.id)
                if (!result.success) {
                    toast.error(result.error || "Failed to duplicate workflow")
                    return
                }

                toast.success("Workflow duplicated")
            } else {
                const result = await deleteWorkflow(workflow.id)
                if (!result.success) {
                    toast.error(result.error || "Failed to delete workflow")
                    return
                }

                toast.success(result.data?.deleted ? "Workflow deleted" : "Workflow already removed")
            }

            await loadWorkflows()
            setPendingAction(null)
        } catch {
            toast.error("Unexpected error while updating workflow")
        } finally {
            setIsActionSubmitting(false)
        }
    }

    const renderStatus = (status: Workflow["status"]) => (
        <span
            className={
                status === "ACTIVE"
                    ? "inline-flex rounded-sm border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700"
                    : "inline-flex rounded-sm border border-neutral-200 bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600"
            }
        >
            {status === "ACTIVE" ? "Active" : "Inactive"}
        </span>
    )

    return (
        <div className="space-y-6" data-testid="workflows-page">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-neutral-900">Workflows</h3>
                    <p className="text-sm text-neutral-400">
                        Manage approval workflows and automation rules for leave requests.
                    </p>
                </div>
                <Button asChild className="rounded-sm">
                    <Link href="/settings/workflows/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Workflow
                    </Link>
                </Button>
            </div>

            {isLoading ? (
                <>
                    <div className="rounded-lg border border-neutral-200 bg-white sm:hidden">
                        <div className="space-y-3 p-4">
                            {SKELETON_ROWS.map((i) => (
                                <div key={i} className="rounded-lg border border-neutral-200 p-4">
                                    <Skeleton className="mb-3 h-4 w-40" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-16 justify-self-end" />
                                        <Skeleton className="h-4 w-14" />
                                        <Skeleton className="h-4 w-24 justify-self-end" />
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Skeleton className="h-11 w-16 rounded-sm" />
                                        <Skeleton className="h-11 w-28 rounded-sm" />
                                        <Skeleton className="h-11 w-24 rounded-sm" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="hidden rounded-lg border border-neutral-200 bg-white sm:block">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[42%] px-6 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Name</TableHead>
                                <TableHead className="w-[18%] px-6 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Status</TableHead>
                                <TableHead className="w-[14%] px-6 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Steps</TableHead>
                                <TableHead className="w-[18%] px-6 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Updated</TableHead>
                                <TableHead className="w-[8%] px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {SKELETON_ROWS.map((i) => (
                                <TableRow key={i}>
                                    <TableCell className="px-6 py-4"><Skeleton className="h-4 w-36" /></TableCell>
                                    <TableCell className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-sm" /></TableCell>
                                    <TableCell className="px-6 py-4"><Skeleton className="h-4 w-10" /></TableCell>
                                    <TableCell className="px-6 py-4"><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell className="px-6 py-4 text-right"><Skeleton className="ml-auto h-8 w-12 rounded-sm" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                </>
            ) : workflows.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-neutral-200 bg-white py-16 px-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 mb-4">
                        <FileText className="h-8 w-8 text-neutral-400" />
                    </div>
                    <h4 className="text-lg font-medium text-neutral-900 mb-2">
                        No policies configured yet
                    </h4>
                    <p className="text-sm text-neutral-400 mb-6 text-center max-w-sm">
                        Create your first approval workflow to automate leave request processing.
                    </p>
                    <Button asChild className="rounded-sm">
                        <Link href="/settings/workflows/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Create your first policy
                        </Link>
                    </Button>
                </div>
            ) : (
                <>
                    <div className="rounded-lg border border-neutral-200 bg-white p-4 sm:hidden">
                        <div className="space-y-3">
                            {workflows.map((workflow) => (
                                <article key={workflow.id} className="rounded-lg border border-neutral-200 p-4">
                                    <h4 className="text-base font-medium text-neutral-900">{workflow.name}</h4>
                                    <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                                        <span className="text-neutral-500">Status</span>
                                        <span className="justify-self-end">{renderStatus(workflow.status)}</span>
                                        <span className="text-neutral-500">Steps</span>
                                        <span className="justify-self-end text-neutral-700">{workflow.stepsCount}</span>
                                        <span className="text-neutral-500">Updated</span>
                                        <span className="justify-self-end text-neutral-700">{formatUtcDate(workflow.updatedAt)}</span>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0" disabled={isActionSubmitting}>
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/settings/workflows/${workflow.id}`}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => openActionDialog(workflow, "duplicate")}
                                                    disabled={isActionSubmitting}
                                                >
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    Duplicate
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => openActionDialog(workflow, "delete")}
                                                    disabled={isActionSubmitting}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                    <div className="hidden rounded-lg border border-neutral-200 bg-white sm:block">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[42%] px-6 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Name</TableHead>
                                <TableHead className="w-[18%] px-6 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Status</TableHead>
                                <TableHead className="w-[14%] px-6 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Steps</TableHead>
                                <TableHead className="w-[18%] px-6 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Updated</TableHead>
                                <TableHead className="w-[8%] px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {workflows.map((workflow) => (
                                <TableRow key={workflow.id}>
                                    <TableCell className="px-6 py-4 font-medium text-neutral-900">{workflow.name}</TableCell>
                                    <TableCell className="px-6 py-4">{renderStatus(workflow.status)}</TableCell>
                                    <TableCell className="px-6 py-4 text-sm text-neutral-600">{workflow.stepsCount}</TableCell>
                                    <TableCell className="px-6 py-4 text-sm text-neutral-600">{formatUtcDate(workflow.updatedAt)}</TableCell>
                                    <TableCell className="px-6 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0" disabled={isActionSubmitting}>
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/settings/workflows/${workflow.id}`}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => openActionDialog(workflow, "duplicate")}
                                                    disabled={isActionSubmitting}
                                                >
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    Duplicate
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => openActionDialog(workflow, "delete")}
                                                    disabled={isActionSubmitting}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                </>
            )}

            <AlertDialog open={pendingAction !== null} onOpenChange={closeActionDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-neutral-500" />
                            {pendingAction?.type === "delete" ? "Delete workflow?" : "Duplicate workflow?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingAction?.type === "delete"
                                ? `This will permanently remove "${pendingAction.workflow.name}". This action cannot be undone.`
                                : `This will create a copy of "${pendingAction?.workflow.name}" with the same workflow rules.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="h-11 rounded-sm" disabled={isActionSubmitting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className={pendingAction?.type === "delete" ? "h-11 rounded-sm bg-red-600 text-white hover:bg-red-700" : "h-11 rounded-sm"}
                            onClick={async (event) => {
                                event.preventDefault()
                                await handleConfirmAction()
                            }}
                            disabled={isActionSubmitting}
                            data-testid="workflow-action-confirm"
                        >
                            {isActionSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : pendingAction?.type === "delete" ? (
                                "Delete"
                            ) : (
                                "Duplicate"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
