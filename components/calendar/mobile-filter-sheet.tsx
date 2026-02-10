"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Filter, Check } from "lucide-react";
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
    defaultRole?: { id: string; name: string };
    area_id?: string;
    area?: { id: string; name: string };
    projects?: { projectId: string }[];
    department?: { id: string; name: string };
}

interface FilterState {
    departmentIds?: string[];
    projectIds?: string[];
    roleIds?: string[];
    areaIds?: string[];
}

interface MobileFilterSheetProps {
    filters?: FilterState;
    onFiltersChange?: (filters: FilterState) => void;
    children?: React.ReactNode;
}

function FilterContent({ 
    filters, 
    onFiltersChange, 
    onClose,
    departments,
    users,
    roles,
    projects,
    areas
}: { 
    filters: FilterState | undefined;
    onFiltersChange: ((filters: FilterState) => void) | undefined;
    onClose: () => void;
    departments: any[];
    users: User[];
    roles: any[];
    projects: any[];
    areas: any[];
}) {
    // Local state for draft filters - initialized fresh when component mounts
    const [draftFilters, setDraftFilters] = useState<FilterState>(() => filters || {});

    // Get filtered users based on DRAFT selections (for facet counts)
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            if ((draftFilters?.departmentIds?.length ?? 0) > 0) {
                if (!(draftFilters?.departmentIds?.includes(user.department?.id || '') ?? false)) {
                    return false;
                }
            }
            if ((draftFilters?.roleIds?.length ?? 0) > 0) {
                if (!(draftFilters?.roleIds?.includes(user.defaultRole?.id || '') ?? false)) {
                    return false;
                }
            }
            if ((draftFilters?.projectIds?.length ?? 0) > 0) {
                const userProjectIds = user.projects?.map(p => p.projectId) || [];
                const hasMatchingProject = draftFilters?.projectIds?.some(pid => 
                    userProjectIds.includes(pid)
                ) ?? false;
                if (!hasMatchingProject) {
                    return false;
                }
            }
            if ((draftFilters?.areaIds?.length ?? 0) > 0) {
                if (!(draftFilters?.areaIds?.includes(user.area_id || '') ?? false)) {
                    return false;
                }
            }
            return true;
        });
    }, [users, draftFilters]);

    // Helper to check if user would be included with current filters + additional filter
    const wouldIncludeUser = useCallback((user: User, additionalFilters: FilterState = {}) => {
        const testFilters = { ...draftFilters, ...additionalFilters };
        
        // Check department filter
        if ((testFilters.departmentIds?.length ?? 0) > 0) {
            if (!(testFilters.departmentIds?.includes(user.department?.id || '') ?? false)) {
                return false;
            }
        }
        // Check role filter
        if ((testFilters.roleIds?.length ?? 0) > 0) {
            if (!(testFilters.roleIds?.includes(user.defaultRole?.id || '') ?? false)) {
                return false;
            }
        }
        // Check project filter
        if ((testFilters.projectIds?.length ?? 0) > 0) {
            const userProjectIds = user.projects?.map(p => p.projectId) || [];
            const hasMatchingProject = testFilters.projectIds?.some(pid => 
                userProjectIds.includes(pid)
            ) ?? false;
            if (!hasMatchingProject) {
                return false;
            }
        }
        // Check area filter
        if ((draftFilters?.areaIds?.length ?? 0) > 0) {
            if (!(draftFilters?.areaIds?.includes(user.area?.id || '') ?? false)) {
                return false;
            }
        }
        return true;
    }, [draftFilters]);

    // Calculate available options and counts for each filter (cross-filtered)
    const departmentOptions = useMemo(() => {
        const availableDepts = departments.filter(dept => {
            // Check if adding this department would still result in users
            const testFilters = { ...draftFilters, departmentIds: [...(draftFilters.departmentIds || []), dept.id] };
            return users.some(user => wouldIncludeUser(user, testFilters));
        });

        return availableDepts.map(dept => {
            const counts = new Map<string, number>();
            users.forEach(user => {
                if (wouldIncludeUser(user, { ...draftFilters, departmentIds: [...(draftFilters.departmentIds || []), dept.id] })) {
                    counts.set(user.department?.id || '', (counts.get(user.department?.id || '') || 0) + 1);
                }
            });
            
            return {
                value: dept.id,
                label: dept.name,
                count: counts.get(dept.id) || 0
            };
        });
    }, [departments, users, wouldIncludeUser]);

    const roleOptions = useMemo(() => {
        const availableRoles = roles.filter(role => {
            const testFilters = { ...draftFilters, roleIds: [...(draftFilters.roleIds || []), role.id] };
            return users.some(user => wouldIncludeUser(user, testFilters));
        });

        return availableRoles.map(role => {
            const counts = new Map<string, number>();
            users.forEach(user => {
                if (wouldIncludeUser(user, { ...draftFilters, roleIds: [...(draftFilters.roleIds || []), role.id] })) {
                    counts.set(user.defaultRole?.id || '', (counts.get(user.defaultRole?.id || '') || 0) + 1);
                }
            });
            
            return {
                value: role.id,
                label: role.name,
                count: counts.get(role.id) || 0
            };
        });
    }, [roles, users, wouldIncludeUser]);

    const projectOptions = useMemo(() => {
        const availableProjects = projects.filter(project => {
            const testFilters = { ...draftFilters, projectIds: [...(draftFilters.projectIds || []), project.id] };
            return users.some(user => wouldIncludeUser(user, testFilters));
        });

        return availableProjects.map(project => {
            const counts = new Map<string, number>();
            users.forEach(user => {
                if (wouldIncludeUser(user, { ...draftFilters, projectIds: [...(draftFilters.projectIds || []), project.id] })) {
                    (user.projects?.map(p => p.projectId) || []).forEach((pid: string) => {
                        if (pid === project.id) {
                            counts.set(pid, (counts.get(pid) || 0) + 1);
                        }
                    });
                }
            });
            
            return {
                value: project.id,
                label: project.name,
                count: counts.get(project.id) || 0
            };
        });
    }, [projects, users, wouldIncludeUser]);

    const areaOptions = useMemo(() => {
        const availableAreas = areas.filter(area => {
            const testFilters = { ...draftFilters, areaIds: [...(draftFilters.areaIds || []), area.id] };
            return users.some(user => wouldIncludeUser(user, testFilters));
        });

        return availableAreas.map(area => {
            const counts = new Map<string, number>();
            users.forEach(user => {
                if (wouldIncludeUser(user, { ...draftFilters, areaIds: [...(draftFilters.areaIds || []), area.id] })) {
                    if (user.area_id === area.id) {
                        counts.set(area.id, (counts.get(area.id) || 0) + 1);
                    }
                }
            });
            
            return {
                value: area.id,
                label: area.name,
                count: counts.get(area.id) || 0
            };
        });
    }, [areas, users, wouldIncludeUser]);

    // Handle apply - commit draft filters to parent
    const handleApply = useCallback(() => {
        onFiltersChange?.(draftFilters);
        onClose();
    }, [draftFilters, onFiltersChange, onClose]);

    // Handle reset - clear draft filters
    const handleReset = useCallback(() => {
        setDraftFilters({
            departmentIds: [],
            projectIds: [],
            roleIds: [],
            areaIds: [],
        });
    }, []);

    return (
        <>
            <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col gap-4">
                    <MultiSelect
                        label="Department"
                        placeholder="Select departments..."
                        options={departmentOptions}
                        selected={draftFilters?.departmentIds || []}
                        onChange={(selected) => setDraftFilters(prev => ({ ...prev, departmentIds: selected }))}
                    />

                    <MultiSelect
                        label="Project"
                        placeholder="Select projects..."
                        options={projectOptions}
                        selected={draftFilters?.projectIds || []}
                        onChange={(selected) => setDraftFilters(prev => ({ ...prev, projectIds: selected }))}
                    />

                    <MultiSelect
                        label="Role"
                        placeholder="Select roles..."
                        options={roleOptions}
                        selected={draftFilters?.roleIds || []}
                        onChange={(selected) => setDraftFilters(prev => ({ ...prev, roleIds: selected }))}
                    />

                    <MultiSelect
                        label="Area"
                        placeholder="Select areas..."
                        options={areaOptions}
                        selected={draftFilters?.areaIds || []}
                        onChange={(selected) => setDraftFilters(prev => ({ ...prev, areaIds: selected }))}
                    />
                </div>
            </div>

            <div className="border-t border-[#e5e7eb] p-6 bg-white">
                <div className="flex items-center justify-between gap-4">
                    <button
                        onClick={handleReset}
                        className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        Reset to default
                    </button>
                    <Button
                        onClick={handleApply}
                        className="h-10 px-6 font-bold text-neutral-900 rounded-sm"
                        style={{ backgroundColor: '#e2f337' }}
                    >
                        <Check className="w-4 h-4 mr-2" />
                        Apply Filters
                    </Button>
                </div>
            </div>
        </>
    );
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

    // Count based on APPLIED filters (for the badge)
    const activeFiltersCount = [
        ...(filters?.departmentIds || []),
        ...(filters?.projectIds || []),
        ...(filters?.roleIds || []),
        ...(filters?.areaIds || []),
    ].filter(Boolean).length;

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

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
                            <span className="ml-2 bg-[#e2f337] text-slate-900 size-5 rounded-full flex items-center justify-center text-[10px] font-bold">
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

                {/* Use key to force remount when opening, ensuring fresh draft state */}
                {isOpen && (
                    <FilterContent
                        key={isOpen ? 'open' : 'closed'}
                        filters={filters}
                        onFiltersChange={onFiltersChange}
                        onClose={handleClose}
                        departments={departments}
                        users={users}
                        roles={roles}
                        projects={projects}
                        areas={areas}
                    />
                )}
            </SheetContent>
        </Sheet>
    );
}
