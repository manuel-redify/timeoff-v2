"use client"

import { Play, UserCheck, Users, FileCheck } from "lucide-react"
import { TimelineContainer } from "./timeline-container"
import { StepCard } from "./step-card"

interface WorkflowStepsProps {
    className?: string
}

export function WorkflowSteps({ className }: WorkflowStepsProps) {
    return (
        <div className={className} data-testid="workflow-steps">
            <TimelineContainer>
                <StepCard
                    title="Trigger"
                    description="Defines when this workflow starts"
                    badge="Start"
                    badgeVariant="default"
                    icon={<Play className="h-3 w-3" />}
                    position="left"
                />
                
                <StepCard
                    title="Manager Approval"
                    description="Request approval from direct manager"
                    badge="Approval"
                    badgeVariant="secondary"
                    icon={<UserCheck className="h-3 w-3" />}
                    position="right"
                />
                
                <StepCard
                    title="HR Review"
                    description="HR team reviews and validates"
                    badge="Review"
                    badgeVariant="outline"
                    icon={<Users className="h-3 w-3" />}
                    position="left"
                />
                
                <StepCard
                    title="Final Approval"
                    description="Final sign-off and completion"
                    badge="End"
                    badgeVariant="default"
                    icon={<FileCheck className="h-3 w-3" />}
                    position="right"
                    isLast
                />
            </TimelineContainer>
        </div>
    )
}
