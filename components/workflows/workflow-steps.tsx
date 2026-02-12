"use client"

import { useFieldArray, useFormContext } from "react-hook-form"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TimelineContainer } from "./timeline-container"
import { ApprovalStepCard } from "./approval-step-card"
import { Option } from "@/components/ui/multi-select"
import { ResolverType, ContextScope } from "@/types/workflow"

interface WorkflowStepsProps {
    className?: string
    options: {
        roles: Option[]
        users?: Option[]
    }
}

export function WorkflowSteps({ className, options }: WorkflowStepsProps) {
    const { control } = useFormContext()
    const { fields, append, remove } = useFieldArray({
        control,
        name: "steps",
    })

    return (
        <div className={className} data-testid="workflow-steps">
            <TimelineContainer>
                {fields.map((field, index) => (
                    <ApprovalStepCard
                        key={field.id}
                        index={index}
                        isLast={index === fields.length - 1}
                        onRemove={() => remove(index)}
                        options={options}
                    />
                ))}

                {/* Add Step Button */}
                <div className="relative flex items-center justify-center py-4">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({
                            resolver: ResolverType.ROLE,
                            scope: [ContextScope.GLOBAL],
                            autoApprove: false
                        })}
                        className="gap-2"
                        data-testid="add-step-btn"
                    >
                        <Plus className="h-4 w-4" />
                        Add Approval Step
                    </Button>
                </div>
            </TimelineContainer>
        </div>
    )
}
