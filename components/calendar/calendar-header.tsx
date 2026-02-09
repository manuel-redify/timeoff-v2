"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    LayoutList,
    Columns,
    Search,
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
    const [searchQuery, setSearchQuery] = useState("");
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

    const legendItems = [
        { label: 'Holiday', color: 'bg-emerald-500' },
        { label: 'Leave', color: 'bg-blue-500' },
        { label: 'Remote', color: 'bg-violet-500' },
        { label: 'Sick', color: 'bg-rose-500' },
    ];

    return (
        <div className="space-y-3 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-neutral-900">
                        {(view === 'month' || view === 'wall-chart') ? format(date, "MMMM yyyy") : "Calendar"}
                    </h1>
                    
                    <div className="flex items-center gap-1 px-2 py-1 bg-neutral-100 rounded-lg">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={handlePrev}
                            className="h-7 w-7 hover:bg-white rounded-md"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleToday}
                            className="h-7 px-2.5 hover:bg-white rounded-md font-medium text-xs text-neutral-600"
                        >
                            Today
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={handleNext}
                            className="h-7 w-7 hover:bg-white rounded-md"
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    <div className="hidden md:flex items-center gap-1.5 px-2 py-1 border border-neutral-200 rounded-lg">
                        <Search className="h-3.5 w-3.5 text-neutral-400" />
                        <Input
                            type="text"
                            placeholder="Search everything..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-7 w-48 border-0 bg-transparent p-0 text-sm focus-visible:ring-0 placeholder:text-neutral-400"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 border border-neutral-200 rounded-lg">
                        <Search className="h-3.5 w-3.5 text-neutral-400" />
                        <Input
                            type="text"
                            placeholder="Search everything..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-7 w-48 border-0 bg-transparent p-0 text-sm focus-visible:ring-0 placeholder:text-neutral-400"
                        />
                    </div>

                    <Select value={view} onValueChange={(v: any) => onViewChange(v)}>
                        <SelectTrigger className="h-9 w-[140px] font-medium border-neutral-200">
                            <SelectValue placeholder="View" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="month">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-3.5 w-3.5 text-blue-600" />
                                    <span>Month View</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="wall-chart">
                                <div className="flex items-center gap-2">
                                    <Columns className="h-3.5 w-3.5 text-indigo-600" />
                                    <span>Wall Chart</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="list">
                                <div className="flex items-center gap-2">
                                    <LayoutList className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>List View</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>

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

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {legendItems.map((item) => (
                        <div key={item.label} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white border border-neutral-200">
                            <span className={cn("w-2 h-2 rounded-full", item.color)} />
                            <span className="text-xs font-medium text-neutral-600 whitespace-nowrap">{item.label}</span>
                        </div>
                    ))}
                </div>

                {activeFilterTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex flex-wrap gap-1.5 overflow-x-auto max-w-[calc(100%-80px)] pb-1">
                            {activeFilterTags.map((tag) => (
                                <FilterTag
                                    key={`${tag.type}-${tag.id}`}
                                    label={tag.label}
                                    onRemove={tag.onRemove}
                                    className="text-xs"
                                />
                            ))}
                        </div>
                        {activeFilterTags.length >= 2 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearAllFilters}
                                className="text-xs font-medium text-neutral-500 hover:text-rose-600 shrink-0"
                            >
                                Clear all
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
