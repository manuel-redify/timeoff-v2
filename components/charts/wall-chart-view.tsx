"use client";

import { useEffect, useState } from "react";
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    isSameDay,
    isToday,
    isWeekend,
    isSameMonth
} from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { AbsencePill } from "@/components/calendar/absence-pill";
import { EmptyState, ErrorState } from "@/components/calendar/calendar-states";

interface WallChartViewProps {
    date: Date;
    filters?: {
        departmentId?: string;
        userId?: string;
        leaveTypeId?: string;
    };
}

export function WallChartView({ date, filters }: WallChartViewProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                const startStr = format(monthStart, 'yyyy-MM-dd');
                const endStr = format(monthEnd, 'yyyy-MM-dd');
                let url = `/api/calendar/wall-chart?start_date=${startStr}&end_date=${endStr}`;

                if (filters?.departmentId) url += `&department_id=${filters.departmentId}`;
                if (filters?.userId) url += `&user_ids=${filters.userId}`;

                const res = await fetch(url);
                if (res.ok) {
                    const json = await res.json();
                    setData(json.data);
                } else {
                    setError("Failed to load calendar data");
                }
            } catch (err) {
                setError("Failed to connect to the server");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [date, filters]);

    if (loading && !data) {
        return (
            <div className="bg-white border border-[#e5e7eb] rounded-lg overflow-hidden overflow-x-auto">
                <table className="border-collapse min-w-max">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-slate-50 border-b border-[#e5e7eb]">
                            <th className="sticky left-0 z-30 bg-slate-50 p-2 md:p-4 text-left border-r border-[#e5e7eb] min-w-[120px] md:min-w-[200px]">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</span>
                            </th>
                            {Array.from({ length: 31 }).map((_, i) => (
                                <th key={i} className="p-1 md:p-2 text-center min-w-[30px] md:min-w-[36px] lg:min-w-[40px] border-r border-[#e5e7eb] last:border-r-0 flex-shrink-0">
                                    <div className="flex flex-col items-center gap-0.5 md:gap-1">
                                        <div className="h-3 w-3 rounded bg-slate-200 animate-pulse" />
                                        <div className="h-5 w-5 md:h-6 md:w-6 rounded bg-slate-200 animate-pulse" />
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 8 }).map((_, rowI) => (
                            <tr key={rowI} className="border-b border-[#e5e7eb] last:border-b-0">
                                <td className="sticky left-0 z-20 bg-white p-2 md:p-4 border-r border-[#e5e7eb] min-w-[120px] md:min-w-[200px]">
                                    <div className="flex flex-col gap-1">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </td>
                                {Array.from({ length: 31 }).map((_, cellI) => (
                                    <td key={cellI} className="p-1 border-r border-[#e5e7eb] last:border-r-0 h-[60px] min-w-[30px] md:min-w-[36px] lg:min-w-[40px] flex-shrink-0">
                                        <div className="h-6 w-full rounded bg-slate-100 animate-pulse" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (!data || !data.users) {
        if (error) {
            return (
                <div className="bg-white border border-[#e5e7eb] rounded-lg overflow-hidden">
                    <ErrorState error={error} onRetry={() => {
                        setError(null);
                        setLoading(true);
                        const fetchData = async () => {
                            try {
                                const startStr = format(monthStart, 'yyyy-MM-dd');
                                const endStr = format(monthEnd, 'yyyy-MM-dd');
                                let url = `/api/calendar/wall-chart?start_date=${startStr}&end_date=${endStr}`;
                                if (filters?.departmentId) url += `&department_id=${filters.departmentId}`;
                                if (filters?.userId) url += `&user_ids=${filters.userId}`;
                                const res = await fetch(url);
                                if (res.ok) {
                                    const json = await res.json();
                                    setData(json.data);
                                }
                            } catch (err) {
                                setError("Failed to connect to the server");
                            } finally {
                                setLoading(false);
                            }
                        };
                        fetchData();
                    }} />
                </div>
            );
        }
        return (
            <div className="bg-white border border-[#e5e7eb] rounded-lg overflow-hidden">
                <EmptyState />
            </div>
        );
    }

    return (
        <div className="relative">
            <div className="bg-white border border-[#e5e7eb] rounded-lg overflow-hidden overflow-x-auto max-h-[calc(100vh-200px)] will-change-scroll">
                <table className="border-collapse min-w-max">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-slate-50 border-b border-[#e5e7eb]">
                            <th className="sticky left-0 z-30 bg-slate-50 p-2 md:p-4 text-left border-r border-[#e5e7eb] min-w-[120px] md:min-w-[200px]">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</span>
                            </th>
                        {calendarDays.map((day) => {
                            const isCurrentToday = isToday(day);
                            const isDayWeekend = isWeekend(day);
                            const dayAbbrev = format(day, 'EEEE').slice(0, 2);

                            return (
                                <th
                                    key={day.toString()}
                                    className={cn(
                                        "p-1 md:p-2 text-center min-w-[30px] md:min-w-[36px] lg:min-w-[40px] border-r border-[#e5e7eb] last:border-r-0 scroll-snap-align start flex-shrink-0",
                                        isCurrentToday && "bg-[#f2f7ff]",
                                        isDayWeekend && !isCurrentToday && "bg-[#f7f9fa]"
                                    )}
                                >
                                    <div className="flex flex-col items-center gap-0.5 md:gap-1">
                                        <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">{dayAbbrev}</span>
                                        <span className={cn(
                                            "text-[10px] md:text-xs font-black size-5 md:size-6 flex items-center justify-center rounded-lg",
                                            isCurrentToday ? "bg-blue-600 text-white" : "text-slate-600"
                                        )}>
                                            {format(day, 'd')}
                                        </span>
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {data.users.map((user: any) => (
                        <tr
                            key={user.id}
                            className="border-b border-[#e5e7eb] last:border-b-0 hover:bg-slate-50/50 transition-colors"
                            style={{ contentVisibility: 'auto', contain: 'strict' }}
                        >
                            <td className="sticky left-0 z-20 bg-white group-hover:bg-slate-50 p-2 md:p-4 border-r border-[#e5e7eb]">
                                <div>
                                    <p className="text-xs md:text-sm font-bold text-slate-900 leading-tight truncate max-w-[100px] md:max-w-none">{user.name}</p>
                                    <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[100px] md:max-w-none">{user.department}</p>
                                </div>
                            </td>
                            {calendarDays.map((day) => {
                                const dayStr = format(day, 'yyyy-MM-dd');
                                const isDayWeekend = isWeekend(day);
                                const isCurrentToday = isToday(day);
                                // Check if this day is a holiday specifically for this user's country
                                const isPublicHoliday = data.holidays_map?.[user.country_code]?.includes(dayStr);

                                // Find absences for this day
                                const absences = user.absences.filter((abs: any) =>
                                    dayStr >= abs.start_date && dayStr <= abs.end_date
                                );

                                return (
                                    <td
                                        key={day.toString()}
                                        className={cn(
                                            "p-1 border-r border-[#e5e7eb] last:border-r-0 h-[60px] relative min-w-[30px] md:min-w-[36px] lg:min-w-[40px] flex-shrink-0",
                                            isCurrentToday && "bg-[#f2f7ff]",
                                            isDayWeekend && !isCurrentToday && "bg-[#f7f9fa]",
                                            isPublicHoliday && "bg-rose-50/20"
                                        )}
                                    >
                                        <div className="flex flex-col gap-1 h-full justify-center">
                                            {absences.map((abs: any) => {
                                                const isStart = dayStr === abs.start_date;
                                                const isEnd = dayStr === abs.end_date;
                                                const isHalfDayStart = (abs.day_part_start === 'morning' || abs.day_part_start === 'afternoon') && isStart;
                                                const isHalfDayEnd = (abs.day_part_end === 'morning' || abs.day_part_end === 'afternoon') && isEnd;

                                                return (
                                                    <AbsencePill
                                                        key={abs.id}
                                                        absence={{
                                                            id: abs.id,
                                                            user_name: user.name,
                                                            leave_type: abs.leave_type,
                                                            color: abs.color,
                                                            status: abs.status,
                                                            start_date: abs.start_date,
                                                            end_date: abs.end_date,
                                                            day_part_start: abs.day_part_start,
                                                            day_part_end: abs.day_part_end
                                                        }}
                                                        isStart={isStart}
                                                        isEnd={isEnd}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
                </table>
            </div>
            <div className="absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none z-25" />
        </div>
    );
}
