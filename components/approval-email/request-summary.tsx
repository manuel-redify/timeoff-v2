import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import type { Prisma } from '@/lib/generated/prisma/client';

type ActionTokenLeaveRequest = Prisma.LeaveRequestGetPayload<{
  include: {
    user: true;
    approver: true;
    leaveType: true;
  };
}>;

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

function formatDuration(durationMinutes: number) {
  if (durationMinutes % 480 === 0) {
    const days = durationMinutes / 480;
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
}

interface LeaveRequestSummaryCardProps {
  leaveRequest: ActionTokenLeaveRequest;
  title: string;
  description: string;
}

export function LeaveRequestSummaryCard({
  leaveRequest,
  title,
  description,
}: LeaveRequestSummaryCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-3">
        <StatusBadge status={leaveRequest.status} className="w-fit" />
        <div className="space-y-2">
          <CardTitle className="text-xl leading-tight sm:text-2xl">{title}</CardTitle>
          <CardDescription className="text-sm leading-6 sm:text-[15px]">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 text-sm leading-6 sm:text-[15px]">
        <div>
          <div className="text-muted-foreground text-xs uppercase tracking-wide">Employee</div>
          <div className="break-words font-medium">{leaveRequest.user.name} {leaveRequest.user.lastname}</div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wide">Start date</div>
            <div className="font-medium">{formatDate(leaveRequest.dateStart)}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wide">End date</div>
            <div className="font-medium">{formatDate(leaveRequest.dateEnd)}</div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wide">Leave type</div>
            <div className="font-medium">{leaveRequest.leaveType.name}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wide">Duration</div>
            <div className="font-medium">{formatDuration(leaveRequest.durationMinutes)}</div>
          </div>
        </div>
        {leaveRequest.decidedAt && (
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wide">Processed on</div>
            <div className="font-medium">{formatDateTime(leaveRequest.decidedAt)}</div>
          </div>
        )}
        {leaveRequest.employeeComment && (
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wide">Employee notes</div>
            <div className="break-words font-medium">{leaveRequest.employeeComment}</div>
          </div>
        )}
        {leaveRequest.approverComment && (
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wide">Approver comment</div>
            <div className="break-words font-medium">{leaveRequest.approverComment}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
