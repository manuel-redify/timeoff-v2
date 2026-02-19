"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ExternalLink, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { DayPart } from "@/lib/generated/prisma/enums";
import { RequestActions } from "@/components/requests/request-actions";

interface ApprovalStep {
    id: string;
    status: number;
    sequenceOrder: number;
    approver: {
        name: string;
        lastname: string;
    };
    role: {
        name: string;
    } | null;
}

interface RequestDetail {
    id: string;
    status: string;
    dateStart: Date;
    dateEnd: Date;
    dayPartStart: string;
    dayPartEnd: string;
    employeeComment: string | null;
    approverComment: string | null;
    createdAt: Date;
    leaveType: {
        id: string;
        name: string;
        color: string;
    };
    user: {
        id: string;
        name: string;
        lastname: string;
        department: { name: string } | null;
    };
    approver: {
        name: string;
        lastname: string;
    } | null;
    approvalSteps: ApprovalStep[];
}

export function RequestDetailSheet() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [request, setRequest] = useState<RequestDetail | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const requestId = searchParams.get("requestId");
    const isOpen = requestId !== null;

    useEffect(() => {
        if (requestId) {
            setIsLoading(true);
            setError(null);
            fetch(`/api/leave-requests/${requestId}`)
                .then((res) => {
                    if (!res.ok) throw new Error("Failed to fetch request");
                    return res.json();
                })
                .then((data) => {
                    setRequest(data);
                })
                .catch((err) => {
                    setError(err.message);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setRequest(null);
        }
    }, [requestId]);

    const handleClose = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("requestId");
        router.push(`${pathname}?${params.toString()}`);
    };

    const formatDateSafe = (date: Date) => {
        return format(
            new Date(new Date(date).getTime() + new Date(date).getTimezoneOffset() * 60000),
            "MMM d, yyyy"
        );
    };

    const isOwner = request?.user ? true : false;

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                <VisuallyHidden.Root>
                    <SheetTitle>Request Details</SheetTitle>
                </VisuallyHidden.Root>
                {isLoading && (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                    </div>
                )}

                {error && (
                    <div className="flex flex-col items-center justify-center h-48 gap-4">
                        <p className="text-sm text-red-500">{error}</p>
                        <Button variant="outline" onClick={handleClose}>
                            Close
                        </Button>
                    </div>
                )}

                {request && !isLoading && (
                    <>
                        <SheetHeader className="space-y-3">
                            <div className="flex items-center justify-between">
                                <SheetTitle className="text-lg font-semibold">
                                    {request.leaveType.name}
                                </SheetTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-sm"
                                    asChild
                                >
                                    <Link href={`/requests/${request.id}`}>
                                        <ExternalLink className="h-4 w-4" />
                                        <span className="sr-only">Open full page</span>
                                    </Link>
                                </Button>
                            </div>
                            <SheetDescription className="flex items-center gap-2">
                                <span className="text-xs text-neutral-400">
                                    Ref: {request.id.slice(0, 8)}
                                </span>
                                <StatusBadge status={request.status} />
                            </SheetDescription>
                        </SheetHeader>

                        <div className="mt-6 space-y-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs font-medium text-neutral-400 mb-1">
                                            From
                                        </div>
                                        <div className="text-sm font-medium">
                                            {formatDateSafe(request.dateStart)}
                                            {request.dayPartStart !== DayPart.ALL && (
                                                <span className="text-xs text-neutral-400 ml-1">
                                                    ({request.dayPartStart.toLowerCase()})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium text-neutral-400 mb-1">
                                            To
                                        </div>
                                        <div className="text-sm font-medium">
                                            {formatDateSafe(request.dateEnd)}
                                            {request.dayPartEnd !== DayPart.ALL && (
                                                <span className="text-xs text-neutral-400 ml-1">
                                                    ({request.dayPartEnd.toLowerCase()})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Separator className="bg-neutral-200" />

                                <div>
                                    <div className="text-xs font-medium text-neutral-400 mb-1">
                                        Requested by
                                    </div>
                                    <div className="text-sm">
                                        {request.user.name} {request.user.lastname}
                                        {request.user.department && (
                                            <span className="text-neutral-400 ml-1">
                                                ({request.user.department.name})
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs font-medium text-neutral-400 mb-1">
                                        Submitted
                                    </div>
                                    <div className="text-sm">
                                        {format(new Date(request.createdAt), "MMM d, yyyy 'at' h:mm a")}
                                    </div>
                                </div>

                                {request.employeeComment && (
                                    <div>
                                        <div className="text-xs font-medium text-neutral-400 mb-1">
                                            Employee Comment
                                        </div>
                                        <p className="text-sm text-neutral-600">
                                            {request.employeeComment}
                                        </p>
                                    </div>
                                )}

                                {request.approverComment && (
                                    <div className="bg-red-50 p-3 rounded-md">
                                        <div className="text-xs font-medium text-red-600 mb-1">
                                            Approver Note
                                        </div>
                                        <p className="text-sm text-red-700">
                                            {request.approverComment}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <Separator className="bg-neutral-200" />

                            <div>
                                <div className="text-xs font-medium text-neutral-400 mb-3">
                                    Approval Workflow
                                </div>
                                <div className="relative border-l border-neutral-200 ml-3 pl-6 space-y-4">
                                    {request.approvalSteps.length > 0 ? (
                                        request.approvalSteps.map((step, index) => (
                                            <div key={step.id} className="relative">
                                                <div
                                                    className={`absolute -left-[31px] bg-white rounded-full p-1 border ${
                                                        step.status === 1
                                                            ? "border-green-500 text-green-500"
                                                            : step.status === 2
                                                              ? "border-red-500 text-red-500"
                                                              : "border-neutral-200 text-neutral-400"
                                                    }`}
                                                >
                                                    {step.status === 1 ? (
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    ) : step.status === 2 ? (
                                                        <XCircle className="w-4 h-4" />
                                                    ) : (
                                                        <Clock className="w-4 h-4" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {step.status === 1
                                                            ? "Approved by"
                                                            : step.status === 2
                                                              ? "Rejected by"
                                                              : "Pending approval from"}
                                                        <span className="ml-1">
                                                            {step.approver.name} {step.approver.lastname}
                                                        </span>
                                                    </p>
                                                    <p className="text-xs text-neutral-400">
                                                        {step.role?.name || `Stage ${index + 1}`}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="relative">
                                            <div
                                                className={`absolute -left-[31px] bg-white rounded-full p-1 border ${
                                                    request.status === "APPROVED"
                                                        ? "border-green-500 text-green-500"
                                                        : request.status === "REJECTED"
                                                          ? "border-red-500 text-red-500"
                                                          : "border-neutral-200 text-neutral-400"
                                                }`}
                                            >
                                                {request.status === "APPROVED" ? (
                                                    <CheckCircle2 className="w-4 h-4" />
                                                ) : request.status === "REJECTED" ? (
                                                    <XCircle className="w-4 h-4" />
                                                ) : (
                                                    <Clock className="w-4 h-4" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {request.status === "APPROVED"
                                                        ? "Approved"
                                                        : request.status === "REJECTED"
                                                          ? "Rejected"
                                                          : "Pending"}
                                                </p>
                                                {request.approver && (
                                                    <p className="text-xs text-neutral-400">
                                                        By {request.approver.name} {request.approver.lastname}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator className="bg-neutral-200" />

                            <div className="flex gap-2">
                                <RequestActions
                                    requestId={request.id}
                                    status={request.status as any}
                                    isOwner={true}
                                />
                            </div>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
