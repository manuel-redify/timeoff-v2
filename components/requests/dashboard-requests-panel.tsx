"use client";

import { useCallback, useState } from "react";
import { RequestsTable } from "@/components/requests/requests-table";
import { RequestDetailSheet } from "@/components/requests/request-detail-sheet";

interface LeaveType {
    id: string;
    name: string;
    color: string;
}

interface RequestRow {
    id: string;
    leaveType: LeaveType;
    dateStart: Date;
    dateEnd: Date;
    dayPartStart: string;
    dayPartEnd: string;
    durationMinutes: number;
    status: string;
    createdAt: Date;
}

interface DashboardRequestsPanelProps {
    requests: RequestRow[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    minutesPerDay?: number;
    initialRequestId?: string | null;
}

export function DashboardRequestsPanel({
    requests,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    minutesPerDay = 480,
    initialRequestId = null,
}: DashboardRequestsPanelProps) {
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(initialRequestId);

    const syncRequestIdInUrl = useCallback((requestId: string | null) => {
        const url = new URL(window.location.href);
        if (requestId) {
            url.searchParams.set("requestId", requestId);
        } else {
            url.searchParams.delete("requestId");
        }
        window.history.replaceState(window.history.state, "", url.toString());
    }, []);

    const handleOpenRequest = useCallback((requestId: string) => {
        setSelectedRequestId(requestId);
        syncRequestIdInUrl(requestId);
    }, [syncRequestIdInUrl]);

    const handleCloseRequest = useCallback(() => {
        setSelectedRequestId(null);
        syncRequestIdInUrl(null);
    }, [syncRequestIdInUrl]);

    return (
        <>
            <RequestsTable
                requests={requests}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                minutesPerDay={minutesPerDay}
                onViewRequest={handleOpenRequest}
            />
            <RequestDetailSheet requestId={selectedRequestId} onClose={handleCloseRequest} />
        </>
    );
}
