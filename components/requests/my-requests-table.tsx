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
import { StatusBadge } from "@/components/status-badge";
import { CancelRequestButton } from "@/components/requests/cancel-request-button";

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
    status: LeaveStatus;
    createdAt: Date;
}

interface MyRequestsTableProps {
    requests: Request[];
}

export function MyRequestsTable({ requests }: MyRequestsTableProps) {

    // Helper for status badge color


    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No requests found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        requests.map((request) => (
                            <TableRow key={request.id}>
                                <TableCell className="font-medium">
                                    <span
                                        className="w-3 h-3 inline-block rounded-full mr-2"
                                        style={{ backgroundColor: request.leaveType.color }}
                                    ></span>
                                    {request.leaveType.name}
                                </TableCell>
                                <TableCell>
                                    {format(new Date(request.dateStart), "MMM d, yyyy")}
                                    {request.dateStart.getTime() !== request.dateEnd.getTime() && (
                                        <> - {format(new Date(request.dateEnd), "MMM d, yyyy")}</>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={request.status} />
                                </TableCell>
                                <TableCell>
                                    {format(new Date(request.createdAt), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <CancelRequestButton requestId={request.id} status={request.status} />
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
