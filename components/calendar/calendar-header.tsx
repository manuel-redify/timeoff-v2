"use client";

import { useState } from "react";
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


        </div>
    );
}
