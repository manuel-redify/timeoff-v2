"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    Filter,
    X,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { FilterDrawer } from "./filter-drawer";
import { FilterTag } from "./filter-tag";
import { MobileFilterSheet } from "./mobile-filter-sheet";

interface CalendarHeaderProps {
    date: Date;
    view: 'month' | 'wall-chart' | 'list';
    filters?: {
        departmentIds?: string[];
        projectIds?: string[];
        roleIds?: string[];
        areaIds?: string[];
        departmentId?: string;
        userId?: string;
        leaveTypeId?: string;
        status?: string;
    };
    onDateChange: (date: Date) => void;
    onViewChange: (view: 'month' | 'wall-chart' | 'list') => void;
    onFiltersChange?: (filters: any) => void;
}

export function CalendarHeader({
    date,
    view,
    filters,
    onDateChange,
    onViewChange,
    onFiltersChange
}: CalendarHeaderProps) {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [filterLabels, setFilterLabels] = useState<{
        departments: Map<string, string>;
        projects: Map<string, string>;
        roles: Map<string, string>;
        areas: Map<string, string>;
        users: Map<string, string>;
        leaveTypes: Map<string, string>;
    }>({
        departments: new Map(),
        projects: new Map(),
        roles: new Map(),
        areas: new Map(),
        users: new Map(),
        leaveTypes: new Map(),
    });

    useEffect(() => {
        async function fetchFilterMetadata() {
            try {
                const [deptRes, userRes, ltRes, roleRes, projRes, areaRes] = await Promise.all([
                    fetch('/api/departments'),
                    fetch('/api/users'),
                    fetch('/api/leave-types'),
                    fetch('/api/roles'),
                    fetch('/api/projects'),
                    fetch('/api/areas'),
                ]);

                const newLabels = { ...filterLabels };

                if (deptRes.ok) {
                    const json = await deptRes.json();
                    const depts = json.data || json;
                    newLabels.departments = new Map(depts.map((d: any) => [d.id, d.name]));
                    newLabels.areas = new Map(depts.map((d: any) => [d.id, d.name]));
                }
                if (userRes.ok) {
                    const json = await userRes.json();
                    const users = json.data || json;
                    newLabels.users = new Map(users.map((u: any) => [u.id, `${u.name} ${u.lastname}`]));
                }
                if (ltRes.ok) {
                    const json = await ltRes.json();
                    const lts = json.data || json;
                    newLabels.leaveTypes = new Map(lts.map((lt: any) => [lt.id, lt.name]));
                }
                if (roleRes.ok) {
                    const json = await roleRes.json();
                    const roles = json.data || json;
                    newLabels.roles = new Map(roles.map((r: any) => [r.id, r.name]));
                }
                if (projRes.ok) {
                    const json = await projRes.json();
                    const projs = json.data || json;
                    newLabels.projects = new Map(projs.map((p: any) => [p.id, p.name]));
                }
                if (areaRes.ok) {
                    const json = await areaRes.json();
                    const areas = json.data || json;
                    newLabels.areas = new Map(areas.map((a: any) => [a.id, a.name]));
                }

                setFilterLabels(newLabels);
            } catch (error) {
                console.error("Failed to fetch filter metadata:", error);
            }
        }
        fetchFilterMetadata();
    }, []);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handlePrev = () => {
        const newDate = new Date(date);
        newDate.setMonth(newDate.getMonth() - 1);
        onDateChange(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(date);
        newDate.setMonth(newDate.getMonth() + 1);
        onDateChange(newDate);
    };

    const handleToday = () => {
        onDateChange(new Date());
    };

    const activeFiltersCount = [
        ...(filters?.departmentIds || []),
        ...(filters?.projectIds || []),
        ...(filters?.roleIds || []),
        ...(filters?.areaIds || []),
        filters?.departmentId,
        filters?.userId,
        filters?.leaveTypeId
    ].filter(Boolean).length;

    const activeFilterTags = [
        ...(filters?.departmentIds || []).map(id => ({
            id,
            label: filterLabels.departments.get(id) || `Dept: ${id}`,
            type: 'department',
            onRemove: () => {
                const newIds = (filters?.departmentIds || []).filter(d => d !== id);
                onFiltersChange?.({ ...filters, departmentIds: newIds });
            }
        })),
        ...(filters?.projectIds || []).map(id => ({
            id,
            label: filterLabels.projects.get(id) || `Project: ${id}`,
            type: 'project',
            onRemove: () => {
                const newIds = (filters?.projectIds || []).filter(d => d !== id);
                onFiltersChange?.({ ...filters, projectIds: newIds });
            }
        })),
        ...(filters?.roleIds || []).map(id => ({
            id,
            label: filterLabels.roles.get(id) || `Role: ${id}`,
            type: 'role',
            onRemove: () => {
                const newIds = (filters?.roleIds || []).filter(d => d !== id);
                onFiltersChange?.({ ...filters, roleIds: newIds });
            }
        })),
        ...(filters?.areaIds || []).map(id => ({
            id,
            label: filterLabels.areas.get(id) || `Area: ${id}`,
            type: 'area',
            onRemove: () => {
                const newIds = (filters?.areaIds || []).filter(d => d !== id);
                onFiltersChange?.({ ...filters, areaIds: newIds });
            }
        })),
    ];

    const handleClearAllFilters = () => {
        onFiltersChange?.({
            departmentIds: [],
            projectIds: [],
            roleIds: [],
            areaIds: [],
            departmentId: null,
            userId: null,
            leaveTypeId: null,
            status: null,
        });
    };

    const legendItems = [
        { label: 'Approved Leave', color: '#dcfae7' },
        { label: 'Public Holiday', color: '#fae6e7' },
        { label: 'Pending Request', color: '#faf2c8' },
    ];

    return (
        <div className="space-y-3 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-lg bg-white border">
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <h1 className="text-lg font-bold text-neutral-900 pl-2">
                        Team View
                    </h1>
                    <div className="flex items-center gap-2">
                        {legendItems.map((item) => (
                            <div key={item.label} className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-white">
                                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
                                <span className="text-xs font-medium text-slate-600 whitespace-nowrap">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={handlePrev}
                            className="h-8 w-8 border-slate-400 rounded-sm touch-manipulation"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-slate-900 min-w-[140px] text-center">
                            {format(date, "MMMM, yyyy")}
                        </span>
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={handleNext}
                            className="h-8 w-8 border-slate-400 rounded-sm touch-manipulation"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToday}
                        className="h-8 px-3 border-slate-400 font-medium text-sm text-slate-900 rounded-sm touch-manipulation"
                    >
                        Today
                    </Button>

                    <div className="hidden lg:block">
                        <FilterDrawer
                            filters={filters}
                            onFiltersChange={onFiltersChange}
                            isOpen={isFilterOpen}
                            onOpenChange={setIsFilterOpen}
                        />
                    </div>
                    <div className="lg:hidden">
                        <MobileFilterSheet
                            filters={filters}
                            onFiltersChange={onFiltersChange}
                        />
                    </div>
                </div>
            </div>

            {/* Filter tags in separate section between controls and timeline */}
            {activeFilterTags.length > 0 && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4">
                    <div className="flex flex-wrap gap-1.5 overflow-x-auto max-w-[calc(100%-80px)] pb-1 md:pb-0">
                        {activeFilterTags.map((tag) => (
                            <FilterTag
                                key={`${tag.type}-${tag.id}`}
                                label={tag.label}
                                onRemove={tag.onRemove}
                                className="text-xs"
                            />
                        ))}
                    </div>
                    {activeFilterTags.length >= 1 && (
                        <button
                            onClick={handleClearAllFilters}
                            className="text-xs font-medium text-slate-500 hover:text-rose-600 shrink-0 underline"
                        >
                            Clear all
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
