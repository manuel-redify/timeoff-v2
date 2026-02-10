"use client";

import { useEffect, useState } from "react";
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    format,
    isToday
} from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarAbsenceBadge } from "../calendar/calendar-absence-badge";
import { Skeleton } from "@/components/ui/skeleton";

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

interface MonthViewProps {
    date: Date;
    filters?: {
        departmentId?: string;
        userId?: string;
        leaveTypeId?: string;
        view?: string;
        departmentIds?: string[];
        projectIds?: string[];
        roleIds?: string[];
        areaIds?: string[];
    };
}

export function MonthView({ date, filters }: MonthViewProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userCompany, setUserCompany] = useState<any>(null);

    // Fetch user company data to determine appropriate view
    useEffect(() => {
        async function fetchUserData() {
            try {
                const res = await fetch('/api/users/me');
                if (res.ok) {
                    const json = await res.json();
                    setUserCompany(json.company);
                }
            } catch (error) {
                console.error("Failed to fetch user data:", error);
            }
        }
        fetchUserData();
    }, []);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                let url = `/api/calendar/month?year=${year}&month=${month}`;

                let viewToUse = filters?.view;
                
                // If no view is specified, determine the best default
                if (!viewToUse && userCompany) {
                    if (userCompany.shareAllAbsences) {
                        viewToUse = 'company'; // Show company-wide if sharing is enabled
                    } else {
                        viewToUse = 'team'; // Default to team view
                    }
                } else if (!viewToUse) {
                    viewToUse = 'team'; // Fallback
                }

                url += `&view=${viewToUse}`;

                if (filters?.departmentId) url += `&department_id=${filters.departmentId}`;
                if (filters?.userId) url += `&user_id=${filters.userId}`;
                if (filters?.leaveTypeId) url += `&leave_type_id=${filters.leaveTypeId}`;
                
                // Add array filters
                filters?.departmentIds?.forEach(id => url += `&department_ids=${id}`);
                filters?.projectIds?.forEach(id => url += `&project_ids=${id}`);
                filters?.roleIds?.forEach(id => url += `&role_ids=${id}`);
                filters?.areaIds?.forEach(id => url += `&area_ids=${id}`);

                const res = await fetch(url);
                if (res.ok) {
                    const json = await res.json();
                    setData(json.data);
                }
            } catch (error) {
                console.error("Failed to fetch calendar data:", error);
            } finally {
                setLoading(false);
            }
        }
        
        // Only fetch when we have company data or it has changed
        if (userCompany !== null) {
            fetchData();
        }
    }, [date, filters, userCompany]);

    // Generate calendar days
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd
    });

    const dayAbbrevs = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    const dayHeaders = calendarDays.slice(0, 7).map((day, idx) => ({
        abbr: dayAbbrevs[idx],
        day: format(day, 'd')
    }));

    if (loading && !data) {
        return (
            <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className="bg-white min-h-[140px] p-4">
                        <Skeleton className="h-4 w-8 mb-4" />
                        <Skeleton className="h-3 w-full mb-2" />
                        <Skeleton className="h-3 w-2/3" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Headers */}
            <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                {dayHeaders.map((header, idx) => (
                    <div key={idx} className="py-2 md:py-3 px-1 md:px-4 text-center">
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span className="hidden md:inline">{header.abbr} {header.day}</span>
                            <span className="md:hidden">{header.abbr[0]}</span>
                        </span>
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-px bg-slate-200">
                {calendarDays.map((day, i) => {
                    const inMonth = isSameMonth(day, monthStart);
                    const isCurrentToday = isToday(day);
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const dayData = data?.dates?.find((d: any) => d.date === dayStr);

                    // We only highlight the background in personal view if it's a holiday for that user
                    const isPersonalViewHoliday = data?.view === 'personal' && dayData?.holiday_countries?.length > 0;

                    return (
                        <div
                            key={day.toString()}
                            className={cn(
                                "min-h-[80px] md:min-h-[140px] p-1 md:p-2 transition-colors hover:bg-slate-50/50 group",
                                "bg-white",
                                !inMonth && "bg-slate-50/30 text-slate-400",
                                isPersonalViewHoliday && "bg-rose-50/30"
                            )}
                        >
                            <div className="flex justify-between items-start mb-1 md:mb-2 px-1">
                                <span className={cn(
                                    "text-[10px] md:text-xs font-black p-0.5 md:p-1 size-5 md:size-6 flex items-center justify-center rounded-lg md:rounded-lg text-slate-600",
                                    !inMonth && "opacity-30"
                                )}>
                                    {format(day, 'd')}
                                </span>

                                {/* Show small indicator dots for each country that has a holiday here (except personal view) */}
                                {data?.view !== 'personal' && dayData?.holiday_countries?.length > 0 && (
                                    <div className="flex gap-0.5" title="Bank Holiday">
                                        {dayData.holiday_countries.map((code: string) => (
                                            <div
                                                key={code}
                                                className="size-1 md:size-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.3)] animate-pulse"
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-0.5 md:space-y-1 overflow-y-auto max-h-[50px] md:max-h-[100px] scrollbar-hide">
                                {/* Map absences, and check if each absence user has a holiday */}
                                {dayData?.absences.map((abs: any) => {
                                    // In Team/Company view, we can check if the user's country specifically has a holiday
                                    const userIsHolidays = data?.holidays_map?.[abs.user_country]?.includes(dayStr);
                                    return (
                                        <div key={abs.id} className="relative group/abs">
                                            {/* Normal absence badge */}
                                            <div className="hidden sm:block">
                                                <CalendarAbsenceBadge absence={{ ...abs, is_holiday: userIsHolidays }} />
                                            </div>
                                            {/* Mobile dots */}
                                            <div className="sm:hidden flex justify-center py-0.5">
                                                <div
                                                    className={cn(
                                                        "size-2 md:size-3 rounded-full shadow-sm",
                                                        (abs.status === 'new' || abs.status === 'pending') && "opacity-50",
                                                        userIsHolidays && "ring-2 ring-rose-300 ring-offset-1"
                                                    )}
                                                    style={{ backgroundColor: getStatusColor(abs.status) }}
                                                    title={`${abs.user_name}: ${abs.leave_type}${userIsHolidays ? ' (Bank Holiday)' : ''}`}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
