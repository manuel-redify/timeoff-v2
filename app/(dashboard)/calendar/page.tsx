"use client";

import { useCalendarParams } from "@/lib/hooks/use-calendar-params";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { MonthView } from "@/components/charts/month-view";
import { WallChartView } from "@/components/charts/wall-chart-view";
import { ListView } from "@/components/charts/list-view";
import { Suspense } from "react";

function CalendarContent() {
    const { view, date, setDate, setView, filters, setFilters } = useCalendarParams();

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 p-8 min-h-screen">
            <header className="flex flex-col gap-2">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Calendar</h2>
                <p className="text-slate-500 font-medium">Unified view of all team and company absences.</p>
            </header>

            <CalendarHeader
                date={date}
                view={view}
                filters={filters}
                onDateChange={setDate}
                onViewChange={setView}
                onFiltersChange={setFilters}
            />

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {view === 'month' && <MonthView date={date} filters={filters} />}
                {view === 'wall-chart' && <WallChartView date={date} filters={filters} />}
                {view === 'list' && (
                    <ListView
                        date={date}
                        filters={filters}
                        onFiltersChange={(f) => f && setFilters(f)}
                    />
                )}
            </div>
        </div>
    );
}

export default function CalendarPage() {
    return (
        <Suspense fallback={<div>Loading calendar...</div>}>
            <CalendarContent />
        </Suspense>
    );
}
