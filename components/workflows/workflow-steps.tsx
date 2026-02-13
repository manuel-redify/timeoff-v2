"use client"

import { useState } from "react"
import { useFieldArray, useFormContext } from "react-hook-form"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TimelineContainer } from "./timeline-container"
import { ApprovalStepCard } from "./approval-step-card"
import { ParallelStepContainer } from "./parallel-step-container"
import { Option } from "@/components/ui/multi-select"
import { ResolverType, ContextScope } from "@/types/workflow"
import { WorkflowFormValues } from "@/lib/validations/workflow"

interface WorkflowStepsProps {
    className?: string
    options: {
        roles: Option[]
        users?: Option[]
    }
}

export function WorkflowSteps({ className, options }: WorkflowStepsProps) {
    const form = useFormContext<WorkflowFormValues>()
    const { control, watch, getValues } = form
    const [draggedStepIndex, setDraggedStepIndex] = useState<number | null>(null)
    const { fields, append, remove, insert, move, update } = useFieldArray({
        control,
        name: "steps",
    })
    const steps = watch("steps")

    const createDefaultStep = (parallelGroupId?: string): WorkflowFormValues["steps"][number] => ({
        resolver: ResolverType.ROLE,
        scope: [ContextScope.GLOBAL],
        autoApprove: false,
        parallelGroupId,
    })

    const createParallelGroupId = () => {
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
            return `parallel-${crypto.randomUUID()}`
        }

        return `parallel-${Date.now()}-${Math.round(Math.random() * 10000)}`
    }

    const getGroupIndexes = (parallelGroupId: string) => {
        return (steps || [])
            .map((step, index) => (step?.parallelGroupId === parallelGroupId ? index : -1))
            .filter((index) => index >= 0)
    }

    const addParallelGroup = () => {
        const groupId = createParallelGroupId()
        append([createDefaultStep(groupId), createDefaultStep(groupId)])
    }

    const addStepToParallelGroup = (parallelGroupId: string) => {
        const groupIndexes = getGroupIndexes(parallelGroupId)
        const lastGroupIndex = groupIndexes[groupIndexes.length - 1]

        if (lastGroupIndex === undefined) {
            append(createDefaultStep(parallelGroupId))
            return
        }

        insert(lastGroupIndex + 1, createDefaultStep(parallelGroupId))
    }

    const removeStepWithParallelHandling = (index: number) => {
        const parallelGroupId = steps?.[index]?.parallelGroupId

        if (!parallelGroupId) {
            remove(index)
            return
        }

        const groupIndexes = getGroupIndexes(parallelGroupId)

        if (groupIndexes.length !== 2) {
            remove(index)
            return
        }

        const remainingIndex = groupIndexes.find((groupIndex) => groupIndex !== index)
        const remainingStep = remainingIndex !== undefined ? getValues(`steps.${remainingIndex}`) : undefined
        remove(index)

        if (remainingIndex === undefined || !remainingStep) {
            return
        }

        const adjustedIndex = remainingIndex > index ? remainingIndex - 1 : remainingIndex
        update(adjustedIndex, { ...remainingStep, parallelGroupId: undefined })
    }

    const handleDropInParallelGroup = (targetIndex: number, parallelGroupId: string) => {
        if (draggedStepIndex === null || draggedStepIndex === targetIndex) {
            setDraggedStepIndex(null)
            return
        }

        const groupIndexes = getGroupIndexes(parallelGroupId)

        if (!groupIndexes.includes(draggedStepIndex) || !groupIndexes.includes(targetIndex)) {
            setDraggedStepIndex(null)
            return
        }

        move(draggedStepIndex, targetIndex)
        setDraggedStepIndex(null)
    }

    return (
        <div className={className} data-testid="workflow-steps">
            <TimelineContainer>
                {(() => {
                    const renderedParallelGroups = new Set<string>()

                    return fields.map((field, index) => {
                        const parallelGroupId = steps?.[index]?.parallelGroupId

                        if (!parallelGroupId) {
                            return (
                                <ApprovalStepCard
                                    key={field.id}
                                    index={index}
                                    isLast={index === fields.length - 1}
                                    onRemove={() => removeStepWithParallelHandling(index)}
                                    options={options}
                                />
                            )
                        }

                        if (renderedParallelGroups.has(parallelGroupId)) {
                            return null
                        }

                        renderedParallelGroups.add(parallelGroupId)
                        const groupIndexes = getGroupIndexes(parallelGroupId)

                        return (
                            <ParallelStepContainer
                                key={parallelGroupId}
                                onAddStep={() => addStepToParallelGroup(parallelGroupId)}
                            >
                                {groupIndexes.map((groupIndex) => {
                                    const groupField = fields[groupIndex]

                                    if (!groupField) {
                                        return null
                                    }

                                    return (
                                        <div
                                            key={groupField.id}
                                            draggable
                                            onDragStart={() => setDraggedStepIndex(groupIndex)}
                                            onDragEnd={() => setDraggedStepIndex(null)}
                                            onDragOver={(event) => {
                                                event.preventDefault()
                                            }}
                                            onDrop={() => handleDropInParallelGroup(groupIndex, parallelGroupId)}
                                            className="min-w-[320px] xl:w-[420px] cursor-move"
                                            data-testid="parallel-step-draggable"
                                        >
                                            <ApprovalStepCard
                                                index={groupIndex}
                                                isLast={groupIndex === fields.length - 1}
                                                onRemove={() => removeStepWithParallelHandling(groupIndex)}
                                                options={options}
                                                inline
                                            />
                                        </div>
                                    )
                                })}
                            </ParallelStepContainer>
                        )
                    })
                })()}

                {/* Add Step Button */}
                <div className="relative flex flex-wrap items-center justify-center gap-3 py-4">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append(createDefaultStep())}
                        className="gap-2"
                        data-testid="add-step-btn"
                    >
                        <Plus className="h-4 w-4" />
                        Add Approval Step
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addParallelGroup}
                        className="gap-2"
                        data-testid="add-parallel-group-btn"
                    >
                        <Plus className="h-4 w-4" />
                        Add Parallel Group
                    </Button>
                </div>
            </TimelineContainer>
        </div>
    )
}
