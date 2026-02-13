"use client"

import { ReactNode } from "react"
import { GitBranch } from "lucide-react"
import { cn } from "@/lib/utils"

interface ParallelStepContainerProps {
    children: ReactNode
    className?: string
}

export function ParallelStepContainer({
    children,
    className,
}: ParallelStepContainerProps) {
    return (
        <section
            className={cn(
                "rounded-lg border border-dashed border-neutral-300 bg-neutral-50/60 p-3 sm:p-4",
                "space-y-4",
                className
            )}
            data-testid="parallel-step-container"
        >
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-neutral-700">
                <GitBranch className="h-4 w-4" />
                Parallel Approvals
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6">
                {children}
            </div>
        </section>
    )
}
