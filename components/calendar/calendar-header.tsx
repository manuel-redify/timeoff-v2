"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    LayoutList,
    Columns,
    Filter,
    Users,
    Building2,
    Tag,
    X
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

interface CalendarHeaderProps {
    date: Date;
    view: 'month' | 'wall-chart' | 'list';
    filters?: {
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
    const [showFilters, setShowFilters] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);

    useEffect(() => {
        async function fetchData() {
            try {
                const [deptRes, userRes, ltRes] = await Promise.all([
                    fetch('/api/departments'),
                    fetch('/api/users'),
                    fetch('/api/leave-types')
                ]);

                if (deptRes.ok) {
                    const json = await deptRes.json();
                    setDepartments(json.data || json);
                }
                if (userRes.ok) {
                    const json = await userRes.json();
                    setUsers(json.data || json);
                }
                if (ltRes.ok) {
                    const json = await ltRes.json();
                    setLeaveTypes(json.data || json);
                }
            } catch (error) {
                console.error("Failed to fetch header data:", error);
            }
        }
        fetchData();
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

                    <Button
                        variant={activeFiltersCount > 0 ? "default" : "outline"}
                        className={cn(
                            "h-10 font-bold border-slate-200 transition-all",
                            activeFiltersCount > 0 && "bg-blue-600 hover:bg-blue-700"
                        )}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                        {activeFiltersCount > 0 && (
                            <span className="ml-2 bg-white text-blue-600 size-5 rounded-full flex items-center justify-center text-[10px]">
                                {activeFiltersCount}
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Department</label>
                        <Select
                            value={filters?.departmentId || "all"}
                            onValueChange={(val) => onFiltersChange?.({ departmentId: val === "all" ? null : val })}
                        >
                            <SelectTrigger className="bg-white border-slate-200 rounded-xl h-10">
                                <Building2 className="size-4 mr-2 text-slate-400" />
                                <SelectValue placeholder="All Departments" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map(d => (
                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Employee</label>
                        <Select
                            value={filters?.userId || "all"}
                            onValueChange={(val) => onFiltersChange?.({ userId: val === "all" ? null : val })}
                        >
                            <SelectTrigger className="bg-white border-slate-200 rounded-xl h-10">
                                <Users className="size-4 mr-2 text-slate-400" />
                                <SelectValue placeholder="All Employees" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Employees</SelectItem>
                                {users.map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.name} {u.lastname}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Leave Type</label>
                        <Select
                            value={filters?.leaveTypeId || "all"}
                            onValueChange={(val) => onFiltersChange?.({ leaveTypeId: val === "all" ? null : val })}
                        >
                            <SelectTrigger className="bg-white border-slate-200 rounded-xl h-10">
                                <Tag className="size-4 mr-2 text-slate-400" />
                                <SelectValue placeholder="All Leave Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Leave Types</SelectItem>
                                {leaveTypes.map(lt => (
                                    <SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {activeFiltersCount > 0 && (
                        <div className="md:col-span-3 flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onFiltersChange?.({ departmentId: null, userId: null, leaveTypeId: null })}
                                className="text-xs font-bold text-slate-500 hover:text-rose-600"
                            >
                                <X className="size-3 mr-1" />
                                Clear all filters
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
