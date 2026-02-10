"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CalendarAbsenceBadgeProps {
    absence: {
        user_name: string;
        leave_type: string;
        color: string;
        status: string;
        day_part: string;
        is_holiday?: boolean;
    };
    compact?: boolean;
}

function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
        case 'approved':
            return '#22c55e'; // green
        case 'rejected':
            return '#ef4444'; // red  
        case 'pending':
        case 'new':
            return '#faf2c8'; // light yellow
        default:
            return '#94a3b8'; // slate
    }
}

export function CalendarAbsenceBadge({ absence, compact }: CalendarAbsenceBadgeProps) {
    const isNew = absence.status === 'new';
    const statusColor = getStatusColor(absence.status);

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            "group relative flex items-center gap-2 px-2 py-1 rounded-md text-[10px] font-bold cursor-help transition-all hover:scale-[1.02]",
                            isNew ? "border-2 border-dashed" : ""
                        )}
                        style={{
                            backgroundColor: `var(--absence-bg, ${statusColor}15)`,
                            color: `var(--absence-color, ${statusColor})`,
                            borderColor: isNew ? `var(--absence-border, ${statusColor})` : 'transparent'
                        }}
                    >
                        <div className="size-1.5 rounded-full" style={{ backgroundColor: `var(--absence-dot, ${statusColor})` }} />
                        {!compact && <span className="truncate">{absence.user_name}</span>}
                        {compact && <span className="truncate">{absence.user_name.split(' ')[0][0]}</span>}
                        {absence.is_holiday && (
                            <div className="ml-auto size-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse" title="Bank Holiday" />
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-slate-900 text-white border-slate-800 p-3 rounded-xl shadow-xl">
                    <p className="font-black text-xs mb-1">
                        {absence.user_name}
                        {absence.is_holiday && <span className="ml-2 text-rose-400"> (Bank Holiday)</span>}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                        {absence.leave_type} • {absence.status}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] bg-white/5 rounded-lg p-2">
                        <span className="text-white">Part: {absence.day_part}</span>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
