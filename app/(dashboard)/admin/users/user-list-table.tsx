"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { COUNTRIES } from "@/lib/countries";
import { UserFilterDrawer } from "@/components/users/user-filter-drawer";
import { UserActiveFilters } from "@/components/users/user-active-filters";
import { useUserFilters, UserFilters } from "@/hooks/use-user-filters";

interface UserListTableProps {
    initialUsers: any[];
    departments: any[];
    roles: any[];
    areas: any[];
    contractTypes: any[];
    projects: any[];
}

export default function UserListTable({ 
    initialUsers, 
    departments, 
    roles, 
    areas,
    contractTypes,
    projects
}: UserListTableProps) {
    const [search, setSearch] = useState("");
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const { filters, setFilters } = useUserFilters();

    const filteredUsers = useMemo(() => {
        return initialUsers
            .filter(user => {
                const fullName = `${user.name} ${user.lastname}`.toLowerCase();
                const email = user.email.toLowerCase();
                const searchTerm = search.toLowerCase();

                const matchesSearch = fullName.includes(searchTerm) || email.includes(searchTerm);

                // Country filter - multi-select
                const matchesCountry = !filters.country?.length || 
                    filters.country.includes(user.country);

                // Department filter - multi-select
                const matchesDept = !filters.departmentIds?.length || 
                    filters.departmentIds.includes(user.departmentId);

                // Role filter - multi-select
                const matchesRole = !filters.roleIds?.length || 
                    filters.roleIds.includes(user.defaultRoleId);

                // Area filter - multi-select
                const matchesArea = !filters.areaIds?.length || 
                    filters.areaIds.includes(user.areaId);

                // Project filter - multi-select (check if user has any of the selected projects)
                const matchesProject = !filters.projectIds?.length || 
                    (user.projects && user.projects.some((up: any) => 
                        filters.projectIds?.includes(up.projectId)
                    ));

                // Contract Type filter - multi-select
                const matchesContractType = !filters.contractTypeIds?.length || 
                    filters.contractTypeIds.includes(user.contractTypeId);

                // Status filter - single select
                const matchesStatus = !filters.status || 
                    (filters.status === 'active' && user.activated) ||
                    (filters.status === 'disabled' && !user.activated);

                return matchesSearch && 
                       matchesCountry && 
                       matchesDept && 
                       matchesRole && 
                       matchesArea && 
                       matchesProject && 
                       matchesContractType && 
                       matchesStatus;
            })
            .sort((a, b) => {
                // Sort alphabetically by name, then lastname
                const nameA = `${a.name} ${a.lastname}`.toLowerCase();
                const nameB = `${b.name} ${b.lastname}`.toLowerCase();
                return nameA.localeCompare(nameB);
            });
    }, [initialUsers, search, filters]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Search</label>
                    <Input
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-md bg-white"
                    />
                </div>
                <UserFilterDrawer
                    filters={filters}
                    onFiltersChange={setFilters}
                    isOpen={isFilterDrawerOpen}
                    onOpenChange={setIsFilterDrawerOpen}
                    departments={departments}
                    roles={roles}
                    areas={areas}
                    contractTypes={contractTypes}
                    users={initialUsers}
                />
            </div>

            <UserActiveFilters
                filters={filters}
                onFiltersChange={setFilters}
                departments={departments}
                roles={roles}
                areas={areas}
                contractTypes={contractTypes}
                projects={projects}
            />

            <div className="border rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-slate-200">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4 hidden md:table-cell">Country</th>
                            <th className="px-6 py-4">Department</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4 hidden md:table-cell">Area</th>
                            <th className="px-6 py-4 hidden md:table-cell">Projects</th>
                            <th className="px-6 py-4 hidden md:table-cell">Contract</th>
                            <th className="px-6 py-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-6 py-4">
                                    <Link href={`/admin/users/${user.id}`} className="block">
                                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-base">{user.name} {user.lastname}</div>
                                        <div className="text-slate-500 font-medium">{user.email}</div>
                                    </Link>
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell">
                                    <span className="text-slate-600 font-medium">
                                        {user.country ? COUNTRIES.find(c => c.code === user.country)?.name ?? user.country : '—'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-slate-600 font-medium">
                                        {user.department?.name ?? 'Unassigned'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                        {user.defaultRole?.name ?? 'Employee'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell">
                                    <span className="text-slate-600 font-medium">
                                        {user.area?.name ?? 'Unassigned'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell">
                                    <div className="flex flex-wrap gap-1">
                                        {user.projects && user.projects.length > 0 ? (
                                            user.projects.map((up: any) => (
                                                <span 
                                                    key={up.projectId} 
                                                    className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100"
                                                >
                                                    {up.project?.name ?? 'Unknown'}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-slate-400 text-xs">—</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell">
                                    <span className="text-slate-600 font-medium">
                                        {user.contractType?.name ?? '—'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${user.activated
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                        {user.activated ? 'Active' : 'Disabled'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-16 text-center">
                                    <div className="text-slate-400 text-lg font-medium">No employees found</div>
                                    <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="text-sm text-slate-500 font-medium px-2">
                Showing {filteredUsers.length} of {initialUsers.length} total users
            </div>
        </div>
    );
}
