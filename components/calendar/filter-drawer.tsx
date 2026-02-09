"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Filter, ChevronDown } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Users, Tag, Briefcase, UserCircle, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterDrawerProps {
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
    onFiltersChange?: (filters: any) => void;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function FilterDrawer({
    filters,
    onFiltersChange,
    isOpen,
    onOpenChange
}: FilterDrawerProps) {
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
                console.error("Failed to fetch filter data:", error);
            }
        }
        fetchData();
    }, []);

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
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
                <Button
                    variant={activeFiltersCount > 0 ? "default" : "outline"}
                    className={cn(
                        "h-10 font-bold border-slate-400 transition-all relative",
                        activeFiltersCount > 0 ? "bg-slate-900 hover:bg-slate-800 text-white" : "text-slate-900"
                    )}
                >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {activeFiltersCount > 0 && (
                        <span className="ml-2 bg-white text-slate-900 size-5 rounded-full flex items-center justify-center text-[10px] font-bold">
                            {activeFiltersCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle className="text-xl font-black text-slate-900">
                        Filter Calendar
                    </SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col gap-6 mt-6">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Department
                            </label>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-blue-600 hover:text-blue-700 h-6 px-2"
                            >
                                Select All
                            </Button>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto border border-[#e5e7eb] rounded-sm p-2 bg-white">
                            {departments.map((dept) => (
                                <div key={dept.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`dept-${dept.id}`}
                                        checked={filters?.departmentIds?.includes(dept.id) || false}
                                        onCheckedChange={(checked) => {
                                            const currentIds = filters?.departmentIds || [];
                                            const newIds = checked
                                                ? [...currentIds, dept.id]
                                                : currentIds.filter((id: string) => id !== dept.id);
                                            onFiltersChange?.({ ...filters, departmentIds: newIds });
                                        }}
                                    />
                                    <label
                                        htmlFor={`dept-${dept.id}`}
                                        className="text-sm font-medium text-slate-700 cursor-pointer"
                                    >
                                        {dept.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Project
                            </label>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-blue-600 hover:text-blue-700 h-6 px-2"
                            >
                                Select All
                            </Button>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto border border-[#e5e7eb] rounded-sm p-2 bg-white">
                            {users.map((user) => (
                                <div key={user.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`proj-${user.id}`}
                                        checked={filters?.projectIds?.includes(user.id) || false}
                                        onCheckedChange={(checked) => {
                                            const currentIds = filters?.projectIds || [];
                                            const newIds = checked
                                                ? [...currentIds, user.id]
                                                : currentIds.filter((id: string) => id !== user.id);
                                            onFiltersChange?.({ ...filters, projectIds: newIds });
                                        }}
                                    />
                                    <label
                                        htmlFor={`proj-${user.id}`}
                                        className="text-sm font-medium text-slate-700 cursor-pointer"
                                    >
                                        <Briefcase className="size-3 mr-1 inline" />
                                        {user.name} {user.lastname}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Role
                            </label>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-blue-600 hover:text-blue-700 h-6 px-2"
                            >
                                Select All
                            </Button>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto border border-[#e5e7eb] rounded-sm p-2 bg-white">
                            {leaveTypes.map((lt) => (
                                <div key={lt.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`role-${lt.id}`}
                                        checked={filters?.roleIds?.includes(lt.id) || false}
                                        onCheckedChange={(checked) => {
                                            const currentIds = filters?.roleIds || [];
                                            const newIds = checked
                                                ? [...currentIds, lt.id]
                                                : currentIds.filter((id: string) => id !== lt.id);
                                            onFiltersChange?.({ ...filters, roleIds: newIds });
                                        }}
                                    />
                                    <label
                                        htmlFor={`role-${lt.id}`}
                                        className="text-sm font-medium text-slate-700 cursor-pointer"
                                    >
                                        <UserCircle className="size-3 mr-1 inline" />
                                        {lt.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Area
                            </label>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-blue-600 hover:text-blue-700 h-6 px-2"
                            >
                                Select All
                            </Button>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto border border-[#e5e7eb] rounded-sm p-2 bg-white">
                            {departments.map((dept) => (
                                <div key={`area-${dept.id}`} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`area-${dept.id}`}
                                        checked={filters?.areaIds?.includes(dept.id) || false}
                                        onCheckedChange={(checked) => {
                                            const currentIds = filters?.areaIds || [];
                                            const newIds = checked
                                                ? [...currentIds, dept.id]
                                                : currentIds.filter((id: string) => id !== dept.id);
                                            onFiltersChange?.({ ...filters, areaIds: newIds });
                                        }}
                                    />
                                    <label
                                        htmlFor={`area-${dept.id}`}
                                        className="text-sm font-medium text-slate-700 cursor-pointer"
                                    >
                                        <MapPin className="size-3 mr-1 inline" />
                                        {dept.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {activeFiltersCount > 0 && (
                        <div className="pt-4 border-t border-slate-200">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onFiltersChange?.({ 
                                    departmentIds: [], 
                                    projectIds: [], 
                                    roleIds: [],
                                    areaIds: [],
                                    departmentId: null, 
                                    userId: null, 
                                    leaveTypeId: null,
                                    status: null
                                })}
                                className="text-xs font-bold text-slate-500 hover:text-rose-600"
                            >
                                <X className="size-3 mr-1" />
                                Clear all filters
                            </Button>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}