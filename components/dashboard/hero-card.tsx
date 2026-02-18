import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { LeaveRequestWithRelations } from "@/lib/services/leave-request.service";
import { calculateDuration } from "@/lib/calculateDuration";
import { DayPart, LeaveStatus } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

interface HeroCardProps {
  leave: LeaveRequestWithRelations | null;
  className?: string;
}

export function HeroCard({ leave, className }: HeroCardProps) {
  if (!leave) {
    return (
      <Card
        className={cn(
          "bg-card text-card-foreground flex flex-col gap-4 rounded-xl border shadow-sm h-full justify-center items-center",
          className
        )}
      >
        <div className="text-center space-y-2 p-6">
          <div className="h-12 w-12 rounded-full bg-muted mx-auto flex items-center justify-center">
            <Calendar className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            No upcoming leave
          </p>
          <p className="text-xs text-neutral-400">
            Your next approved leave will appear here
          </p>
        </div>
      </Card>
    );
  }

  const formatDateRange = (start: Date, end: Date) => {
    const startMonth = format(start, "MMM");
    const startDay = format(start, "d");
    const endMonth = format(end, "MMM");
    const endDay = format(end, "d");

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  };

  const duration = calculateDuration({
    dateStart: leave.dateStart,
    dateEnd: leave.dateEnd,
    dayPartStart: leave.dayPartStart as DayPart,
    dayPartEnd: leave.dayPartEnd as DayPart,
    schedule: {
      monday: 1,
      tuesday: 1,
      wednesday: 1,
      thursday: 1,
      friday: 1,
      saturday: 2,
      sunday: 2,
    },
    bankHolidayDates: [],
  });

  const totalSteps = leave.approvalSteps.length;
  const currentStepIndex = leave.approvalSteps.findIndex(
    (step) => step.status === 0
  );
  const currentStep =
    currentStepIndex === -1
      ? totalSteps
      : currentStepIndex;
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 100;

  const currentApprover = leave.approvalSteps[currentStep];

  return (
    <Card
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-4 rounded-xl border shadow-sm h-full",
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-400">
            Next Leave
          </span>
          <StatusBadge status={leave.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 flex-1">
        {/* Date Range */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <Calendar className="h-8 w-8 text-primary" />
            <span>
              {formatDateRange(leave.dateStart, leave.dateEnd)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {format(leave.dateStart, "EEEE, yyyy")}
          </p>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {duration} {duration === 1 ? "day" : "days"}
          </span>
          {leave.leaveType && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
              {leave.leaveType.name}
            </span>
          )}
        </div>

        {/* Approval Progress */}
        {totalSteps > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Step {currentStep + 1} of {totalSteps}
              </span>
              {currentApprover && (
                <span className="text-neutral-600">
                  Awaiting approval
                </span>
              )}
            </div>
            <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-[#e2f337] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* No approval steps */}
        {totalSteps === 0 && leave.status === LeaveStatus.APPROVED && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Auto-approved</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
