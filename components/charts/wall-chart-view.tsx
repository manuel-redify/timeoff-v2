"use client";

import { useEffect, useMemo, useState } from "react";
import {
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    format,
    isToday,
    isWeekend,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { AbsencePill } from "@/components/calendar/absence-pill";
import { EmptyState, ErrorState } from "@/components/calendar/calendar-states";

interface WallChartAbsence {
    id: string;
    start_date: string;
    end_date: string;
    start_minutes: number;
    end_minutes: number;
    duration_minutes: number;
    day_part_start: string;
    day_part_end: string;
    leave_type: string;
    color: string;
    status: string;
    employee_comment?: string | null;
}

interface WallChartUser {
    id: string;
    name: string;
    country_code: string;
    department: string;
    absences: WallChartAbsence[];
}

interface WallChartData {
    users: WallChartUser[];
    holidays_map?: Record<string, string[]>;
    workday_start_minutes?: number;
    workday_end_minutes?: number;
}

const responseCache = new Map<string, WallChartData>();
const inflightRequests = new Map<string, Promise<WallChartData>>();

function getWallChartStorageKey(url: string) {
    return `wall-chart:${url}`;
}

const DEFAULT_WORKDAY_START_MINUTES = 9 * 60;
const DEFAULT_WORKDAY_END_MINUTES = 18 * 60;

export function clearWallChartCache() {
    responseCache.clear();
    inflightRequests.clear();
    if (typeof window !== "undefined") {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.sessionStorage.length; i++) {
            const key = window.sessionStorage.key(i);
            if (key && key.startsWith("wall-chart:")) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => window.sessionStorage.removeItem(key));
    }
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function formatMinutes(minutes: number) {
    const normalized = clamp(minutes, 0, (24 * 60) - 1);
    const hours = Math.floor(normalized / 60);
    const mins = normalized % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

function deriveLegacySegment(dayPart: string | undefined, startMinutes: number, endMinutes: number) {
    const halfDay = (endMinutes - startMinutes) / 2;

    if (dayPart === "morning") {
        return {
            start: startMinutes,
            end: startMinutes + halfDay,
        };
    }

    if (dayPart === "afternoon") {
        return {
            start: startMinutes + halfDay,
            end: endMinutes,
        };
    }

    return {
        start: startMinutes,
        end: endMinutes,
    };
}

function getAbsenceSegment(
    dayStr: string,
    absence: WallChartAbsence,
    workdayStartMinutes: number,
    workdayEndMinutes: number
) {
    const sameDay = absence.start_date === absence.end_date;
    const isStart = dayStr === absence.start_date;
    const isEnd = dayStr === absence.end_date;
    const workdayDuration = Math.max(1, workdayEndMinutes - workdayStartMinutes);
    const isCustomSingleDay =
        sameDay &&
        absence.day_part_start === "all" &&
        absence.day_part_end === "all" &&
        absence.duration_minutes > 0 &&
        absence.duration_minutes < workdayDuration;

    if (isCustomSingleDay) {
        const start = clamp(absence.start_minutes, workdayStartMinutes, workdayEndMinutes);
        const end = clamp(absence.end_minutes, workdayStartMinutes, workdayEndMinutes);

        if (end > start) {
            return { start, end };
        }
    }

    if (sameDay) {
        return deriveLegacySegment(absence.day_part_start, workdayStartMinutes, workdayEndMinutes);
    }

    if (isStart) {
        return deriveLegacySegment(absence.day_part_start, workdayStartMinutes, workdayEndMinutes);
    }

    if (isEnd) {
        return deriveLegacySegment(absence.day_part_end, workdayStartMinutes, workdayEndMinutes);
    }

    return {
        start: workdayStartMinutes,
        end: workdayEndMinutes,
    };
}

function getAbsenceStyle(dayStr: string, absence: WallChartAbsence, workdayStartMinutes: number, workdayEndMinutes: number) {
     const workdayDuration = Math.max(1, workdayEndMinutes - workdayStartMinutes);
     const segment = getAbsenceSegment(dayStr, absence, workdayStartMinutes, workdayEndMinutes);
     
     // Convert minutes to pixels (60px total height, 4px padding = 56px usable)
     const totalPx = 60;
     const paddingPx = 2; // top and bottom padding each
     const usablePx = totalPx - (paddingPx * 2); // 56px
     const minutesToPx = usablePx / workdayDuration;
     
     // Calculate position and size in pixels
     let topPx = paddingPx + ((segment.start - workdayStartMinutes) * minutesToPx);
     let heightPx = (segment.end - segment.start) * minutesToPx;
     
     // Ensure minimum height (12 minutes converted to pixels)
     const minHeightPx = 12 * minutesToPx;
     heightPx = Math.max(heightPx, minHeightPx);
     
     // Ensure we don't overflow the bottom (can't go below 58px from top)
     const maxBottomPx = totalPx - paddingPx; // 58px
     if (topPx + heightPx > maxBottomPx) {
         heightPx = maxBottomPx - topPx;
         // Ensure we still meet minimum height after adjustment
         heightPx = Math.max(heightPx, minHeightPx);
     }
     
     // Ensure we don't go above the top padding (can't go below 2px from top)
     if (topPx < paddingPx) {
         topPx = paddingPx;
         // If we adjusted top and now overflow, reduce height
         if (topPx + heightPx > maxBottomPx) {
             heightPx = maxBottomPx - topPx;
             // Ensure we still meet minimum height
             heightPx = Math.max(heightPx, minHeightPx);
         }
     }
 
     // Convert to percentages for CSS
     const topPercent = (topPx / totalPx) * 100;
     const heightPercent = (heightPx / totalPx) * 100;
 
     return {
         top: `${clamp(topPercent, 0, 100)}%`,
         height: `${clamp(heightPercent, 0, 100)}%`,
         left: "0.125rem",
         right: "0.125rem",
      };
 }

function getAbsenceIntervalLabel(dayStr: string, absence: WallChartAbsence, workdayStartMinutes: number, workdayEndMinutes: number) {
    const segment = getAbsenceSegment(dayStr, absence, workdayStartMinutes, workdayEndMinutes);
    return `${formatMinutes(segment.start)} - ${formatMinutes(segment.end)}`;
}

function getAbsenceDurationLabel(dayStr: string, absence: WallChartAbsence, workdayStartMinutes: number, workdayEndMinutes: number) {
    const segment = getAbsenceSegment(dayStr, absence, workdayStartMinutes, workdayEndMinutes);
    const minutes = Math.max(segment.end - segment.start, 0);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
        return `${remainingMinutes}m`;
    }

    if (remainingMinutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}m`;
}

function sortAbsencesForDay(
    dayStr: string,
    absences: WallChartAbsence[],
    workdayStartMinutes: number,
    workdayEndMinutes: number
) {
    return [...absences].sort((left, right) => {
        const leftSegment = getAbsenceSegment(dayStr, left, workdayStartMinutes, workdayEndMinutes);
        const rightSegment = getAbsenceSegment(dayStr, right, workdayStartMinutes, workdayEndMinutes);

        if (leftSegment.start !== rightSegment.start) {
            return leftSegment.start - rightSegment.start;
        }

        const leftDuration = leftSegment.end - leftSegment.start;
        const rightDuration = rightSegment.end - rightSegment.start;
        if (leftDuration !== rightDuration) {
            return rightDuration - leftDuration;
        }

        return left.leave_type.localeCompare(right.leave_type);
    });
}

function getCellLayout(absenceCount: number) {
    return {
        cellClassName: "h-[60px]",
        plotClassName: "absolute inset-[2px]",
        columnsClassName: absenceCount > 4 ? "gap-[2px]" : "gap-[2px]",
    };
}

interface WallChartViewProps {
    date: Date;
    filters?: {
        departmentId?: string;
        userId?: string;
        leaveTypeId?: string;
        departmentIds?: string[];
        projectIds?: string[];
        roleIds?: string[];
        areaIds?: string[];
    };
}

function buildWallChartUrl(date: Date, filters?: WallChartViewProps["filters"]) {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const params = new URLSearchParams({
        start_date: format(monthStart, "yyyy-MM-dd"),
        end_date: format(monthEnd, "yyyy-MM-dd"),
    });

    if (filters?.departmentId) params.set("department_id", filters.departmentId);
    if (filters?.userId) params.set("user_ids", filters.userId);

    filters?.departmentIds?.forEach((id) => params.append("department_ids", id));
    filters?.projectIds?.forEach((id) => params.append("project_ids", id));
    filters?.roleIds?.forEach((id) => params.append("role_ids", id));
    filters?.areaIds?.forEach((id) => params.append("area_ids", id));

    return `/api/calendar/wall-chart?${params.toString()}`;
}

function HolidayPill({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "h-full z-0 group/abs relative transition-all cursor-pointer",
                className
            )}
            title="Public Holiday"
        >
            <div
                className="absolute inset-0 rounded-l-sm rounded-r-sm"
                style={{
                    backgroundColor: '#fae6e7', // Public holiday color from CalendarHeader legend
                }}
            />
        </div>
    );
}

export function WallChartView({ date, filters }: WallChartViewProps) {
    const [data, setData] = useState<WallChartData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const requestUrl = useMemo(() => buildWallChartUrl(date, filters), [date, filters]);

    async function fetchWallChartData(url: string, signal?: AbortSignal) {
        const cachedData = responseCache.get(url);
        if (cachedData) {
            setData(cachedData);
            setError(null);
            setLoading(false);
            return;
        }

        if (typeof window !== "undefined") {
            const persistedData = window.sessionStorage.getItem(getWallChartStorageKey(url));
            if (persistedData) {
                const parsedData = JSON.parse(persistedData) as WallChartData;
                responseCache.set(url, parsedData);
                setData(parsedData);
                setError(null);
                setLoading(false);
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            let request = inflightRequests.get(url);
            if (!request) {
                // We do NOT pass the component's signal to fetch() here.
                // If we did, StrictMode's unmount would abort the shared promise,
                // causing the remount to receive an AbortError and never fetch.
                request = fetch(url, {
                    headers: {
                        "x-wall-chart-client": "wall-chart-view",
                    },
                }).then(async (res) => {
                    if (!res.ok) {
                        throw new Error("Failed to load calendar data");
                    }

                    const json = await res.json();
                    return json.data as WallChartData;
                });
                inflightRequests.set(url, request);
            }

            const nextData = await request;
            
            // We ALWAYS save to cache regardless of component mount status
            // so that subsequent mounts/renders can immediately use the cached data
            responseCache.set(url, nextData);
            if (typeof window !== "undefined") {
                window.sessionStorage.setItem(getWallChartStorageKey(url), JSON.stringify(nextData));
            }

            // Only update component state if this specific render wasn't aborted
            if (!signal?.aborted) {
                setData(nextData);
            }
        } catch (fetchError) {
            // Only update component state if this specific render wasn't aborted
            if (!signal?.aborted) {
                if (fetchError instanceof Error && fetchError.message === "Failed to load calendar data") {
                    setError(fetchError.message);
                } else {
                    setError("Failed to connect to the server");
                }
            }
        } finally {
            // We can delete from inflightRequests safely; if another request starts later, it'll fetch fresh.
            inflightRequests.delete(url);
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }

    useEffect(() => {
        const controller = new AbortController();
        fetchWallChartData(requestUrl, controller.signal);

        return () => {
            controller.abort();
        };
    }, [requestUrl]);

    if (loading && !data) {
        return (
            <div className="bg-white border border-[#e5e7eb] rounded-lg overflow-hidden">
                <table className="border-collapse w-full table-fixed">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-slate-50 border-b border-[#e5e7eb]">
                            <th className="sticky top-0 left-0 z-[60] bg-slate-50 p-2 md:p-4 text-left border-r-2 border-slate-200/50 w-[140px] md:w-[200px] flex-shrink-0 relative lg:border-r lg:border-r-[#e5e7eb] lg:border-r-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">People</span>
                                {/* Mobile-only gradient indicator */}
                                <div className="absolute top-0 right-0 bottom-0 w-8 pointer-events-none lg:hidden bg-gradient-to-l from-white/90 via-white/60 to-transparent" />
                            </th>
                            {Array.from({ length: calendarDays.length }).map((_, i) => (
                                <th key={i} className="p-1 md:p-2 text-center border-r border-[#e5e7eb] last:border-r-0 w-auto">
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
                                <td className="sticky left-0 z-20 bg-white p-2 md:p-4 border-r-2 border-slate-200/50 w-[140px] md:w-[200px] flex-shrink-0 h-[3.75rem] relative lg:border-r lg:border-r-[#e5e7eb] lg:border-r-1">
                                    <div className="flex flex-col gap-1">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </td>
                                {Array.from({ length: calendarDays.length }).map((_, cellI) => (
                                    <td key={cellI} className="p-1 border-r border-[#e5e7eb] last:border-r-0 h-[60px] w-auto">
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
                        responseCache.delete(requestUrl);
                        inflightRequests.delete(requestUrl);
                        if (typeof window !== "undefined") {
                            window.sessionStorage.removeItem(getWallChartStorageKey(requestUrl));
                        }
                        setError(null);
                        setLoading(true);
                        void fetchWallChartData(requestUrl);
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

    const workdayStartMinutes = data.workday_start_minutes ?? DEFAULT_WORKDAY_START_MINUTES;
    const workdayEndMinutes = data.workday_end_minutes ?? DEFAULT_WORKDAY_END_MINUTES;

    return (
        <div className="relative overflow-auto">
            <div className="bg-white border border-[#e5e7eb] rounded-lg overflow-hidden max-h-[calc(100vh-200px)] will-change-scroll">
                <table className="border-collapse w-full table-fixed">
                    <thead className="sticky top-0 z-[50]">
                        <tr className="bg-slate-50 border-b border-[#e5e7eb]">
                            <th className="sticky top-0 left-0 z-[60] bg-slate-50 p-2 md:p-4 text-left border-r-2 border-slate-200/50 w-[140px] md:w-[200px] flex-shrink-0 relative lg:border-r lg:border-r-[#e5e7eb] lg:border-r-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">People</span>
                                {/* Mobile-only gradient indicator */}
                                <div className="absolute top-0 right-0 bottom-0 w-8 pointer-events-none lg:hidden bg-gradient-to-l from-white/90 via-white/60 to-transparent" />
                            </th>
                        {calendarDays.map((day) => {
                            const isCurrentToday = isToday(day);
                            const isDayWeekend = isWeekend(day);
                            const dayAbbrev = format(day, 'EEEE').slice(0, 2);

                            return (
                                <th
                                    key={day.toString()}
                                    className={cn(
                                        "p-1 md:p-2 text-center border-r border-[#e5e7eb] last:border-r-0 w-auto",
                                        isDayWeekend && "bg-[#f7f9fa]"
                                    )}
                                >
                                    <div className="flex flex-col items-center gap-0.5 md:gap-1">
                                        <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">{dayAbbrev}</span>
                                        <span className={cn(
                                            "text-[10px] md:text-xs font-black size-5 md:size-6 flex items-center justify-center rounded-lg",
                                            isCurrentToday ? "text-blue-600" : "text-slate-600"
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
                    {data.users.map((user) => (
                        <tr
                            key={user.id}
                            className="border-b border-[#e5e7eb] last:border-b-0 hover:bg-slate-50/50 transition-colors"
                        >
                            <td className="sticky left-0 z-[45] bg-white group-hover:bg-slate-50 p-2 md:p-4 border-r-2 border-slate-200/50 w-[140px] md:w-[200px] flex-shrink-0 h-[3.75rem] relative lg:border-r lg:border-r-[#e5e7eb] lg:border-r-1">
                                <div>
                                    <p className="text-xs md:text-sm font-bold text-slate-900 leading-tight truncate max-w-[100px] md:max-w-none">{user.name}</p>
                                </div>
                            </td>
                            {calendarDays.map((day) => {
                                const dayStr = format(day, 'yyyy-MM-dd');
                                const isDayWeekend = isWeekend(day);
                                const isCurrentToday = isToday(day);
                                // Check if this day is a holiday specifically for this user's country
                                const isPublicHoliday = data.holidays_map?.[user.country_code]?.includes(dayStr);

                                // Find absences for this day
                                const absences = user.absences.filter((abs) =>
                                    dayStr >= abs.start_date && dayStr <= abs.end_date
                                );
                                const sortedAbsences = sortAbsencesForDay(
                                    dayStr,
                                    absences,
                                    workdayStartMinutes,
                                    workdayEndMinutes
                                );
                                const cellLayout = getCellLayout(sortedAbsences.length);

return (
                                    <td
                                        key={day.toString()}
                                        className={cn(
                                            "p-0 border-r border-[#e5e7eb] last:border-r-0 relative w-auto",
                                            isCurrentToday && "bg-[#f2f7ff]",
                                            isDayWeekend && !isCurrentToday && "bg-[#f7f9fa]"
                                        )}
                                    >
                                        <div className={cn("relative", cellLayout.cellClassName)}>
                                            {isPublicHoliday ? (
                                                <div className={cn("absolute", cellLayout.plotClassName)}>
                                                    <HolidayPill />
                                                </div>
                                            ) : null}
                                            <div className={cn("relative z-10 h-full", cellLayout.plotClassName)}>
                                            {sortedAbsences.map((abs) => {
                                                const isStart = dayStr === abs.start_date;
                                                const isEnd = dayStr === abs.end_date;

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
                                                            employee_comment: abs.employee_comment,
                                                            day_part_start: abs.day_part_start,
                                                            day_part_end: abs.day_part_end,
                                                        }}
                                                        isStart={isStart}
                                                        isEnd={isEnd}
                                                        intervalLabel={getAbsenceIntervalLabel(
                                                            dayStr,
                                                            abs,
                                                            workdayStartMinutes,
                                                            workdayEndMinutes
                                                        )}
                                                        durationLabel={getAbsenceDurationLabel(
                                                            dayStr,
                                                            abs,
                                                            workdayStartMinutes,
                                                            workdayEndMinutes
                                                        )}
                                                        style={getAbsenceStyle(
                                                            dayStr,
                                                            abs,
                                                            workdayStartMinutes,
                                                            workdayEndMinutes
                                                        )}
                                                    />
                                                );
                                            })}
                                            </div>
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
                </table>
            </div>
            <div className="absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none z-25 lg:hidden" />
        </div>
    );
}
