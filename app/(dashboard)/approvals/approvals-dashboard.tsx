'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Check, X, Calendar, Briefcase, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ConflictIndicator } from '@/components/approvals/conflict-indicator';
import { StatusBadge } from '@/components/ui/status-badge';

interface ApprovalRequest {
    id: string;
    dateStart: Date;
    dateEnd: Date;
    dayPartStart: string;
    dayPartEnd: string;
    employeeComment: string | null;
    createdAt: Date;
    isDelegated: boolean;
    originalApproverId: string | null;
    user: {
        id: string;
        name: string;
        lastname: string;
        email: string;
        department: {
            id: string;
            name: string;
        } | null;
        projects: Array<{
            project: { id: string; name: string; type: string };
            role: { id: string; name: string } | null;
        }>;
    };
    leaveType: {
        id: string;
        name: string;
        color: string;
    };
    approvalSteps: Array<{
        id: string;
        role: {
            id: string;
            name: string;
        } | null;
        project: {
            id: string;
            name: string;
            type: string;
        } | null;
    }>;
}

interface User {
    id: string;
    name: string;
    lastname: string;
    companyId: string;
    isAdmin: boolean;
}

interface Props {
    initialApprovals: ApprovalRequest[];
    user: User;
}

export function ApprovalsDashboard({ initialApprovals, user }: Props) {
    const router = useRouter();
    const [approvals, setApprovals] = useState(initialApprovals);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectComment, setRejectComment] = useState('');
    const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(approvals.map((a) => a.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        const newSelected = new Set(selectedIds);
        if (checked) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkAction = async (action: 'approve' | 'reject') => {
        if (selectedIds.size === 0) {
            toast({
                title: 'No requests selected',
                description: 'Please select at least one request to process',
                variant: 'destructive',
            });
            return;
        }

        if (action === 'reject') {
            setActionType('reject');
            setShowRejectDialog(true);
            return;
        }

        await processBulkAction(action, undefined);
    };

    const processBulkAction = async (action: 'approve' | 'reject', comment?: string) => {
        setIsProcessing(true);

        try {
            const response = await fetch('/api/approvals/bulk-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestIds: Array.from(selectedIds),
                    action,
                    comment,
                }),
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => null);
                const message = errorPayload?.error || 'Failed to process requests';

                toast({
                    title: 'Error',
                    description: message,
                    variant: 'destructive',
                });
                return;
            }

            const result = await response.json();

            toast({
                title: 'Success',
                description: `${result.processed} request(s) ${action === 'approve' ? 'approved' : 'rejected'}`,
            });

            // Remove processed requests from the list
            setApprovals(approvals.filter((a) => !selectedIds.has(a.id)));
            setSelectedIds(new Set());
            setShowRejectDialog(false);
            setRejectComment('');
            router.refresh();
        } catch (error) {
            console.error('Bulk action error:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to process requests',
                variant: 'destructive',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSingleAction = async (id: string, action: 'approve' | 'reject') => {
        if (action === 'reject') {
            setSelectedIds(new Set([id]));
            setActionType('reject');
            setShowRejectDialog(true);
            return;
        }

        // Show immediate feedback
        const requestId = id;
        setApprovals(prev => prev.filter((a) => a.id !== requestId));
        
        toast({
            title: 'Processing',
            description: 'Request is being approved...',
        });

        try {
            const response = await fetch(`/api/leave-requests/${requestId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => null);
                const message = errorPayload?.error || 'Failed to process request';
                // Add the request back to the list if it failed
                const originalRequest = approvals.find((a) => a.id === requestId);
                if (originalRequest) {
                    setApprovals(prev => [...prev, originalRequest]);
                }

                toast({
                    title: 'Error',
                    description: message,
                    variant: 'destructive',
                });
                return;
            }

            toast({
                title: 'Success',
                description: 'Request approved successfully',
            });

            router.refresh();
        } catch (error) {
            console.error('Single action error:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to process request',
                variant: 'destructive',
            });
        }
    };

    const calculateDuration = (start: Date, end: Date) => {
        const days = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return `${days} day${days !== 1 ? 's' : ''}`;
    };

    return (
        <>
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                    <Card className="shadow-lg border-2">
                        <CardContent className="flex items-center gap-4 p-4">
                            <span className="text-sm font-medium">
                                {selectedIds.size} request{selectedIds.size !== 1 ? 's' : ''} selected
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleBulkAction('approve')}
                                    disabled={isProcessing}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <Check className="h-4 w-4 mr-1" />
                                    Approve All
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleBulkAction('reject')}
                                    disabled={isProcessing}
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Reject All
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedIds(new Set())}
                                    disabled={isProcessing}
                                >
                                    Clear
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="space-y-4">
                {approvals.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                        <Checkbox
                            id="select-all"
                            checked={selectedIds.size === approvals.length && approvals.length > 0}
                            onCheckedChange={handleSelectAll}
                        />
                        <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                            Select all ({approvals.length})
                        </label>
                    </div>
                )}

                {approvals.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">No pending approvals</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {approvals.map((approval) => (
                            <Card 
                                key={approval.id} 
                                className={`hover:shadow-md transition-shadow overflow-hidden relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5 before:bg-yellow-400 before:z-10 cursor-pointer ${selectedIds.has(approval.id) ? 'border-2 border-[#e2f337]' : ''}`}
                                onClick={() => handleSelectOne(approval.id, !selectedIds.has(approval.id))}
                            >
                                <CardHeader className="p-3 pb-0 pl-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2 min-w-0 flex-1">
                                            <div className="min-w-0 flex-1">
                                                <CardTitle className="text-2xl font-semibold truncate">
                                                    {approval.user.name} {approval.user.lastname}
                                                </CardTitle>
                                                {approval.isDelegated && (
                                                    <Badge variant="secondary" className="mt-1 text-xs py-0 h-5">
                                                        Delegated
                                                    </Badge>
                                                )}
                                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-base text-muted-foreground">
                                                    {approval.user.department && (
                                                        <span className="flex items-center gap-1 truncate">
                                                            <Briefcase className="h-4 w-4 flex-shrink-0" />
                                                            {approval.user.department.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-base text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-4 w-4 flex-shrink-0" />
                                                        {format(new Date(approval.dateStart), 'MMM d')} - {format(new Date(approval.dateEnd), 'MMM d, yyyy')}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4 flex-shrink-0" />
                                                        {calculateDuration(approval.dateStart, approval.dateEnd)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 items-end flex-shrink-0">
                                            <StatusBadge status="PENDING" />
                                            <Badge
                                                style={{
                                                    backgroundColor: `var(--leave-type-color, ${approval.leaveType.color})`,
                                                    color: '#fff',
                                                }}
                                                className="text-sm py-0 h-5"
                                            >
                                                {approval.leaveType.name}
                                            </Badge>
                                            <ConflictIndicator leaveRequestId={approval.id} />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-3 pt-2 pl-4">
                                    {approval.user.projects && approval.user.projects.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-1 text-xs mb-2">
                                            {approval.user.projects.map((up) => (
                                                <span key={up.project.id} className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                                    {up.project.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {approval.employeeComment && (
                                        <div className="mb-2 p-2 bg-muted rounded-md">
                                            <p className="text-xs font-medium mb-0.5">Comment:</p>
                                            <p className="text-xs truncate" title={approval.employeeComment}>{approval.employeeComment}</p>
                                        </div>
                                    )}

                                    <div className="flex gap-1.5 justify-end">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                                            onClick={(e) => { e.stopPropagation(); handleSingleAction(approval.id, 'reject'); }}
                                            disabled={isProcessing}
                                        >
                                            <X className="h-3 w-3 mr-1" />
                                            Reject
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="h-7 text-xs bg-green-600 hover:bg-green-700 px-2"
                                            onClick={(e) => { e.stopPropagation(); handleSingleAction(approval.id, 'approve'); }}
                                            disabled={isProcessing}
                                        >
                                            <Check className="h-3 w-3 mr-1" />
                                            Approve
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Request(s)</DialogTitle>
                         <DialogDescription>
                             Please provide a reason for rejecting {selectedIds.size} request{selectedIds.size === 1 ? '' : 's'}.
                         </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Enter rejection reason..."
                            value={rejectComment}
                            onChange={(e) => setRejectComment(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowRejectDialog(false);
                                setRejectComment('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => processBulkAction('reject', rejectComment)}
                            disabled={!rejectComment.trim() || isProcessing}
                        >
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
