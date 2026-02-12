"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface TimelineContainerProps {
    children: ReactNode
    className?: string
}

export function TimelineContainer({ children, className }: TimelineContainerProps) {
    return (
        <div className={cn("relative", className)} data-testid="timeline-container">
            {/* Vertical line background */}
            <div 
                className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-200"
                aria-hidden="true"
            />
            
            {/* Content container */}
            <div className="relative space-y-6 sm:space-y-8">
                {children}
            </div>
        </div>
    )
}
