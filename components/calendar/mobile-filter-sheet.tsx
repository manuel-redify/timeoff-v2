"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { X, Filter, Check } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { MultiSelect } from "@/components/ui/multi-select";

interface User {
    id: string;
    name: string;
    lastname: string;
    department_id?: string;
    role_id?: string;
    area_id?: string;
    project_ids?: string[];
}

interface MobileFilterSheetProps {
    filters?: {
        departmentIds?: string[];
        projectIds?: string[];
        roleIds?: string[];
        areaIds?: string[];
    };
    onFiltersChange?: (filters: any) => void;
    children?: React.ReactNode;
}

export function MobileFilterSheet({ filters, onFiltersChange, children }: MobileFilterSheetProps) {
    const [departments, setDepartments] = useState<any[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [areas, setAreas] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const [deptRes, userRes, roleRes, projectRes, areaRes] = await Promise.all([
                    fetch('/api/departments'),
                    fetch('/api/users'),
                    fetch('/api/roles'),
                    fetch('/api/projects'),
                    fetch('/api/areas')
                ]);

                if (deptRes.ok) {
                    const json = await deptRes.json();
                    setDepartments(json.data || json);
                }
                if (userRes.ok) {
                    const json = await userRes.json();
                    setUsers(json.data || json);
                }
                if (roleRes.ok) {
                    const json = await roleRes.json();
                    setRoles(json.data || json);
                }
                if (projectRes.ok) {
                    const json = await projectRes.json();
                    setProjects(json.data || json);
                }
                if (areaRes.ok) {
                    const json = await areaRes.json();
                    setAreas(json.data || json);
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
    ].filter(Boolean).length;

    // Get filtered users based on current selections
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            if ((filters?.departmentIds?.length ?? 0) > 0) {
                if (!(filters?.departmentIds?.includes(user.department_id || '') ?? false)) {
                    return false;
                }
            }
            if ((filters?.roleIds?.length ?? 0) > 0) {
                if (!(filters?.roleIds?.includes(user.role_id || '') ?? false)) {
                    return false;
                }
            }
            if ((filters?.projectIds?.length ?? 0) > 0) {
                const userProjectIds = user.project_ids || [];
                const hasMatchingProject = filters?.projectIds?.some(pid => 
                    userProjectIds.includes(pid)
                ) ?? false;
                if (!hasMatchingProject) {
                    return false;
                }
            }
            if ((filters?.areaIds?.length ?? 0) > 0) {
                if (!(filters?.areaIds?.includes(user.area_id || '') ?? false)) {
                    return false;
                }
            }
            return true;
        });
    }, [users, filters]);

    // Calculate available options and counts for each filter
    const departmentOptions = useMemo(() => {
        const counts = new Map<string, number>();
        filteredUsers.forEach(user => {
            if (user.department_id) {
                counts.set(user.department_id, (counts.get(user.department_id) || 0) + 1);
            }
        });

        return departments.map(dept => ({
            value: dept.id,
            label: dept.name,
            count: counts.get(dept.id) || 0,
            disabled: (counts.get(dept.id) || 0) === 0 && ((filters?.departmentIds?.length ?? 0) > 0)
        }));
    }, [departments, filteredUsers, filters?.departmentIds]);

    const roleOptions = useMemo(() => {
        const counts = new Map<string, number>();
        filteredUsers.forEach(user => {
            if (user.role_id) {
                counts.set(user.role_id, (counts.get(user.role_id) || 0) + 1);
            }
        });

        return roles.map(role => ({
            value: role.id,
            label: role.name,
            count: counts.get(role.id) || 0,
            disabled: (counts.get(role.id) || 0) === 0 && ((filters?.roleIds?.length ?? 0) > 0)
        }));
    }, [roles, filteredUsers, filters?.roleIds]);

    const projectOptions = useMemo(() => {
        const counts = new Map<string, number>();
        filteredUsers.forEach(user => {
            const userProjects = user.project_ids || [];
            userProjects.forEach((pid: string) => {
                counts.set(pid, (counts.get(pid) || 0) + 1);
            });
        });

        return projects.map(project => ({
            value: project.id,
            label: project.name,
            count: counts.get(project.id) || 0,
            disabled: (counts.get(project.id) || 0) === 0 && ((filters?.projectIds?.length ?? 0) > 0)
        }));
    }, [projects, filteredUsers, filters?.projectIds]);

    const areaOptions = useMemo(() => {
        const counts = new Map<string, number>();
        filteredUsers.forEach(user => {
            if (user.area_id) {
                counts.set(user.area_id, (counts.get(user.area_id) || 0) + 1);
            }
        });

        return areas.map(area => ({
            value: area.id,
            label: area.name,
            count: counts.get(area.id) || 0,
            disabled: (counts.get(area.id) || 0) === 0 && ((filters?.areaIds?.length ?? 0) > 0)
        }));
    }, [areas, filteredUsers, filters?.areaIds]);

    const handleClearAll = () => {
        onFiltersChange?.({
            departmentIds: [],
            projectIds: [],
            roleIds: [],
            areaIds: [],
        });
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                {children || (
                    <Button
                        variant="outline"
                        className={cn(
                            "h-8 font-bold border-slate-400 rounded-sm transition-all relative text-sm",
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
                )}
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col bg-white border-t border-t-[0.0625rem] border-[#e5e7eb]">
                <div className="p-6 pb-0">
                    <SheetHeader>
                        <SheetTitle className="text-xl font-bold text-neutral-900">
                            Filters
                        </SheetTitle>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex flex-col gap-4">
                        <MultiSelect
                            label="Department"
                            placeholder="Select departments..."
                            options={departmentOptions}
                            selected={filters?.departmentIds || []}
                            onChange={(selected) => onFiltersChange?.({ ...filters, departmentIds: selected })}
                        />

                        <MultiSelect
                            label="Project"
                            placeholder="Select projects..."
                            options={projectOptions}
                            selected={filters?.projectIds || []}
                            onChange={(selected) => onFiltersChange?.({ ...filters, projectIds: selected })}
                        />

                        <MultiSelect
                            label="Role"
                            placeholder="Select roles..."
                            options={roleOptions}
                            selected={filters?.roleIds || []}
                            onChange={(selected) => onFiltersChange?.({ ...filters, roleIds: selected })}
                        />

                        <MultiSelect
                            label="Area"
                            placeholder="Select areas..."
                            options={areaOptions}
                            selected={filters?.areaIds || []}
                            onChange={(selected) => onFiltersChange?.({ ...filters, areaIds: selected })}
                        />
                    </div>
                </div>

                <div className="border-t border-[#e5e7eb] p-6 bg-white">
                    <div className="flex items-center justify-between gap-4">
                        <button
                            onClick={handleClearAll}
                            className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            Reset to default
                        </button>
                        <Button
                            onClick={() => setIsOpen(false)}
                            className="h-10 px-6 font-bold text-neutral-900 rounded-sm"
                            style={{ backgroundColor: '#e2f337' }}
                        >
                            <Check className="w-4 h-4 mr-2" />
                            Apply Filters
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
