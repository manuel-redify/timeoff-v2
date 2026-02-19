"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isBefore, startOfDay, parseISO } from "date-fns";

interface CancelRequestButtonProps {
    requestId: string;
    status: string;
    dateStart: Date | string;
}

export function CancelRequestButton({ requestId, status, dateStart }: CancelRequestButtonProps) {
    const router = useRouter();
    const [isCanceling, setIsCanceling] = useState(false);

    const normalizedStatus = typeof status === 'string' ? status.toUpperCase() : '';
    const canCancelStatus =
        normalizedStatus === 'NEW' ||
        normalizedStatus === 'APPROVED';

    const leaveStartDate = typeof dateStart === 'string' ? parseISO(dateStart) : new Date(dateStart);
    const today = startOfDay(new Date());
    const leaveStart = startOfDay(leaveStartDate);
    const hasNotStarted = isBefore(today, leaveStart);

    const canCancel = canCancelStatus && hasNotStarted;

    if (!canCancel) return null;

    const handleCancel = async () => {
        setIsCanceling(true);
        try {
            const response = await fetch(`/api/leave-requests/${requestId}/cancel`, {
                method: 'POST',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to cancel request');
            }

            toast.success("Request canceled successfully");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to cancel request");
        } finally {
            setIsCanceling(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={isCanceling}
                >
                    {isCanceling ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Trash2 className="h-4 w-4" />
                    )}
                    <span className="sr-only">Cancel request</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Request</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to cancel this leave request? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Keep Request</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel} className="bg-red-600 hover:bg-red-700">
                        Yes, Cancel Request
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
