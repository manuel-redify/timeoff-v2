"use client"

import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { DayPart } from "@/lib/generated/prisma/enums"
import { calculateDuration, ScheduleData } from "@/lib/calculateDuration"

interface LeaveDetailsMetadataProps {
  leaveType: string
  leaveTypeColor?: string
  dateStart: Date
  dateEnd: Date
  dayPartStart: DayPart
  dayPartEnd: DayPart
  employeeComment?: string | null
  className?: string
}

const DEFAULT_SCHEDULE: ScheduleData = {
  monday: 1,
  tuesday: 1,
  wednesday: 1,
  thursday: 1,
  friday: 1,
  saturday: 2,
  sunday: 2,
}

function formatDateSafe(date: Date): string {
  return format(
    new Date(new Date(date).getTime() + new Date(date).getTimezoneOffset() * 60000),
    "MMM d, yyyy"
  )
}

function formatDayPart(dayPart: DayPart): string {
  switch (dayPart) {
    case DayPart.MORNING:
      return "Morning"
    case DayPart.AFTERNOON:
      return "Afternoon"
    default:
      return ""
  }
}

export function LeaveDetailsMetadata({
  leaveType,
  leaveTypeColor,
  dateStart,
  dateEnd,
  dayPartStart,
  dayPartEnd,
  employeeComment,
  className,
}: LeaveDetailsMetadataProps) {
  const duration = calculateDuration({
    dateStart,
    dateEnd,
    dayPartStart,
    dayPartEnd,
    schedule: DEFAULT_SCHEDULE,
    bankHolidayDates: [],
  })

  const startDayPart = formatDayPart(dayPartStart)
  const endDayPart = formatDayPart(dayPartEnd)

  return (
    <div
      data-slot="leave-details-metadata"
      className={cn("p-6 space-y-4", className)}
    >
      <div className="space-y-4">
        <MetadataRow label="Leave Type">
          <div className="flex items-center gap-2">
            {leaveTypeColor && (
              <span
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: leaveTypeColor }}
              />
            )}
            <span className="text-sm font-medium">{leaveType}</span>
          </div>
        </MetadataRow>

        <MetadataRow label="Duration">
          <span className="text-sm font-medium">
            {duration} {duration === 1 ? "day" : "days"}
          </span>
        </MetadataRow>

        <MetadataRow label="From">
          <span className="text-sm font-medium">
            {formatDateSafe(dateStart)}
            {startDayPart && (
              <span className="text-xs text-neutral-400 ml-1">
                ({startDayPart})
              </span>
            )}
          </span>
        </MetadataRow>

        <MetadataRow label="To">
          <span className="text-sm font-medium">
            {formatDateSafe(dateEnd)}
            {endDayPart && (
              <span className="text-xs text-neutral-400 ml-1">
                ({endDayPart})
              </span>
            )}
          </span>
        </MetadataRow>

        {employeeComment && (
          <div className="pt-2 border-t border-[#e5e7eb]">
            <div className="text-xs font-medium text-neutral-400 mb-1">
              Notes
            </div>
            <p className="text-sm text-neutral-600">{employeeComment}</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface MetadataRowProps {
  label: string
  children: React.ReactNode
}

function MetadataRow({ label, children }: MetadataRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-medium text-neutral-400">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  )
}
