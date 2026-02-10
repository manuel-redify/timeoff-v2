"use client";

import { useEffect, useState } from "react";
import { useCalendarParams } from "@/lib/hooks/use-calendar-params";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { MonthView } from "@/components/charts/month-view";
import { WallChartView } from "@/components/charts/wall-chart-view";
import { ListView } from "@/components/charts/list-view";

export default function CalendarContent() {
    const { view, date, setDate, setView, filters, setFilters } = useCalendarParams();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            
            // If on mobile and wall-chart view is selected, switch to month view
            if (mobile && view === 'wall-chart') {
                setView('month');
            }
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [view, setView]);

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 p-4 md:p-8 min-h-screen">
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
                {!isMobile && view === 'wall-chart' && <WallChartView date={date} filters={filters} />}
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