"use client"

import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, Clock } from "lucide-react"
import { format } from "date-fns"

export interface ApprovalStepData {
  id: string
  status: number
  sequenceOrder: number | null
  createdAt: Date
  updatedAt: Date
  approver: {
    name: string
    lastname: string
  }
  role: {
    name: string
  } | null
}

interface WorkflowTimelineProps {
  steps: ApprovalStepData[]
  className?: string
}

type StepStatus = "approved" | "rejected" | "pending" | "current"

function getStepStatus(step: ApprovalStepData, allSteps: ApprovalStepData[]): StepStatus {
  if (step.status === 1) return "approved"
  if (step.status === 2) return "rejected"

  const hasPreviousPending = allSteps.some(
    (s) => s.sequenceOrder !== null &&
    step.sequenceOrder !== null &&
    s.sequenceOrder < step.sequenceOrder &&
    s.status === 0
  )

  if (!hasPreviousPending && step.status === 0) return "current"
  return "pending"
}

export function WorkflowTimeline({ steps, className }: WorkflowTimelineProps) {
  const sortedSteps = [...steps].sort((a, b) => {
    const orderA = a.sequenceOrder ?? 0
    const orderB = b.sequenceOrder ?? 0
    return orderA - orderB
  })

  if (sortedSteps.length === 0) {
    return null
  }

  return (
    <div
      data-slot="workflow-timeline"
      className={cn("p-6", className)}
    >
      <div className="text-xs font-medium text-neutral-400 mb-3">
        Approval Workflow
      </div>
      <div className="relative border-l border-[#e5e7eb] ml-3 pl-6 space-y-4">
        {sortedSteps.map((step, index) => (
          <TimelineStep
            key={step.id}
            step={step}
            status={getStepStatus(step, sortedSteps)}
            index={index}
            isLast={index === sortedSteps.length - 1}
          />
        ))}
      </div>
    </div>
  )
}

interface TimelineStepProps {
  step: ApprovalStepData
  status: StepStatus
  index: number
  isLast: boolean
}

function TimelineStep({ step, status, index, isLast }: TimelineStepProps) {
  const statusConfig = {
    approved: {
      icon: CheckCircle2,
      iconClass: "text-green-500",
      borderClass: "border-green-500",
      label: "Approved by",
      showTimestamp: true,
    },
    rejected: {
      icon: XCircle,
      iconClass: "text-red-500",
      borderClass: "border-red-500",
      label: "Rejected by",
      showTimestamp: true,
    },
    current: {
      icon: Clock,
      iconClass: "text-neutral-900",
      borderClass: "border-[#e2f337] bg-[#e2f337]/10",
      label: "Awaiting approval from",
      showTimestamp: false,
    },
    pending: {
      icon: Clock,
      iconClass: "text-neutral-400",
      borderClass: "border-neutral-200",
      label: "Pending approval from",
      showTimestamp: false,
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div
      data-slot={`timeline-step-${index}`}
      className="relative"
    >
      <div
        className={cn(
          "absolute -left-[31px] bg-white rounded-full p-1 border",
          config.borderClass
        )}
      >
        <Icon className={cn("w-4 h-4", config.iconClass)} />
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-medium">
          {config.label}{" "}
          <span className="text-neutral-900">
            {step.approver.name} {step.approver.lastname}
          </span>
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">
            {step.role?.name || `Stage ${index + 1}`}
          </span>
          {config.showTimestamp && (
            <span className="text-xs text-neutral-400">
              {format(new Date(step.updatedAt), "MMM d, yyyy")}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
