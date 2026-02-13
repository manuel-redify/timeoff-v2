"use client"

import { ReactNode } from "react"
import { Plus, GitBranch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ParallelStepContainerProps {
    children: ReactNode
    onAddStep: () => void
    className?: string
}

export function ParallelStepContainer({
    children,
    onAddStep,
    className,
}: ParallelStepContainerProps) {
    return (
        <section
            className={cn(
                "rounded-lg border border-dashed border-neutral-300 bg-neutral-50/60 p-4",
                "space-y-4",
                className
            )}
            data-testid="parallel-step-container"
        >
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                <GitBranch className="h-4 w-4" />
                Parallel Approvals
            </div>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:overflow-x-auto">
                {children}
            </div>

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddStep}
                className="gap-2"
                data-testid="add-parallel-step-btn"
            >
                <Plus className="h-4 w-4" />
                Add Parallel Step
            </Button>
        </section>
    )
}
