"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
        case 'approved':
            return '#dcfae7'; // light green
        case 'rejected':
            return '#ef4444'; // red  
        case 'pending':
        case 'new':
            return '#faf2c8'; // light yellow
        default:
            return '#94a3b8'; // slate
    }
}

interface ListViewProps {
    date: Date;
    filters?: {
        departmentId?: string;
        userId?: string;
        leaveTypeId?: string;
        status?: string;
        search?: string;
        departmentIds?: string[];
        projectIds?: string[];
        roleIds?: string[];
        areaIds?: string[];
    };
    onFiltersChange?: (filters: Partial<ListViewProps['filters']>) => void;
}

export function ListView({ date, filters: sharedFilters, onFiltersChange }: ListViewProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                let url = `/api/calendar/list?limit=100`;
                
                // Add filters if present
                if (sharedFilters?.status && sharedFilters.status !== 'all') url += `&status=${sharedFilters.status}`;
                if (sharedFilters?.leaveTypeId && sharedFilters.leaveTypeId !== 'all') url += `&leave_type_id=${sharedFilters.leaveTypeId}`;
                if (sharedFilters?.search) url += `&search=${encodeURIComponent(sharedFilters.search)}`;
                if (sharedFilters?.departmentId) url += `&department_id=${sharedFilters.departmentId}`;
                if (sharedFilters?.userId) url += `&user_id=${sharedFilters.userId}`;
                
                // Add array filters
                sharedFilters?.departmentIds?.forEach(id => url += `&department_ids=${id}`);
                sharedFilters?.projectIds?.forEach(id => url += `&project_ids=${id}`);
                sharedFilters?.roleIds?.forEach(id => url += `&role_ids=${id}`);
                sharedFilters?.areaIds?.forEach(id => url += `&area_ids=${id}`);

                const res = await fetch(url);
                if (res.ok) {
                    const json = await res.json();
                    setData(json.data);
                }
            } catch (error) {
                console.error("Failed to fetch list data:", error);
            } finally {
                setLoading(false);
            }
        }

        const timer = setTimeout(() => {
            fetchData();
        }, sharedFilters?.search ? 500 : 0);

        return () => clearTimeout(timer);
    }, [sharedFilters]);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'approved': return 'default';
            case 'new': return 'secondary';
            case 'rejected': return 'destructive';
            default: return 'outline';
        }
    };

return (
        <div className="space-y-6">
            {/* List Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <TableHead className="py-4 px-6 min-w-[150px]">People</TableHead>
                                <TableHead className="py-4 px-6 min-w-[150px]">Leave Type</TableHead>
                                <TableHead className="py-4 px-6 min-w-[200px]">Period</TableHead>
                                <TableHead className="py-4 px-6 min-w-[100px]">Status</TableHead>
                                <TableHead className="py-4 px-6 min-w-[150px]">Date Created</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && !data ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <TableCell key={j} className="py-4 px-6">
                                                <Skeleton className="h-4 w-full" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : data?.requests?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-20 text-center">
                                        <p className="font-bold text-slate-400">No requests found matching your filters.</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data?.requests.map((req: any) => (
                                    <TableRow key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="py-4 px-6 font-bold text-slate-900">{req.user.name}</TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className="size-2 rounded-full" style={{ backgroundColor: getStatusColor(req.status) }} />
                                                <span className="text-sm font-medium">{req.leave_type.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="text-sm">
                                                <span className="font-bold">{req.date_start}</span>
                                                <span className="mx-1 text-slate-400">to</span>
                                                <span className="font-bold">{req.date_end}</span>
                                            </div>
                                            {(req.day_part_start !== 'all' || req.day_part_end !== 'all') && (
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                                    {req.day_part_start !== 'all' && `Start: ${req.day_part_start}`}
                                                    {req.day_part_start !== 'all' && req.day_part_end !== 'all' && ' | '}
                                                    {req.day_part_end !== 'all' && `End: ${req.day_part_end}`}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <Badge variant={getStatusVariant(req.status)} className="rounded-lg px-2 font-bold uppercase text-[9px]">
                                                {req.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-sm text-slate-500">
                                            {format(parseISO(req.created_at), 'MMM d, yyyy')}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
