"use client";

import { useEffect, useState } from "react";
import {
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    format,
    isSameDay,
    isToday,
    isWeekend,
    isSameMonth
} from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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

    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const startStr = format(monthStart, 'yyyy-MM-dd');
                const endStr = format(monthEnd, 'yyyy-MM-dd');
                let url = `/api/calendar/wall-chart?start_date=${startStr}&end_date=${endStr}`;

                if (filters?.departmentId) url += `&department_id=${filters.departmentId}`;
                if (filters?.userId) url += `&user_ids=${filters.userId}`; // Wall chart API uses user_ids

                const res = await fetch(url);
                if (res.ok) {
                    const json = await res.json();
                    setData(json.data);
                }
            } catch (error) {
                console.error("Failed to fetch wall chart data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [date, filters]);

    if (loading && !data) {
        return (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-8 space-y-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="flex gap-4">
                            <Skeleton className="h-8 w-40" />
                            <Skeleton className="h-8 flex-1" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!data || !data.users) return null;

    return (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm overflow-auto max-h-[calc(100vh-200px)]">
            <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="sticky left-0 z-30 bg-slate-50 p-2 md:p-4 text-left border-r border-slate-200 min-w-[120px] md:min-w-[200px]">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</span>
                        </th>
                        {calendarDays.map((day) => {
                            const isCurrentToday = isToday(day);
                            const isDayWeekend = isWeekend(day);

                            return (
                                <th
                                    key={day.toString()}
                                    className={cn(
                                        "p-1 md:p-2 text-center min-w-[35px] md:min-w-[40px] border-r border-slate-100 last:border-r-0",
                                        isDayWeekend && "bg-slate-100/50"
                                    )}
                                >
                                    <div className="flex flex-col items-center gap-0.5 md:gap-1">
                                        <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">{format(day, 'EEE')[0]}</span>
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
                        <tr key={user.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                            <td className="sticky left-0 z-20 bg-white group-hover:bg-slate-50 p-2 md:p-4 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                <div>
                                    <p className="text-xs md:text-sm font-bold text-slate-900 leading-tight truncate max-w-[100px] md:max-w-none">{user.name}</p>
                                    <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[100px] md:max-w-none">{user.department}</p>
                                </div>
                            </td>
                            {calendarDays.map((day) => {
                                const dayStr = format(day, 'yyyy-MM-dd');
                                const isDayWeekend = isWeekend(day);
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
                                            "p-1 border-r border-slate-50 last:border-r-0 h-[60px] relative",
                                            isDayWeekend && "bg-slate-100/20",
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
                                                    <div
                                                        key={abs.id}
                                                        className={cn(
                                                            "h-6 z-0 group/abs relative transition-all",
                                                            abs.status === 'new' && "opacity-60",
                                                        )}
                                                        title={`${abs.leave_type} (${abs.status})`}
                                                    >
                                                        <div
                                                            className={cn(
                                                                "absolute inset-y-0 shadow-sm",
                                                                isStart ? "rounded-l-md left-0" : "-left-2",
                                                                isEnd ? "rounded-r-md right-0" : "-right-2",
                                                                abs.status === 'new' ? "border-2 border-dashed" : "border-0"
                                                            )}
                                                            style={{
                                                                backgroundColor: `var(--absence-color, ${abs.color || '#94a3b8'})`,
                                                                borderColor: abs.status === 'new' ? 'var(--new-border, rgba(0,0,0,0.2))' : 'transparent',
                                                                // Half day logic
                                                                left: `var(--absence-left, ${isStart && abs.day_part_start === 'afternoon' ? '50%' : (isStart ? '0' : '-8px')})`,
                                                                right: `var(--absence-right, ${isEnd && abs.day_part_end === 'morning' ? '50%' : (isEnd ? '0' : '-8px')})`,
                                                            }}
                                                        />
                                                    </div>
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
    );
}
