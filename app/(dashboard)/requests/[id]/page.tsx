import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { ChevronLeft, User, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { StatusBadge } from "@/components/status-badge";
import { CancelRequestButton } from "@/components/requests/cancel-request-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RequestActions } from "@/components/requests/request-actions";
import { LeaveStatus, DayPart } from "@/lib/generated/prisma/enums";

// Helper for status colors (duplicated for now, could move to utils)


export default async function RequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser();
    if (!user) redirect("/sign-in");

    const { id } = await params;
    const request = await prisma.leaveRequest.findUnique({
        where: { id },
        include: {
            leaveType: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    lastname: true,
                    department: { select: { name: true } },
                    company: { select: { dateFormat: true } }
                }
            },
            approver: true,
            approvalSteps: {
                include: {
                    approver: true,
                    role: true
                },
                orderBy: { sequenceOrder: 'asc' }
            }
        }
    });

    if (!request) {
        return (
            <div className="p-8">
                <div className="alert alert-error">Request not found</div>
                <Button asChild className="mt-4"><Link href="/requests/my">Back to Requests</Link></Button>
            </div>
        );
    }

    // Access Control
    const canView = user.isAdmin || user.id === request.userId || request.approvalSteps.some(s => s.approverId === user.id) || request.approverId === user.id;
    if (!canView) {
        return <div className="p-8">Unauthorized</div>;
    }

    const isOwner = user.id === request.userId;
    const duration = differenceInDays(new Date(request.dateEnd), new Date(request.dateStart)) + 1; // Approx for display

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/requests/my">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                    </Link>
                </Button>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Request Details</h2>
                    <p className="text-muted-foreground">
                        Reference ID: {request.id.slice(0, 8)}
                    </p>
                </div>
                <div>
                    <RequestActions
                        requestId={request.id}
                        status={request.status}
                        isOwner={isOwner}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">

                {/* Main Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>{request.leaveType.name}</span>
                            <StatusBadge status={request.status} />
                        </CardTitle>
                        <CardDescription>
                            Submitted by {request.user.name} {request.user.lastname} on {format(new Date(request.createdAt), 'PPP')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">From</div>
                                <div className="text-lg font-semibold">
                                    {format(new Date(request.dateStart.getTime() + request.dateStart.getTimezoneOffset() * 60000), 'PPP')}
                                    {request.dayPartStart !== DayPart.ALL && <span className="text-sm font-normal text-muted-foreground ml-1">({request.dayPartStart.toLowerCase()})</span>}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">To</div>
                                <div className="text-lg font-semibold">
                                    {format(new Date(request.dateEnd.getTime() + request.dateEnd.getTimezoneOffset() * 60000), 'PPP')}
                                    {request.dayPartEnd !== DayPart.ALL && <span className="text-sm font-normal text-muted-foreground ml-1">({request.dayPartEnd.toLowerCase()})</span>}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Employee Comment</div>
                            <p className="mt-1">{request.employeeComment || "No comment provided."}</p>
                        </div>

                        {request.approverComment && (
                            <div className="bg-muted p-3 rounded-md">
                                <div className="text-sm font-medium text-muted-foreground mb-1">Approver Note</div>
                                <p className="text-sm">{request.approverComment}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Approval Timeline */}
                <Card>
                    <CardHeader>
                        <CardTitle>Approval Workflow</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative border-l ml-3 pl-6 space-y-6 my-2">
                            {/* Steps */}
                            {request.approvalSteps.length > 0 ? (
                                request.approvalSteps.map((step, index) => (
                                    <div key={step.id} className="relative">
                                        <div className={`absolute -left-[31px] bg-background rounded-full p-1 border ${step.status === 1 ? "border-green-500 text-green-500" :
                                            step.status === 2 ? "border-red-500 text-red-500" :
                                                "border-gray-300 text-gray-400"
                                            }`}>
                                            {step.status === 1 ? <CheckCircle2 className="w-4 h-4" /> :
                                                step.status === 2 ? <XCircle className="w-4 h-4" /> :
                                                    <Clock className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">
                                                {step.status === 1 ? "Approved by" :
                                                    step.status === 2 ? "Rejected by" :
                                                        "Pending approval from"}
                                                <span className="ml-1">{step.approver.name} {step.approver.lastname}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground mb-1">
                                                {step.role?.name || "Stage " + (index + 1)}
                                            </p>

                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="relative">
                                    <div className={`absolute -left-[31px] bg-background rounded-full p-1 border ${request.status === LeaveStatus.APPROVED ? "border-green-500 text-green-500" :
                                        request.status === LeaveStatus.REJECTED ? "border-red-500 text-red-500" :
                                            "border-gray-300 text-gray-400"
                                        }`}>
                                        {request.status === LeaveStatus.APPROVED ? <CheckCircle2 className="w-4 h-4" /> :
                                            request.status === LeaveStatus.REJECTED ? <XCircle className="w-4 h-4" /> :
                                                <Clock className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">
                                            {request.status === LeaveStatus.APPROVED ? "Approved" :
                                                request.status === LeaveStatus.REJECTED ? "Rejected" :
                                                    "Direct Approval"}
                                        </p>
                                        {request.approver && (
                                            <p className="text-xs text-muted-foreground">
                                                By {request.approver.name} {request.approver.lastname}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
