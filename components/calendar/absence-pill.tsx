"use client";

import * as React from "react";
import {
    Sun,
    Briefcase,
    UserMinus,
    Heart,
    Baby,
    Home,
    Plane,
    MoreHorizontal,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
        day_part_start?: string;
        day_part_end?: string;
        is_holiday?: boolean;
    };
    isStart: boolean;
    isEnd: boolean;
    className?: string;
}

const leaveTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    Holiday: Sun,
    "Sick Leave": Heart,
    "Work From Home": Home,
    "Business Trip": Briefcase,
    "Parental Leave": Baby,
    "Bereavement Leave": UserMinus,
    "Unpaid Leave": Clock,
    "Study Leave": Calendar,
    default: MoreHorizontal
};

const leaveTypeColors: Record<string, string> = {
    "Holiday": "#22c55e",
    "Sick Leave": "#ef4444",
    "Work From Home": "#3b82f6",
    "Business Trip": "#8b5cf6",
    "Parental Leave": "#f59e0b",
    "Bereavement Leave": "#6b7280",
    default: "#94a3b8"
};

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getDayPartLabel(part: string | undefined, isStart: boolean, isEnd: boolean): string {
    if (!part) return 'Full Day';
    if (isStart && part === 'afternoon') return 'Morning Only';
    if (isEnd && part === 'morning') return 'Afternoon Only';
    return 'Full Day';
}

function getStatusIcon(status: string) {
    switch (status.toLowerCase()) {
        case 'approved': return <CheckCircle2 className="w-3 h-3 text-green-500" />;
        case 'rejected': return <XCircle className="w-3 h-3 text-red-500" />;
        case 'pending':
        case 'new': return <AlertCircle className="w-3 h-3 text-yellow-600" />;
        default: return null;
    }
}

function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
        case 'approved': return '#22c55e'; // green
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

export function AbsencePill({ absence, isStart, isEnd, className }: AbsencePillProps) {
    const Icon = leaveTypeIcons[absence.leave_type] || leaveTypeIcons.default;
    const color = getStatusColor(absence.status);
    const isNew = absence.status === 'new';

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div
                    className={cn(
                        "h-6 z-0 group/abs relative transition-all cursor-pointer",
                        isNew && "opacity-80",
                        className
                    )}
                    title={`${absence.leave_type} (${absence.status})`}
                >
                    <div
                        className={cn(
                            "absolute inset-y-0",
                            isStart ? "rounded-l-sm left-0" : "-left-1",
                            isEnd ? "rounded-r-sm right-0" : "-right-1"
                        )}
                        style={{
                            backgroundColor: color,
                            left: `var(--absence-left, ${isStart && absence.day_part_start === 'afternoon' ? '50%' : (isStart ? '0' : '-4px')})`,
                            right: `var(--absence-right, ${isEnd && absence.day_part_end === 'morning' ? '50%' : (isEnd ? '0' : '-4px')})`,
                        }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                            <Icon className="w-3 h-3 text-white/90" />
                        </div>
                    </div>
                </div>
            </PopoverTrigger>
            <PopoverContent side="top" align="center" className="w-64 p-0 overflow-hidden">
                    <div className="p-3" style={{ backgroundColor: `${color}15` }}>
                        <div className="flex items-center gap-2 mb-2">
                            <div
                                className="w-8 h-8 rounded-sm flex items-center justify-center"
                                style={{ backgroundColor: color }}
                            >
                                <Icon className="w-4 h-4 text-white" />
                            </div>
                        <div>
                            <p className="font-bold text-sm text-slate-900">{absence.leave_type}</p>
                            <p className="text-xs text-slate-500">{absence.user_name}</p>
                        </div>
                        {getStatusIcon(absence.status)}
                    </div>
                        <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-medium", getStatusBadgeColor(absence.status))}>
                        {absence.status.charAt(0).toUpperCase() + absence.status.slice(1)}
                    </div>
                </div>
                <div className="px-3 py-2 space-y-1.5 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(absence.start_date)} - {formatDate(absence.end_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{getDayPartLabel(absence.day_part_start, isStart, isEnd)}</span>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
