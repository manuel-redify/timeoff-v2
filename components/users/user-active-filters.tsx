"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

interface UserActiveFiltersProps {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    departments: any[];
    roles: any[];
    areas: any[];
    contractTypes: any[];
    projects: any[];
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm",
                "border border-[#e5e7eb] text-slate-900",
                "text-xs font-medium transition-all",
                "bg-[#e2f337]"
            )}
        >
            <span className="truncate max-w-[120px]">{label}</span>
            <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
                className="size-6 -my-1 p-0 hover:bg-slate-200 rounded-sm touch-manipulation"
            >
                <X className="size-3.5" />
            </Button>
        </div>
    );
}

export function UserActiveFilters({
    filters,
    onFiltersChange,
    departments,
    roles,
    areas,
    contractTypes,
    projects
}: UserActiveFiltersProps) {
    const getCountryLabel = (code: string) => {
        return COUNTRIES.find(c => c.code === code)?.name || code;
    };

    const getDepartmentLabel = (id: string) => {
        return departments.find(d => d.id === id)?.name || id;
    };

    const getRoleLabel = (id: string) => {
        return roles.find(r => r.id === id)?.name || id;
    };

    const getAreaLabel = (id: string) => {
        return areas.find(a => a.id === id)?.name || id;
    };

    const getProjectLabel = (id: string) => {
        return projects.find(p => p.id === id)?.name || id;
    };

    const getContractTypeLabel = (id: string) => {
        return contractTypes.find(ct => ct.id === id)?.name || id;
    };

    const handleRemoveFilter = (key: keyof FilterState, value?: string) => {
        const newFilters = { ...filters };
        
        if (key === 'status') {
            delete newFilters.status;
        } else if (value && Array.isArray(newFilters[key])) {
            (newFilters as any)[key] = (newFilters[key] as string[]).filter(v => v !== value);
            if ((newFilters[key] as string[]).length === 0) {
                delete (newFilters as any)[key];
            }
        }
        
        onFiltersChange(newFilters);
    };

    const handleClearAll = () => {
        onFiltersChange({});
    };

    const hasActiveFilters = [
        ...(filters?.country || []),
        ...(filters?.departmentIds || []),
        ...(filters?.roleIds || []),
        ...(filters?.areaIds || []),
        ...(filters?.projectIds || []),
        ...(filters?.contractTypeIds || []),
        filters?.status
    ].filter(Boolean).length > 0;

    if (!hasActiveFilters) return null;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {filters.country?.map(code => (
                <FilterTag
                    key={`country-${code}`}
                    label={`Country: ${getCountryLabel(code)}`}
                    onRemove={() => handleRemoveFilter('country', code)}
                />
            ))}
            
            {filters.departmentIds?.map(id => (
                <FilterTag
                    key={`dept-${id}`}
                    label={`Dept: ${getDepartmentLabel(id)}`}
                    onRemove={() => handleRemoveFilter('departmentIds', id)}
                />
            ))}
            
            {filters.roleIds?.map(id => (
                <FilterTag
                    key={`role-${id}`}
                    label={`Role: ${getRoleLabel(id)}`}
                    onRemove={() => handleRemoveFilter('roleIds', id)}
                />
            ))}
            
            {filters.areaIds?.map(id => (
                <FilterTag
                    key={`area-${id}`}
                    label={`Area: ${getAreaLabel(id)}`}
                    onRemove={() => handleRemoveFilter('areaIds', id)}
                />
            ))}
            
            {filters.projectIds?.map(id => (
                <FilterTag
                    key={`project-${id}`}
                    label={`Project: ${getProjectLabel(id)}`}
                    onRemove={() => handleRemoveFilter('projectIds', id)}
                />
            ))}
            
            {filters.contractTypeIds?.map(id => (
                <FilterTag
                    key={`contract-${id}`}
                    label={`Contract: ${getContractTypeLabel(id)}`}
                    onRemove={() => handleRemoveFilter('contractTypeIds', id)}
                />
            ))}
            
            {filters.status && (
                <FilterTag
                    key={`status-${filters.status}`}
                    label={`Status: ${filters.status === 'active' ? 'Active' : 'Disabled'}`}
                    onRemove={() => handleRemoveFilter('status')}
                />
            )}
            
            <button
                onClick={handleClearAll}
                className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors ml-2"
            >
                Clear all
            </button>
        </div>
    );
}
