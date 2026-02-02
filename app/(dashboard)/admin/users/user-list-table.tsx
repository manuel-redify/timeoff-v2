"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UserListTable({ initialUsers, departments, roles, areas }: { initialUsers: any[], departments: any[], roles: any[], areas: any[] }) {
    const [search, setSearch] = useState("");
    const [deptFilter, setDeptFilter] = useState("all");
    const [roleFilter, setRoleFilter] = useState("all");

    const filteredUsers = useMemo(() => {
        return initialUsers
            .filter(user => {
                const fullName = `${user.name} ${user.lastname}`.toLowerCase();
                const email = user.email.toLowerCase();
                const searchTerm = search.toLowerCase();

                const matchesSearch = fullName.includes(searchTerm) || email.includes(searchTerm);

                const matchesDept = deptFilter === "all" || user.departmentId === deptFilter;
                const matchesRole = roleFilter === "all" || user.defaultRoleId === roleFilter;

                return matchesSearch && matchesDept && matchesRole;
            })
            .sort((a, b) => {
                // Sort alphabetically by name, then lastname
                const nameA = `${a.name} ${a.lastname}`.toLowerCase();
                const nameB = `${b.name} ${b.lastname}`.toLowerCase();
                return nameA.localeCompare(nameB);
            });
    }, [initialUsers, search, deptFilter, roleFilter]);

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
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="flex-1 md:w-48">
                        <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Department</label>
                        <select
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <option value="all">All Departments</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 md:w-48">
                        <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Role</label>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <option value="all">All Roles</option>
                            {roles.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="border rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-slate-200">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                        <tr>
                            <th className="px-6 py-4">Employee</th>
                            <th className="px-6 py-4">Country</th>
                            <th className="px-6 py-4">Department</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Area</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-base">{user.name} {user.lastname}</div>
                                    <div className="text-slate-500 font-medium">{user.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-slate-600 font-bold bg-slate-100 px-2 py-1 rounded text-xs">
                                        {user.country ?? '??'}
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
                                <td className="px-6 py-4">
                                    <span className="text-slate-600 font-medium">
                                        {user.area?.name ?? 'Unassigned'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${user.activated
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                        {user.activated ? 'Active' : 'Disabled'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link href={`/admin/users/${user.id}`}>
                                        <Button variant="outline" size="sm" className="font-semibold">Manage</Button>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-16 text-center">
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
