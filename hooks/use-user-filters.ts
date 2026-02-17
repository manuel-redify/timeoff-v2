"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export interface UserFilters {
    country?: string[];
    departmentIds?: string[];
    roleIds?: string[];
    areaIds?: string[];
    projectIds?: string[];
    contractTypeIds?: string[];
    status?: 'active' | 'disabled';
}

function parseFiltersFromURL(params: URLSearchParams): UserFilters {
    const newFilters: UserFilters = {};
    
    const country = params.get('country');
    if (country) newFilters.country = country.split(',');
    
    const departmentIds = params.get('departmentIds');
    if (departmentIds) newFilters.departmentIds = departmentIds.split(',');
    
    const roleIds = params.get('roleIds');
    if (roleIds) newFilters.roleIds = roleIds.split(',');
    
    const areaIds = params.get('areaIds');
    if (areaIds) newFilters.areaIds = areaIds.split(',');
    
    const projectIds = params.get('projectIds');
    if (projectIds) newFilters.projectIds = projectIds.split(',');
    
    const contractTypeIds = params.get('contractTypeIds');
    if (contractTypeIds) newFilters.contractTypeIds = contractTypeIds.split(',');
    
    const status = params.get('status');
    if (status && (status === 'active' || status === 'disabled')) {
        newFilters.status = status;
    }
    
    return newFilters;
}

export function useUserFilters() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    
    // Parse filters from URL using useMemo to avoid re-parsing on every render
    const urlFilters = useMemo(() => {
        return parseFiltersFromURL(searchParams);
    }, [searchParams]);
    
    // Local state for filters - initialized from URL but kept separate
    const [filters, setFiltersState] = useState<UserFilters>({});
    
    // Sync local state with URL params on mount and when URL changes
    useEffect(() => {
        setFiltersState(urlFilters);
    }, [urlFilters]);
    
    // Update URL when filters are explicitly changed (not during initial load)
    const setFilters = useCallback((newFilters: UserFilters | ((prev: UserFilters) => UserFilters)) => {
        setFiltersState(prev => {
            const updated = typeof newFilters === 'function' ? newFilters(prev) : newFilters;
            
            // Only update URL if filters actually changed
            const params = new URLSearchParams();
            
            if (updated.country?.length) {
                params.set('country', updated.country.join(','));
            }
            if (updated.departmentIds?.length) {
                params.set('departmentIds', updated.departmentIds.join(','));
            }
            if (updated.roleIds?.length) {
                params.set('roleIds', updated.roleIds.join(','));
            }
            if (updated.areaIds?.length) {
                params.set('areaIds', updated.areaIds.join(','));
            }
            if (updated.projectIds?.length) {
                params.set('projectIds', updated.projectIds.join(','));
            }
            if (updated.contractTypeIds?.length) {
                params.set('contractTypeIds', updated.contractTypeIds.join(','));
            }
            if (updated.status) {
                params.set('status', updated.status);
            }
            
            const queryString = params.toString();
            const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
            
            // Use setTimeout to defer the router call to avoid the render-phase issue
            setTimeout(() => {
                router.replace(newUrl, { scroll: false });
            }, 0);
            
            return updated;
        });
    }, [pathname, router]);

    return {
        filters,
        setFilters
    };
}
