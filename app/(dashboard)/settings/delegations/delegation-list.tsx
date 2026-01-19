'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { Trash2, Calendar, User } from 'lucide-react';
import { format, isPast, isFuture, isWithinInterval } from 'date-fns';

interface Delegation {
    id: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    delegate: {
        id: string;
        name: string;
        lastname: string;
        email: string;
    };
}

interface Props {
    delegations: Delegation[];
    userId: string;
}

export function DelegationList({ delegations, userId }: Props) {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (delegationId: string) => {
        setDeletingId(delegationId);

        try {
            const response = await fetch(`/api/approvals/delegations/${delegationId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to cancel delegation');
            }

            toast({
                title: 'Success',
                description: 'Delegation cancelled successfully',
            });

            router.refresh();
        } catch (error) {
            console.error('Cancel delegation error:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to cancel delegation',
                variant: 'destructive',
            });
        } finally {
            setDeletingId(null);
        }
    };

    const getDelegationStatus = (delegation: Delegation) => {
        const now = new Date();
        const start = new Date(delegation.startDate);
        const end = new Date(delegation.endDate);

        if (!delegation.isActive) {
            return { label: 'Cancelled', variant: 'secondary' as const };
        }

        if (isPast(end)) {
            return { label: 'Expired', variant: 'secondary' as const };
        }

        if (isWithinInterval(now, { start, end })) {
            return { label: 'Active', variant: 'default' as const };
        }

        if (isFuture(start)) {
            return { label: 'Scheduled', variant: 'outline' as const };
        }

        return { label: 'Unknown', variant: 'secondary' as const };
    };

    if (delegations.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Your Delegations</CardTitle>
                    <CardDescription>No delegations found</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Delegations</CardTitle>
                <CardDescription>Manage your approval delegations</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {delegations.map((delegation) => {
                        const status = getDelegationStatus(delegation);
                        const canCancel = delegation.isActive && !isPast(new Date(delegation.endDate));

                        return (
                            <div
                                key={delegation.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">
                                            {delegation.delegate.name} {delegation.delegate.lastname}
                                        </span>
                                        <Badge variant={status.variant}>{status.label}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        <span>
                                            {format(new Date(delegation.startDate), 'MMM d, yyyy')} -{' '}
                                            {format(new Date(delegation.endDate), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                </div>

                                {canCancel && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={deletingId === delegation.id}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Cancel Delegation?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will immediately cancel the delegation to{' '}
                                                    {delegation.delegate.name} {delegation.delegate.lastname}. This action
                                                    cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(delegation.id)}
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    Yes, cancel delegation
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
