"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    LayoutList,
    Columns,
} from "lucide-react";
import { format } from "date-fns";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FilterDrawer } from "./filter-drawer";
import { FilterTag } from "./filter-tag";

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

    const handlePrev = () => {
        const newDate = new Date(date);
        if (view === 'month' || view === 'wall-chart') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setDate(newDate.getDate() - 7);
        }
        onDateChange(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(date);
        if (view === 'month' || view === 'wall-chart') {
            newDate.setMonth(newDate.getMonth() + 1);
        } else {
            newDate.setDate(newDate.getDate() + 7);
        }
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

    return (
        <div className="space-y-4 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-black text-slate-900 min-w-[200px]">
                        {(view === 'month' || view === 'wall-chart') ? format(date, "MMMM yyyy") : "Calendar"}
                    </h1>

                    <div className="flex items-center bg-slate-100 rounded-xl p-1">
                        <Button variant="ghost" size="icon" onClick={handlePrev} className="h-8 w-8 hover:bg-white hover:shadow-sm rounded-lg">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleToday} className="h-8 px-3 hover:bg-white hover:shadow-sm rounded-lg font-bold text-xs uppercase tracking-wider text-slate-600">
                            Today
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8 hover:bg-white hover:shadow-sm rounded-lg">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Select value={view} onValueChange={(v: any) => onViewChange(v)}>
                        <SelectTrigger className="w-[160px] h-10 font-bold border-slate-200">
                            <SelectValue placeholder="View" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="month">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-blue-600" />
                                    <span>Month View</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="wall-chart">
                                <div className="flex items-center gap-2">
                                    <Columns className="h-4 w-4 text-indigo-600" />
                                    <span>Wall Chart</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="list">
                                <div className="flex items-center gap-2">
                                    <LayoutList className="h-4 w-4 text-emerald-600" />
                                    <span>List View</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>

<FilterDrawer
                        filters={filters}
                        onFiltersChange={onFiltersChange}
                        isOpen={isFilterOpen}
                        onOpenChange={setIsFilterOpen}
                    />
                </div>
            </div>

            {activeFilterTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex flex-wrap gap-2 overflow-x-auto max-w-[calc(100%-100px)] pb-1">
                        {activeFilterTags.map((tag) => (
                            <FilterTag
                                key={`${tag.type}-${tag.id}`}
                                label={tag.label}
                                onRemove={tag.onRemove}
                            />
                        ))}
                    </div>
                    {activeFilterTags.length >= 2 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearAllFilters}
                            className="text-xs font-bold text-slate-500 hover:text-rose-600 shrink-0"
                        >
                            Clear all
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
