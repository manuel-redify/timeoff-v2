"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import { format, parseISO, isValid } from "date-fns";

export type CalendarView = 'month' | 'wall-chart' | 'list';

export function useCalendarParams() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const view = useMemo(() => {
        const v = searchParams.get('view');
        if (v === 'wall-chart' || v === 'list' || v === 'month') return v as CalendarView;
        return 'wall-chart';
    }, [searchParams]);

    const date = useMemo(() => {
        const d = searchParams.get('date');
        if (d) {
            const parsed = parseISO(d);
            if (isValid(parsed)) return parsed;
        }
        return new Date();
    }, [searchParams]);

    const filters = useMemo(() => ({
        departmentId: searchParams.get('departmentId') || undefined,
        userId: searchParams.get('userId') || undefined,
        leaveTypeId: searchParams.get('leaveTypeId') || undefined,
        status: searchParams.get('status') || undefined,
        search: searchParams.get('search') || undefined,
    }), [searchParams]);

    const updateParams = useCallback((updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === undefined) {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });

        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [pathname, router, searchParams]);

    const setView = useCallback((newView: CalendarView) => {
        updateParams({ view: newView });
    }, [updateParams]);

    const setDate = useCallback((newDate: Date) => {
        updateParams({ date: format(newDate, 'yyyy-MM-dd') });
    }, [updateParams]);

    const setFilters = useCallback((newFilters: Partial<typeof filters>) => {
        const updates: Record<string, string | null> = {};
        Object.entries(newFilters).forEach(([key, value]) => {
            if (value !== undefined) {
                updates[key] = value || null;
            }
        });
        updateParams(updates);
    }, [updateParams]);

    return {
        view,
        date,
        filters,
        setView,
        setDate,
        setFilters
    };
}
