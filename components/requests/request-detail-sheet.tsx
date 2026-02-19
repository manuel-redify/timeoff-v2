"use client";

import * as React from "react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { LeaveDetailsDrawer } from "@/components/ui/leave-details-drawer";
import { LeaveDetailsMetadata } from "@/components/ui/leave-details-metadata";
import { WorkflowTimeline, ApprovalStepData } from "@/components/ui/workflow-timeline";
import { RejectionComment } from "@/components/ui/rejection-comment";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { RequestActions } from "@/components/requests/request-actions";
import { DayPart } from "@/lib/generated/prisma/enums";
import { format } from "date-fns";

interface ApprovalStep {
    id: string;
    status: number;
    sequenceOrder: number | null;
    createdAt: Date;
    updatedAt: Date;
    approver: { name: string; lastname: string; };
    role: { name: string; } | null;
}

interface RequestDetail {
    id: string;
    status: string;
    dateStart: Date;
    dateEnd: Date;
    dayPartStart: DayPart;
    dayPartEnd: DayPart;
    employeeComment: string | null;
    approverComment: string | null;
    createdAt: Date;
    leaveType: { id: string; name: string; color: string; };
    user: { id: string; name: string; lastname: string; department: { name: string } | null; };
    approver: { name: string; lastname: string; } | null;
    approvalSteps: ApprovalStep[];
}

const detailCache = new Map<string, RequestDetail>();

export function prefetchRequest(requestId: string) {
    if (detailCache.has(requestId)) return;
    fetch(`/api/leave-requests/${requestId}`)
        .then((res) => res.json())
        .then((data) => detailCache.set(requestId, data))
        .catch(() => {});
}

export function RequestDetailSheet() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [request, setRequest] = useState<RequestDetail | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fetchingRef = useRef<string | null>(null);

    const requestId = searchParams.get("requestId");
    const isOpen = requestId !== null;

    useEffect(() => {
        if (!requestId) {
            setRequest(null);
            setError(null);
            fetchingRef.current = null;
            return;
        }

        if (fetchingRef.current === requestId) return;
        
        const cached = detailCache.get(requestId);
        if (cached) {
            setRequest(cached);
            setError(null);
            return;
        }

        fetchingRef.current = requestId;
        setError(null);
        
        fetch(`/api/leave-requests/${requestId}`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch");
                return res.json();
            })
            .then((data) => {
                detailCache.set(requestId, data);
                setRequest(data);
            })
            .catch((err) => setError(err.message))
            .finally(() => {
                fetchingRef.current = null;
            });
    }, [requestId]);

    const handleClose = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("requestId");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [router, pathname, searchParams]);

    return (
        <LeaveDetailsDrawer
            open={isOpen}
            onOpenChange={(open) => !open && handleClose()}
            referenceId={requestId?.slice(0, 8) || ""}
            status={request?.status || ""}
            externalLinkHref={requestId ? `/requests/${requestId}` : undefined}
        >
            {error && (
                <div className="flex flex-col items-center justify-center h-48 gap-4 p-6">
                    <p className="text-sm text-red-500">{error}</p>
                    <button onClick={handleClose} className="text-sm text-neutral-500 hover:text-neutral-700">
                        Close
                    </button>
                </div>
            )}

            {!request && !error && <LoadingSkeleton />}

            {request && !error && <DrawerContent request={request} />}
        </LeaveDetailsDrawer>
    );
}

const LoadingSkeleton = React.memo(function LoadingSkeleton() {
    return (
        <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div><Skeleton className="h-3 w-16 mb-1" /><Skeleton className="h-5 w-20" /></div>
                <div><Skeleton className="h-3 w-16 mb-1" /><Skeleton className="h-5 w-20" /></div>
            </div>
            <Separator className="bg-neutral-200" />
            <div><Skeleton className="h-3 w-20 mb-1" /><Skeleton className="h-5 w-28" /></div>
            <div><Skeleton className="h-3 w-24 mb-1" /><Skeleton className="h-5 w-32" /></div>
            <Separator className="bg-neutral-200" />
            <div><Skeleton className="h-3 w-28 mb-3" /><div className="space-y-3">
                <div className="flex items-center gap-3"><Skeleton className="h-5 w-5 rounded-full" /><Skeleton className="h-4 w-32" /></div>
            </div></div>
        </div>
    );
});

const DrawerContent = React.memo(function DrawerContent({ request }: { request: RequestDetail }) {
    return (
        <div className="space-y-0">
            <LeaveDetailsMetadata
                leaveType={request.leaveType.name}
                leaveTypeColor={request.leaveType.color}
                dateStart={request.dateStart}
                dateEnd={request.dateEnd}
                dayPartStart={request.dayPartStart}
                dayPartEnd={request.dayPartEnd}
                employeeComment={request.employeeComment}
            />
            <Separator className="bg-neutral-200" />
            <div className="p-6 space-y-4">
                <div>
                    <div className="text-xs font-medium text-neutral-400 mb-1">Requested by</div>
                    <div className="text-sm">
                        {request.user.name} {request.user.lastname}
                        {request.user.department && <span className="text-neutral-400 ml-1">({request.user.department.name})</span>}
                    </div>
                </div>
                <div>
                    <div className="text-xs font-medium text-neutral-400 mb-1">Submitted</div>
                    <div className="text-sm">{format(new Date(request.createdAt), "MMM d, yyyy 'at' h:mm a")}</div>
                </div>
            </div>
            <Separator className="bg-neutral-200" />
            <RejectionComment status={request.status} approverComment={request.approverComment} className="mx-6 mt-6" />
            <WorkflowTimeline steps={request.approvalSteps as ApprovalStepData[]} />
            <Separator className="bg-neutral-200" />
            <div className="p-6 flex gap-2">
                <RequestActions requestId={request.id} status={request.status as any} isOwner={true} />
            </div>
        </div>
    );
});
