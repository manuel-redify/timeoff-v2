"use client";

import { useState, useEffect, useCallback } from "react";
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

export function useUserFilters() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    
    const [filters, setFiltersState] = useState<UserFilters>(() => {
        return parseFiltersFromURL(searchParams);
    });

    // Parse filters from URL params
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

    // Update URL when filters change
    const updateURL = useCallback((newFilters: UserFilters) => {
        const params = new URLSearchParams();
        
        if (newFilters.country?.length) {
            params.set('country', newFilters.country.join(','));
        }
        if (newFilters.departmentIds?.length) {
            params.set('departmentIds', newFilters.departmentIds.join(','));
        }
        if (newFilters.roleIds?.length) {
            params.set('roleIds', newFilters.roleIds.join(','));
        }
        if (newFilters.areaIds?.length) {
            params.set('areaIds', newFilters.areaIds.join(','));
        }
        if (newFilters.projectIds?.length) {
            params.set('projectIds', newFilters.projectIds.join(','));
        }
        if (newFilters.contractTypeIds?.length) {
            params.set('contractTypeIds', newFilters.contractTypeIds.join(','));
        }
        if (newFilters.status) {
            params.set('status', newFilters.status);
        }
        
        const queryString = params.toString();
        const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
        
        router.replace(newUrl, { scroll: false });
    }, [pathname, router]);

    // Set filters and update URL
    const setFilters = useCallback((newFilters: UserFilters | ((prev: UserFilters) => UserFilters)) => {
        setFiltersState(prev => {
            const updated = typeof newFilters === 'function' ? newFilters(prev) : newFilters;
            updateURL(updated);
            return updated;
        });
    }, [updateURL]);

    // Listen to URL changes (e.g., browser back/forward)
    useEffect(() => {
        const newFilters = parseFiltersFromURL(searchParams);
        setFiltersState(newFilters);
    }, [searchParams]);

    return {
        filters,
        setFilters
    };
}
