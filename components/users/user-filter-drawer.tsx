"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { MultiSelect } from "@/components/ui/multi-select";
import { COUNTRIES } from "@/lib/countries";

interface FilterState {
    country?: string[];
    departmentIds?: string[];
    roleIds?: string[];
    areaIds?: string[];
    projectIds?: string[];
    contractTypeIds?: string[];
    status?: 'active' | 'disabled';
}

interface UserFilterDrawerProps {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    departments: any[];
    roles: any[];
    areas: any[];
    contractTypes: any[];
}

function FilterContent({ 
    filters, 
    onFiltersChange, 
    onClose,
    departments,
    roles,
    areas,
    contractTypes,
    projects
}: { 
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    onClose: () => void;
    departments: any[];
    roles: any[];
    areas: any[];
    contractTypes: any[];
    projects: any[];
}) {
    // Local state for draft filters
    const [draftFilters, setDraftFilters] = useState<FilterState>(filters);

    const countryOptions = useMemo(() => {
        return COUNTRIES.map(country => ({
            value: country.code,
            label: country.name
        }));
    }, []);

    const departmentOptions = useMemo(() => {
        return departments.map(dept => ({
            value: dept.id,
            label: dept.name
        }));
    }, [departments]);

    const roleOptions = useMemo(() => {
        return roles.map(role => ({
            value: role.id,
            label: role.name
        }));
    }, [roles]);

    const areaOptions = useMemo(() => {
        return areas.map(area => ({
            value: area.id,
            label: area.name
        }));
    }, [areas]);

    const projectOptions = useMemo(() => {
        return projects.map(project => ({
            value: project.id,
            label: project.name
        }));
    }, [projects]);

    const contractTypeOptions = useMemo(() => {
        return contractTypes.map(ct => ({
            value: ct.id,
            label: ct.name
        }));
    }, [contractTypes]);

    const statusOptions = [
        { value: 'active', label: 'Active' },
        { value: 'disabled', label: 'Disabled' }
    ];

    // Handle apply - commit draft filters to parent
    const handleApply = useCallback(() => {
        onFiltersChange(draftFilters);
        onClose();
    }, [draftFilters, onFiltersChange, onClose]);

    // Handle reset - clear draft filters
    const handleReset = useCallback(() => {
        setDraftFilters({});
    }, []);

    return (
        <>
            <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col gap-4">
                    <MultiSelect
                        label="Country"
                        placeholder="Select countries..."
                        options={countryOptions}
                        selected={draftFilters?.country || []}
                        onChange={(selected) => setDraftFilters(prev => ({ ...prev, country: selected }))}
                    />

                    <MultiSelect
                        label="Department"
                        placeholder="Select departments..."
                        options={departmentOptions}
                        selected={draftFilters?.departmentIds || []}
                        onChange={(selected) => setDraftFilters(prev => ({ ...prev, departmentIds: selected }))}
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

                    <MultiSelect
                        label="Project"
                        placeholder="Select projects..."
                        options={projectOptions}
                        selected={draftFilters?.projectIds || []}
                        onChange={(selected) => setDraftFilters(prev => ({ ...prev, projectIds: selected }))}
                    />

                    <MultiSelect
                        label="Contract Type"
                        placeholder="Select contract types..."
                        options={contractTypeOptions}
                        selected={draftFilters?.contractTypeIds || []}
                        onChange={(selected) => setDraftFilters(prev => ({ ...prev, contractTypeIds: selected }))}
                    />

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-neutral-400">
                            Status
                        </label>
                        <div className="flex gap-2">
                            {statusOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setDraftFilters(prev => ({
                                        ...prev,
                                        status: prev.status === option.value ? undefined : option.value as 'active' | 'disabled'
                                    }))}
                                    className={cn(
                                        "px-3 py-2 rounded-sm text-sm font-medium border transition-all",
                                        draftFilters.status === option.value
                                            ? "bg-[#e2f337] text-slate-900 border-[#e2f337]"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-200 p-6 bg-white">
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
                        Apply Filters
                    </Button>
                </div>
            </div>
        </>
    );
}

export function UserFilterDrawer({
    filters,
    onFiltersChange,
    isOpen,
    onOpenChange,
    departments,
    roles,
    areas,
    contractTypes
}: UserFilterDrawerProps) {
    const [projects, setProjects] = useState<any[]>([]);

    // Fetch active projects
    useEffect(() => {
        async function fetchProjects() {
            try {
                const res = await fetch('/api/projects?status=ACTIVE');
                if (res.ok) {
                    const json = await res.json();
                    setProjects(json.data || json);
                }
            } catch (error) {
                console.error("Failed to fetch projects:", error);
            }
        }
        fetchProjects();
    }, []);

    // Count based on APPLIED filters (for the badge)
    const activeFiltersCount = [
        ...(filters?.country || []),
        ...(filters?.departmentIds || []),
        ...(filters?.roleIds || []),
        ...(filters?.areaIds || []),
        ...(filters?.projectIds || []),
        ...(filters?.contractTypeIds || []),
        filters?.status
    ].filter(Boolean).length;

    const handleClose = useCallback(() => {
        onOpenChange(false);
    }, [onOpenChange]);

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "h-8 px-3 font-bold border-slate-400 rounded-sm transition-all relative text-sm",
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
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 flex flex-col">
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
                        roles={roles}
                        areas={areas}
                        contractTypes={contractTypes}
                        projects={projects}
                    />
                )}
            </SheetContent>
        </Sheet>
    );
}
