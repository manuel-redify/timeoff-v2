import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { Eye, Trash2 } from "lucide-react";
import { LeaveStatus } from "@/lib/generated/prisma/enums";

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
    const getStatusColor = (status: LeaveStatus) => {
        switch (status) {
            case LeaveStatus.APPROVED: return "bg-green-500 hover:bg-green-600";
            case LeaveStatus.REJECTED: return "bg-red-500 hover:bg-red-600";
            case LeaveStatus.PENDING_REVOKE: return "bg-yellow-500 hover:bg-yellow-600";
            case LeaveStatus.CANCELED: return "bg-gray-500 hover:bg-gray-600";
            default: return "bg-blue-500 hover:bg-blue-600"; // NEW
        }
    };

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
                                    <Badge className={getStatusColor(request.status)}>
                                        {request.status.replace("_", " ")}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {format(new Date(request.createdAt), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" asChild>
                                        <Link href={`/requests/${request.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
