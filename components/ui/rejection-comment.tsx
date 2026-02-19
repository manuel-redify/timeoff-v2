"use client"

import { cn } from "@/lib/utils"

interface RejectionCommentProps {
  status: string
  approverComment?: string | null
  className?: string
}

export function RejectionComment({
  status,
  approverComment,
  className,
}: RejectionCommentProps) {
  const isRejected = status?.toUpperCase() === "REJECTED"

  if (!isRejected || !approverComment) {
    return null
  }

  return (
    <div
      data-slot="rejection-comment"
      className={cn(
        "p-4 bg-[#fee2e2] rounded-sm border border-red-200",
        className
      )}
    >
      <div className="text-xs font-medium text-red-600 mb-1">
        Rejection Reason
      </div>
      <p className="text-sm text-red-700">{approverComment}</p>
    </div>
  )
}
