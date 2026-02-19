import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { StatusBadge } from "@/components/ui/status-badge";
import { CancelRequestButton } from "@/components/requests/cancel-request-button";
import { ViewButton } from "@/components/requests/view-button";
import { RequestRevokeButton } from "@/components/requests/request-revoke-button";

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
    status: string;
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

function RequestCard({ request }: { request: Request }) {
    return (
        <Card className="border-neutral-200">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                        <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: request.leaveType.color }}
                        />
                        <span className="font-medium text-sm text-neutral-900">
                            {request.leaveType.name}
                        </span>
                    </div>
                    <StatusBadge status={request.status} />
                </div>
                
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-neutral-500">Period</span>
                        <span className="text-neutral-900">
                            {formatPeriod(request.dateStart, request.dateEnd, request.dayPartStart, request.dayPartEnd)}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-neutral-500">Duration</span>
                        <span className="text-neutral-900">
                            {calculateDuration(request.dateStart, request.dateEnd, request.dayPartStart, request.dayPartEnd)} day(s)
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-neutral-500">Submitted</span>
                        <span className="text-neutral-600">{formatDate(request.createdAt)}</span>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-neutral-100">
                    <ViewButton requestId={request.id} />
                    <CancelRequestButton
                        requestId={request.id}
                        status={request.status}
                        dateStart={request.dateStart}
                    />
                    <RequestRevokeButton
                        requestId={request.id}
                        status={request.status}
                        dateStart={request.dateStart}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

export function RequestsTable({ requests }: RequestsTableProps) {
    const emptyState = (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <span className="text-sm text-neutral-400">No leave requests found.</span>
            <span className="text-xs text-neutral-400">
                Create your first request to get started.
            </span>
        </div>
    );

    return (
        <div className="w-full">
            {/* Mobile Card List - visible on screens < lg */}
            <div className="lg:hidden space-y-3">
                {requests.length === 0 ? (
                    <Card className="border-neutral-200">
                        <CardContent className="p-6">{emptyState}</CardContent>
                    </Card>
                ) : (
                    requests.map((request) => (
                        <RequestCard key={request.id} request={request} />
                    ))
                )}
            </div>

            {/* Desktop Table - visible on screens >= lg */}
            <div className="hidden lg:block rounded-lg border border-neutral-200 overflow-hidden bg-white">
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
                                    <TableCell colSpan={6} className="h-32 text-center text-neutral-400">
                                        {emptyState}
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
                                                <CancelRequestButton
                                                    requestId={request.id}
                                                    status={request.status}
                                                    dateStart={request.dateStart}
                                                />
                                                <RequestRevokeButton
                                                    requestId={request.id}
                                                    status={request.status}
                                                    dateStart={request.dateStart}
                                                />
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
