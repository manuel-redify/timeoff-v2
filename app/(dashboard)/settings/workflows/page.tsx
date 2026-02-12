"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, ArrowRight, FileText } from "lucide-react"

interface Workflow {
    id: string
    name: string
    status: "ACTIVE" | "INACTIVE"
    createdAt: string
    _count?: {
        rules: number
    }
}

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
            // TODO: Replace with actual API call
            // const res = await fetch('/api/workflows')
            // const result = await res.json()
            // if (result.success) {
            //     setWorkflows(result.data)
            // }
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000))
            setWorkflows([]) // Empty for now - will show empty state
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
                /* Data Table - Will be implemented in M5 */
                <div className="rounded-lg border border-neutral-200 bg-white">
                    <p className="p-6 text-neutral-400">Data table will be implemented in Milestone 5</p>
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
