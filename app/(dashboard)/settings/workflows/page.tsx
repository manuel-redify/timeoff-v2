"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, ArrowRight, FileText } from "lucide-react"
import { getWorkflows, WorkflowListItem } from "@/app/actions/workflow/get-workflows"

type Workflow = WorkflowListItem

export default function WorkflowsPage() {
    const [workflows, setWorkflows] = useState<Workflow[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        loadWorkflows()
    }, [])

    async function loadWorkflows() {
        setIsLoading(true)
        try {
            const result = await getWorkflows()
            if (result.success) {
                setWorkflows(result.data || [])
            } else {
                setWorkflows([])
            }
        } catch (e) {
            console.error('Error loading workflows:', e)
        } finally {
            setIsLoading(false)
        }
    }

    // Generate skeleton rows for the table
    const skeletonRows = Array.from({ length: 5 }, (_, i) => i)

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
                /* Loading State - Skeleton Table */
                <div className="rounded-lg border border-neutral-200 bg-white">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 border-b border-neutral-200 px-6 py-4">
                        <div className="col-span-4">
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="col-span-3">
                            <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="col-span-2">
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="col-span-2">
                            <Skeleton className="h-4 w-14" />
                        </div>
                        <div className="col-span-1">
                            <span className="sr-only">Actions</span>
                        </div>
                    </div>

                    {/* Skeleton Rows */}
                    {skeletonRows.map((i) => (
                        <div
                            key={i}
                            className="grid grid-cols-12 gap-4 border-b border-neutral-200 px-6 py-4 last:border-b-0"
                        >
                            <div className="col-span-4">
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <div className="col-span-3">
                                <Skeleton className="h-4 w-24" />
                            </div>
                            <div className="col-span-2">
                                <Skeleton className="h-6 w-16 rounded-sm" />
                            </div>
                            <div className="col-span-2">
                                <Skeleton className="h-4 w-12" />
                            </div>
                            <div className="col-span-1 flex justify-end">
                                <Skeleton className="h-8 w-8 rounded-sm" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : workflows.length === 0 ? (
                /* Empty State */
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
                /* Workflows table */
                <div className="rounded-lg border border-neutral-200 bg-white">
                    <div className="grid grid-cols-12 gap-4 border-b border-neutral-200 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        <div className="col-span-5">Name</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Steps</div>
                        <div className="col-span-2">Updated</div>
                        <div className="col-span-1 text-right">Action</div>
                    </div>
                    {workflows.map((workflow) => (
                        <div key={workflow.id} className="grid grid-cols-12 gap-4 border-b border-neutral-200 px-6 py-4 last:border-b-0">
                            <div className="col-span-5 font-medium text-neutral-900">{workflow.name}</div>
                            <div className="col-span-2">
                                <span className={workflow.status === "ACTIVE"
                                    ? "inline-flex rounded-sm border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700"
                                    : "inline-flex rounded-sm border border-neutral-200 bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600"}>
                                    {workflow.status === "ACTIVE" ? "Active" : "Inactive"}
                                </span>
                            </div>
                            <div className="col-span-2 text-sm text-neutral-600">{workflow.stepsCount}</div>
                            <div className="col-span-2 text-sm text-neutral-600">
                                {new Date(workflow.createdAt).toLocaleDateString()}
                            </div>
                            <div className="col-span-1 flex justify-end">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/settings/workflows/${workflow.id}`}>Edit</Link>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Quick Links for Testing */}
            {isMounted && (
                <div className="pt-4">
                    <p className="text-sm text-neutral-400 mb-3">Quick navigation (for testing):</p>
                    <div className="flex gap-3">
                        <Button variant="outline" asChild className="rounded-sm">
                            <Link href="/settings/workflows/new">
                                New Workflow
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button variant="outline" asChild className="rounded-sm">
                            <Link href="/settings/workflows/wf-123">
                                Example Workflow
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
