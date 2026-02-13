"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface StepCardProps {
    title: string
    description?: string
    badge?: string
    badgeVariant?: "default" | "secondary" | "outline" | "destructive"
    icon?: ReactNode
    position?: "left" | "right"
    isLast?: boolean
    children?: ReactNode
    className?: string
    inline?: boolean
    mirrorContentForRight?: boolean
}

export function StepCard({
    title,
    description,
    badge,
    badgeVariant = "secondary",
    icon,
    position = "left",
    isLast = false,
    children,
    className,
    inline = false,
    mirrorContentForRight = true,
}: StepCardProps) {
    return (
        <div
            className={cn(
                "relative flex items-start gap-4 sm:gap-6",
                !inline && "sm:items-center",
                inline && position === "right" && "sm:flex-row-reverse",
                !inline && position === "right" && "sm:flex-row-reverse",
                "animate-in fade-in slide-in-from-bottom-4 duration-300",
                className
            )}
            data-testid="step-card"
            data-last-step={isLast ? "true" : "false"}
        >
            {/* Timeline dot with icon */}
            <div 
                className={cn(
                    "relative z-10 flex shrink-0 items-center justify-center",
                    "w-8 h-8 rounded-full border-2 border-white shadow-sm",
                    "bg-primary text-primary-foreground",
                    "transition-transform duration-200 hover:scale-110"
                )}
            >
                {icon ? (
                    <span className="h-4 w-4">{icon}</span>
                ) : (
                    <div className="h-2 w-2 rounded-full bg-white" />
                )}
            </div>

            {/* Card content */}
            <div className={cn(
                "flex-1 min-w-0",
                !inline && (position === "left" ? "sm:pr-12" : "sm:pl-12"),
                inline && position === "right" && "text-right",
                !inline && position === "right" && "sm:text-right"
            )}>
                <Card className={cn(
                    "transition-all duration-200",
                    "hover:shadow-md hover:border-neutral-300",
                    "cursor-pointer"
                )}>
                    <CardHeader className="pb-3">
                        <div className={cn(
                            "flex items-center gap-2",
                            mirrorContentForRight && inline && position === "right" && "justify-end flex-row-reverse",
                            mirrorContentForRight && position === "right" && "sm:justify-end sm:flex-row-reverse"
                        )}>
                            <CardTitle className="text-base font-semibold">{title}</CardTitle>
                            {badge && (
                                <Badge variant={badgeVariant} className="rounded-sm shrink-0">
                                    {badge}
                                </Badge>
                            )}
                        </div>
                        {description && (
                            <CardDescription className={cn(
                                mirrorContentForRight && inline && position === "right" && "text-right",
                                mirrorContentForRight && position === "right" && "sm:text-right"
                            )}>
                                {description}
                            </CardDescription>
                        )}
                    </CardHeader>
                    {children && (
                        <CardContent className={cn(
                            "pt-0",
                            mirrorContentForRight && inline && position === "right" && "text-right",
                            mirrorContentForRight && position === "right" && "sm:text-right"
                        )}>
                            {children}
                        </CardContent>
                    )}
                </Card>
            </div>

            {/* Spacer for alternating layout on desktop */}
            {!inline && (
                <div className={cn(
                    "hidden sm:block flex-1",
                    position === "left" ? "sm:pl-12" : "sm:pr-12"
                )} />
            )}
        </div>
    )
}
