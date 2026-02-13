"use client"

import { ReactNode, useState } from "react"
import { useFieldArray, useFormContext } from "react-hook-form"
import { Plus } from "lucide-react"
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"
import { TimelineContainer } from "./timeline-container"
import { ApprovalStepCard } from "./approval-step-card"
import { ParallelStepContainer } from "./parallel-step-container"
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
import { Option } from "@/components/ui/multi-select"
import { ResolverType, ContextScope } from "@/types/workflow"
import { WorkflowFormValues } from "@/lib/validations/workflow"
import { cn } from "@/lib/utils"

interface SortableStepProps {
    id: string
    className?: string
    dataTestId?: string
    children: ReactNode
}

function SortableStep({ id, className, dataTestId, children }: SortableStepProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
            className={cn(className, isDragging && "z-20 opacity-70")}
            data-testid={dataTestId}
            {...attributes}
            {...listeners}
        >
            {children}
        </div>
    )
}

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
    const [pendingDeleteStepId, setPendingDeleteStepId] = useState<string | null>(null)
    const { fields, append, remove, insert, move, update } = useFieldArray({
        control,
        name: "steps",
    })
    const steps = watch("steps")
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    )
    const stepIds = fields.map((field) => field.id)

    const createDefaultStep = (parallelGroupId?: string): WorkflowFormValues["steps"][number] => ({
        resolver: ResolverType.ROLE,
        scope: [ContextScope.GLOBAL],
        autoApprove: false,
        parallelGroupId,
    })

    const createParallelGroupId = () => {
        return `parallel-${crypto.randomUUID()}`
    }

    const getGroupIndexes = (parallelGroupId: string) => {
        return (steps || [])
            .map((step, index) => (step?.parallelGroupId === parallelGroupId ? index : -1))
            .filter((index) => index >= 0)
    }

    const isMandatoryStep = (index: number) => fields.length === 1 && index === 0

    const addParallelSiblingForStep = (index: number) => {
        const selectedStep = getValues(`steps.${index}`)

        if (!selectedStep || selectedStep.parallelGroupId) {
            return
        }

        const parallelGroupId = createParallelGroupId()
        update(index, { ...selectedStep, parallelGroupId })
        insert(index + 1, createDefaultStep(parallelGroupId))
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

    const handleReorder = (event: DragEndEvent) => {
        const { active, over } = event

        if (!over || active.id === over.id) {
            return
        }

        const previousIndex = fields.findIndex((field) => field.id === active.id)
        const nextIndex = fields.findIndex((field) => field.id === over.id)

        if (previousIndex < 0 || nextIndex < 0 || previousIndex === nextIndex) {
            return
        }

        move(previousIndex, nextIndex)
    }

    const requestDelete = (stepId: string, index: number) => {
        if (isMandatoryStep(index)) {
            return
        }
        setPendingDeleteStepId(stepId)
    }

    const confirmDelete = () => {
        if (!pendingDeleteStepId) {
            return
        }

        const index = fields.findIndex((field) => field.id === pendingDeleteStepId)
        setPendingDeleteStepId(null)

        if (index < 0 || isMandatoryStep(index)) {
            return
        }

        removeStepWithParallelHandling(index)
    }

    return (
        <div className={className} data-testid="workflow-steps">
            <DndContext sensors={sensors} onDragEnd={handleReorder}>
                <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
                    <TimelineContainer>
                        {(() => {
                            const renderedParallelGroups = new Set<string>()

                            return fields.map((field, index) => {
                                const parallelGroupId = steps?.[index]?.parallelGroupId

                                if (!parallelGroupId) {
                                    return (
                                        <SortableStep key={field.id} id={field.id} className="cursor-move">
                                            <ApprovalStepCard
                                                index={index}
                                                isLast={index === fields.length - 1}
                                                onRemove={() => requestDelete(field.id, index)}
                                                canRemove={!isMandatoryStep(index)}
                                                removeDisabledReason="At least one fallback step is required."
                                                onAddParallelStep={() => addParallelSiblingForStep(index)}
                                                showAddParallelStep={fields.length > 0}
                                                options={options}
                                            />
                                        </SortableStep>
                                    )
                                }

                                if (renderedParallelGroups.has(parallelGroupId)) {
                                    return null
                                }

                                renderedParallelGroups.add(parallelGroupId)
                                const groupIndexes = getGroupIndexes(parallelGroupId)

                                return (
                                    <ParallelStepContainer key={parallelGroupId}>
                                        {groupIndexes.map((groupIndex, groupOrder) => {
                                            const groupField = fields[groupIndex]

                                            if (!groupField) {
                                                return null
                                            }

                                            const renderOnLeftSide = groupOrder % 2 === 0

                                            return (
                                                <SortableStep
                                                    key={groupField.id}
                                                    id={groupField.id}
                                                    dataTestId="parallel-step-draggable"
                                                    className={cn(
                                                        "cursor-move",
                                                        renderOnLeftSide ? "sm:col-start-1" : "sm:col-start-2"
                                                    )}
                                                >
                                                    <ApprovalStepCard
                                                        index={groupIndex}
                                                        isLast={groupIndex === fields.length - 1}
                                                        onRemove={() => requestDelete(groupField.id, groupIndex)}
                                                        canRemove={!isMandatoryStep(groupIndex)}
                                                        removeDisabledReason="At least one fallback step is required."
                                                        options={options}
                                                        inline
                                                        inlinePosition={renderOnLeftSide ? "right" : "left"}
                                                    />
                                                </SortableStep>
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
                        </div>
                    </TimelineContainer>
                </SortableContext>
            </DndContext>

            <AlertDialog open={pendingDeleteStepId !== null} onOpenChange={(open) => !open && setPendingDeleteStepId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete approval step?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This step will be removed from the workflow. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={confirmDelete}
                        >
                            Delete Step
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
