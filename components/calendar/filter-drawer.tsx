"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Filter } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { MultiSelect } from "@/components/ui/multi-select";

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
    const [roles, setRoles] = useState<any[]>([]);

    useEffect(() => {
        async function fetchData() {
            try {
                const [deptRes, userRes, ltRes, roleRes] = await Promise.all([
                    fetch('/api/departments'),
                    fetch('/api/users'),
                    fetch('/api/leave-types'),
                    fetch('/api/roles')
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
                if (roleRes.ok) {
                    const json = await roleRes.json();
                    setRoles(json.data || json);
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
                    variant="outline"
                    className={cn(
                        "h-10 font-bold border-slate-400 rounded-sm transition-all relative text-sm",
                        "text-slate-900"
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
                    <MultiSelect
                        label="Department"
                        placeholder="Select departments..."
                        options={departments.map((dept) => ({ value: dept.id, label: dept.name }))}
                        selected={filters?.departmentIds || []}
                        onChange={(selected) => onFiltersChange?.({ ...filters, departmentIds: selected })}
                    />

                    <MultiSelect
                        label="Project"
                        placeholder="Select projects..."
                        options={users.map((user) => ({ value: user.id, label: `${user.name} ${user.lastname}` }))}
                        selected={filters?.projectIds || []}
                        onChange={(selected) => onFiltersChange?.({ ...filters, projectIds: selected })}
                    />

                    <MultiSelect
                        label="Role"
                        placeholder="Select roles..."
                        options={roles.map((role) => ({ value: role.id, label: role.name }))}
                        selected={filters?.roleIds || []}
                        onChange={(selected) => onFiltersChange?.({ ...filters, roleIds: selected })}
                    />

                    <MultiSelect
                        label="Area"
                        placeholder="Select areas..."
                        options={departments.map((dept) => ({ value: dept.id, label: dept.name }))}
                        selected={filters?.areaIds || []}
                        onChange={(selected) => onFiltersChange?.({ ...filters, areaIds: selected })}
                    />

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
