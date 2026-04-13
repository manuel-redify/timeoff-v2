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
import Link from "next/link";
import { Eye, Trash2 } from "lucide-react";
import { LeaveStatus } from "@/lib/generated/prisma/enums";
import { StatusBadge } from "@/components/ui/status-badge";
import { CancelRequestButton } from "@/components/requests/cancel-request-button";

import { formatDurationText } from "@/lib/time-utils";

function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
        case 'approved':
            return '#dcfae7'; // light green
        case 'rejected':
            return '#ef4444'; // red  
        case 'pending':
        case 'new':
            return '#faf2c8'; // light yellow
        default:
            return '#94a3b8'; // slate
    }
}

interface Request {
    id: string;
    leaveType: {
        name: string;
        color: string;
    };
    dateStart: Date;
    dateEnd: Date;
    dayPartStart: string;
    dayPartEnd: string;
    durationMinutes: number;
    status: LeaveStatus;
    createdAt: Date;
}

function formatDate(date: Date): string {
    return format(new Date(new Date(date).getTime() + new Date(date).getTimezoneOffset() * 60000), "MMM d, yyyy");
}

interface MyRequestsTableProps {
    requests: Request[];
    minutesPerDay?: number;
}

export function MyRequestsTable({ requests, minutesPerDay = 480 }: MyRequestsTableProps) {

    // Helper for status badge color


    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                No requests found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        requests.map((request) => (
                            <TableRow key={request.id}>
                                <TableCell className="font-medium">
                                    <span
                                        className="w-3 h-3 inline-block rounded-full mr-2"
                                        style={{ 
                                            backgroundColor: getStatusColor(request.status)
                                        }}
                                    ></span>
                                    {request.leaveType.name}
                                </TableCell>
                                <TableCell>
                                    {formatDate(request.dateStart)}
                                    {(request.dayPartStart === 'MORNING' || request.dayPartStart === 'AFTERNOON') && (
                                        <span className="text-xs text-muted-foreground ml-1">({request.dayPartStart.toLowerCase()})</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {formatDate(request.dateEnd)}
                                    {(request.dayPartEnd === 'MORNING' || request.dayPartEnd === 'AFTERNOON') && (
                                        <span className="text-xs text-muted-foreground ml-1">({request.dayPartEnd.toLowerCase()})</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {formatDurationText(request.durationMinutes, minutesPerDay)}
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={request.status} />
                                </TableCell>
                                <TableCell>
                                    {format(new Date(request.createdAt), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <CancelRequestButton 
                                            requestId={request.id} 
                                            status={request.status} 
                                            dateStart={request.dateStart}
                                        />
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/requests/${request.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
