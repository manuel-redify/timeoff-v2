import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { LeaveStatus } from "@/lib/generated/prisma/enums";
import { StatusBadge } from "@/components/ui/status-badge";
import { CancelRequestButton } from "@/components/requests/cancel-request-button";
import { ViewButton } from "@/components/requests/view-button";

interface LeaveType {
    id: string;
    name: string;
    color: string;
}

interface Request {
    id: string;
    leaveType: LeaveType;
    dateStart: Date;
    dateEnd: Date;
    dayPartStart: string;
    dayPartEnd: string;
    status: LeaveStatus;
    createdAt: Date;
}

interface RequestsTableProps {
    requests: Request[];
}

function calculateDuration(
    dateStart: Date,
    dateEnd: Date,
    dayPartStart: string,
    dayPartEnd: string
): number {
    const start = new Date(dateStart);
    const end = new Date(dateEnd);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    let duration = diffDays;

    if (dayPartStart === "MORNING" || dayPartStart === "AFTERNOON") {
        duration -= 0.5;
    }
    if (dayPartEnd === "MORNING" || dayPartEnd === "AFTERNOON") {
        duration -= 0.5;
    }
    if (dayPartStart === "MORNING" && dayPartEnd === "AFTERNOON" && diffDays === 1) {
        duration = 0.5;
    }

    return duration;
}

function formatPeriod(dateStart: Date, dateEnd: Date, dayPartStart: string, dayPartEnd: string): string {
    const start = new Date(new Date(dateStart).getTime() + new Date(dateStart).getTimezoneOffset() * 60000);
    const end = new Date(new Date(dateEnd).getTime() + new Date(dateEnd).getTimezoneOffset() * 60000);
    
    const startFormatted = format(start, "MMM d, yyyy");
    const endFormatted = format(end, "MMM d, yyyy");
    
    if (startFormatted === endFormatted) {
        let result = startFormatted;
        if (dayPartStart === "MORNING") result += " (Morning)";
        else if (dayPartStart === "AFTERNOON") result += " (Afternoon)";
        return result;
    }
    
    let result = `${startFormatted} - ${endFormatted}`;
    
    if (dayPartStart === "MORNING" || dayPartStart === "AFTERNOON") {
        result += ` (from ${dayPartStart.toLowerCase()})`;
    }
    if (dayPartEnd === "MORNING" || dayPartEnd === "AFTERNOON") {
        result += ` (to ${dayPartEnd.toLowerCase()})`;
    }
    
    return result;
}

function formatDate(date: Date): string {
    return format(new Date(new Date(date).getTime() + new Date(date).getTimezoneOffset() * 60000), "MMM d, yyyy");
}

export function RequestsTable({ requests }: RequestsTableProps) {
    return (
        <div className="w-full">
            <div className="rounded-lg border border-neutral-200 overflow-hidden bg-white">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-neutral-200 hover:bg-transparent">
                                <TableHead className="text-neutral-900 font-medium text-sm py-3 px-4">
                                    Type
                                </TableHead>
                                <TableHead className="text-neutral-900 font-medium text-sm py-3 px-4">
                                    Period
                                </TableHead>
                                <TableHead className="text-neutral-900 font-medium text-sm py-3 px-4">
                                    Duration
                                </TableHead>
                                <TableHead className="text-neutral-900 font-medium text-sm py-3 px-4">
                                    Status
                                </TableHead>
                                <TableHead className="text-neutral-900 font-medium text-sm py-3 px-4">
                                    Submitted
                                </TableHead>
                                <TableHead className="text-neutral-900 font-medium text-sm py-3 px-4 text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-32 text-center text-neutral-400"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <span className="text-sm">No leave requests found.</span>
                                            <span className="text-xs text-neutral-400">
                                                Create your first request to get started.
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                requests.map((request) => (
                                    <TableRow
                                        key={request.id}
                                        className="border-b border-neutral-200 hover:bg-neutral-50 transition-colors"
                                    >
                                        <TableCell className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: request.leaveType.color }}
                                                />
                                                <span className="font-medium text-sm text-neutral-900">
                                                    {request.leaveType.name}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 px-4">
                                            <span className="text-sm text-neutral-900">
                                                {formatPeriod(
                                                    request.dateStart,
                                                    request.dateEnd,
                                                    request.dayPartStart,
                                                    request.dayPartEnd
                                                )}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3 px-4">
                                            <span className="text-sm text-neutral-900">
                                                {calculateDuration(
                                                    request.dateStart,
                                                    request.dateEnd,
                                                    request.dayPartStart,
                                                    request.dayPartEnd
                                                )}{" "}
                                                day(s)
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3 px-4">
                                            <StatusBadge status={request.status} />
                                        </TableCell>
                                        <TableCell className="py-3 px-4">
                                            <span className="text-sm text-neutral-600">
                                                {formatDate(request.createdAt)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3 px-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <ViewButton requestId={request.id} />

                                                {(request.status === LeaveStatus.NEW ||
                                                    request.status === LeaveStatus.APPROVED) && (
                                                    <CancelRequestButton
                                                        requestId={request.id}
                                                        status={request.status}
                                                    />
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
