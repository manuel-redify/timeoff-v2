"use client";

import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AbsencePillProps {
    absence: {
        id: string;
        user_name: string;
        leave_type: string;
        color: string;
        status: string;
        start_date: string;
        end_date: string;
        employee_comment?: string | null;
        day_part_start?: string;
        day_part_end?: string;
        is_holiday?: boolean;
    };
    isStart: boolean;
    isEnd: boolean;
    intervalLabel?: string;
    durationLabel?: string;
    style?: React.CSSProperties;
    className?: string;
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Icon({
    className,
    children,
    viewBox = "0 0 24 24",
}: {
    className?: string;
    children: React.ReactNode;
    viewBox?: string;
}) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox={viewBox}
        >
            {children}
        </svg>
    );
}

function CalendarIcon({ className }: { className?: string }) {
    return (
        <Icon className={className}>
            <path d="M8 2v4" />
            <path d="M16 2v4" />
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <path d="M3 10h18" />
        </Icon>
    );
}

function ClockIcon({ className }: { className?: string }) {
    return (
        <Icon className={className}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
        </Icon>
    );
}

function CheckCircleIcon({ className }: { className?: string }) {
    return (
        <Icon className={className}>
            <circle cx="12" cy="12" r="9" />
            <path d="m9 12 2 2 4-4" />
        </Icon>
    );
}

function XCircleIcon({ className }: { className?: string }) {
    return (
        <Icon className={className}>
            <circle cx="12" cy="12" r="9" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
        </Icon>
    );
}

function AlertCircleIcon({ className }: { className?: string }) {
    return (
        <Icon className={className}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5" />
            <path d="M12 16h.01" />
        </Icon>
    );
}

function getStatusIcon(status: string) {
    switch (status.toLowerCase()) {
        case 'approved': return <CheckCircleIcon className="h-3 w-3 text-green-500" />;
        case 'rejected': return <XCircleIcon className="h-3 w-3 text-red-500" />;
        case 'pending':
        case 'new': return <AlertCircleIcon className="h-3 w-3 text-yellow-600" />;
        default: return null;
    }
}

function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
        case 'approved': return '#dcfae7'; // light green
        case 'rejected': return '#ef4444'; // red  
        case 'pending':
        case 'new': return '#faf2c8'; // light yellow
        default:
            return '#94a3b8'; // slate
    }
}

function getStatusBadgeColor(status: string): string {
    switch (status.toLowerCase()) {
        case 'approved': return 'bg-green-100 text-green-700';
        case 'rejected': return 'bg-red-100 text-red-700';
        case 'pending':
        case 'new': return 'bg-yellow-100 text-yellow-700';
        default: return 'bg-slate-100 text-slate-700';
    }
}

export function AbsencePill({ absence, isStart, isEnd, intervalLabel, durationLabel, style, className }: AbsencePillProps) {
    const color = getStatusColor(absence.status);
    const isNew = absence.status === 'new';
    const exactLabel = `${absence.user_name} | ${absence.leave_type}`;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "group/abs absolute z-0 block cursor-pointer appearance-none border-0 bg-transparent p-0 text-left transition-all",
                        isNew && "opacity-80",
                        className
                    )}
                    title={`${absence.leave_type} (${absence.status})`}
                    aria-label={exactLabel}
                    style={style}
                >
                    <div
                        className={cn(
                            "absolute inset-0 rounded-[4px]",
                            !isStart && "rounded-l-none",
                            !isEnd && "rounded-r-none"
                        )}
                        style={{
                            backgroundColor: color,
                        }}
                    />
                </button>
            </TooltipTrigger>
            <TooltipContent side="top" align="center" sideOffset={8} className="w-72 rounded-lg border border-slate-200 bg-white px-0 py-0 text-slate-900 shadow-lg">
                <div className="p-3">
                    <div className="mb-2 flex items-center gap-2">
                        <div
                            className="h-8 w-1.5 rounded-full"
                            style={{ backgroundColor: absence.color }}
                        />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{absence.user_name}</p>
                            <p className="truncate text-xs text-slate-500">{absence.leave_type}</p>
                        </div>
                        <div className={cn("inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] font-medium", getStatusBadgeColor(absence.status))}>
                            {getStatusIcon(absence.status)}
                            <span>{absence.status.charAt(0).toUpperCase() + absence.status.slice(1)}</span>
                        </div>
                    </div>

                    <p className="mb-3 text-[11px] leading-relaxed text-slate-600">
                        {exactLabel}
                    </p>

                    <div className="space-y-1.5 border-t border-slate-100 pt-2">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                            <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                            <span>{formatDate(absence.start_date)} - {formatDate(absence.end_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                            <ClockIcon className="h-3.5 w-3.5 text-slate-400" />
                            <span>{intervalLabel}</span>
                            {durationLabel ? <span className="text-slate-500">•</span> : null}
                            {durationLabel ? <span>{durationLabel}</span> : null}
                        </div>
                    </div>
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
