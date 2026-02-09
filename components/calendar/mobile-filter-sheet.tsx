"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Filter, Check } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Briefcase, UserCircle, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
    id: string;
    name: string;
}

interface FilterSectionProps {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    options: FilterOption[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    onSelectAll: () => void;
}

function FilterSection({ title, icon: Icon, options, selectedIds, onToggle, onSelectAll }: FilterSectionProps) {
    const isAllSelected = options.length > 0 && selectedIds.length === options.length;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <label className="text-sm font-bold text-slate-700">
                        {title}
                    </label>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSelectAll}
                    className="text-xs text-blue-600 hover:text-blue-700 h-6 px-2"
                >
                    {isAllSelected ? "Clear All" : "Select All"}
                </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {options.map((option) => (
                    <div
                        key={option.id}
                        onClick={() => onToggle(option.id)}
                        className={cn(
                            "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                            selectedIds.includes(option.id)
                                ? "border-blue-600 bg-blue-50"
                                : "border-slate-200 hover:bg-slate-50"
                        )}
                    >
                        <Checkbox
                            id={`filter-${option.id}`}
                            checked={selectedIds.includes(option.id)}
                            onCheckedChange={() => onToggle(option.id)}
                            className="border-slate-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                        />
                        <label
                            htmlFor={`filter-${option.id}`}
                            className="text-sm font-medium text-slate-700 cursor-pointer truncate"
                        >
                            {option.name}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
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
    const [departments, setDepartments] = useState<FilterOption[]>([]);
    const [projects, setProjects] = useState<FilterOption[]>([]);
    const [roles, setRoles] = useState<FilterOption[]>([]);
    const [areas, setAreas] = useState<FilterOption[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const [deptRes, userRes, ltRes, roleRes, projRes, areaRes] = await Promise.all([
                    fetch('/api/departments'),
                    fetch('/api/users'),
                    fetch('/api/leave-types'),
                    fetch('/api/roles'),
                    fetch('/api/projects'),
                    fetch('/api/areas'),
                ]);

                if (deptRes.ok) {
                    const json = await deptRes.json();
                    const depts = json.data || json;
                    setDepartments(depts.map((d: any) => ({ id: d.id, name: d.name })));
                }
                if (userRes.ok) {
                    const json = await userRes.json();
                    const users = json.data || json;
                    setProjects(users.map((u: any) => ({ id: u.id, name: `${u.name} ${u.lastname}` })));
                }
                if (ltRes.ok) {
                    const json = await ltRes.json();
                    const lts = json.data || json;
                    setRoles(lts.map((lt: any) => ({ id: lt.id, name: lt.name })));
                }
                if (areaRes.ok) {
                    const json = await areaRes.json();
                    const areasData = json.data || json;
                    setAreas(areasData.map((a: any) => ({ id: a.id, name: a.name })));
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

    const handleToggle = (key: 'departmentIds' | 'projectIds' | 'roleIds' | 'areaIds', id: string) => {
        const currentIds = filters?.[key] || [];
        const newIds = currentIds.includes(id)
            ? currentIds.filter((i: string) => i !== id)
            : [...currentIds, id];
        onFiltersChange?.({ ...filters, [key]: newIds });
    };

    const handleSelectAll = (key: 'departmentIds' | 'projectIds' | 'roleIds' | 'areaIds', allIds: string[]) => {
        const currentIds = filters?.[key] || [];
        const newIds = currentIds.length === allIds.length ? [] : allIds;
        onFiltersChange?.({ ...filters, [key]: newIds });
    };

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
                        variant={activeFiltersCount > 0 ? "default" : "outline"}
                        className={cn(
                            "h-10 font-bold border-slate-200 transition-all",
                            activeFiltersCount > 0 ? "bg-blue-600 hover:bg-blue-700" : ""
                        )}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                        {activeFiltersCount > 0 && (
                            <span className="ml-2 bg-white text-blue-600 size-5 rounded-full flex items-center justify-center text-[10px]">
                                {activeFiltersCount}
                            </span>
                        )}
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
                <SheetHeader className="pb-4 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-lg font-black text-slate-900">
                            Filter Calendar
                        </SheetTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsOpen(false)}
                            className="h-8 w-8"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </SheetHeader>

                <div className="flex flex-col gap-6 mt-6 pb-24 overflow-y-auto max-h-[calc(100vh-180px)]">
                    <FilterSection
                        title="Department"
                        icon={Building2}
                        options={departments}
                        selectedIds={filters?.departmentIds || []}
                        onToggle={(id) => handleToggle('departmentIds', id)}
                        onSelectAll={() => handleSelectAll('departmentIds', departments.map(d => d.id))}
                    />

                    <FilterSection
                        title="Project"
                        icon={Briefcase}
                        options={projects}
                        selectedIds={filters?.projectIds || []}
                        onToggle={(id) => handleToggle('projectIds', id)}
                        onSelectAll={() => handleSelectAll('projectIds', projects.map(p => p.id))}
                    />

                    <FilterSection
                        title="Role"
                        icon={UserCircle}
                        options={roles}
                        selectedIds={filters?.roleIds || []}
                        onToggle={(id) => handleToggle('roleIds', id)}
                        onSelectAll={() => handleSelectAll('roleIds', roles.map(r => r.id))}
                    />

                    <FilterSection
                        title="Area"
                        icon={MapPin}
                        options={areas}
                        selectedIds={filters?.areaIds || []}
                        onToggle={(id) => handleToggle('areaIds', id)}
                        onSelectAll={() => handleSelectAll('areaIds', areas.map(a => a.id))}
                    />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100">
                    <div className="flex gap-3">
                        {activeFiltersCount > 0 && (
                            <Button
                                variant="outline"
                                onClick={handleClearAll}
                                className="flex-1"
                            >
                                Clear All
                            </Button>
                        )}
                        <Button
                            onClick={() => setIsOpen(false)}
                            className={cn("flex-1", activeFiltersCount === 0 ? "w-full" : "")}
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
