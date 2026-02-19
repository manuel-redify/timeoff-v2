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
import { Textarea } from "@/components/ui/textarea";
import { RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isBefore, startOfDay, parseISO, isSameDay } from "date-fns";

interface RequestRevokeButtonProps {
    requestId: string;
    status: string;
    dateStart: Date | string;
}

export function RequestRevokeButton({ requestId, status, dateStart }: RequestRevokeButtonProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reason, setReason] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const normalizedStatus = typeof status === 'string' ? status.toUpperCase() : '';
    
    const leaveStartDate = typeof dateStart === 'string' ? parseISO(dateStart) : new Date(dateStart);
    const today = startOfDay(new Date());
    const leaveStart = startOfDay(leaveStartDate);
    const hasStarted = isBefore(leaveStart, today) || isSameDay(leaveStart, today);

    const isApproved = normalizedStatus === 'APPROVED';
    const isPendingRevoke = normalizedStatus === 'PENDING_REVOKE';

    const canRequestRevoke = isApproved && hasStarted;

    if (!canRequestRevoke) return null;

    if (isPendingRevoke) {
        return (
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-sm text-neutral-400"
                disabled
            >
                <RotateCcw className="h-4 w-4" />
                <span className="sr-only">Revocation pending</span>
            </Button>
        );
    }

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast.error("Please provide a reason for the revocation request");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/leave-requests/${requestId}/request-revoke`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to request revocation');
            }

            toast.success("Revocation request submitted");
            setIsOpen(false);
            setReason("");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to request revocation");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-sm text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                >
                    <RotateCcw className="h-4 w-4" />
                    <span className="sr-only">Request revoke</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Request Leave Revocation</AlertDialogTitle>
                    <AlertDialogDescription>
                        This leave has already started. Please provide a reason for requesting revocation. 
                        An administrator will review your request.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <label className="text-sm font-medium text-neutral-700 mb-2 block">
                        Reason <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Enter the reason for requesting revocation..."
                        className="min-h-[100px] rounded-sm border-neutral-200"
                        disabled={isSubmitting}
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleSubmit}
                        disabled={isSubmitting || !reason.trim()}
                        className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                    >
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Submit Request
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
