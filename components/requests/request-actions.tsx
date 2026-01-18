"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LeaveStatus } from "@/lib/generated/prisma/enums";
import { toast } from "sonner";
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
import { Loader2 } from "lucide-react";

interface RequestActionsProps {
    requestId: string;
    status: LeaveStatus;
    isOwner: boolean;
    canApprove?: boolean; // For approvers later
}

export function RequestActions({ requestId, status, isOwner, canApprove }: RequestActionsProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleCancel = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/leave-requests/${requestId}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            toast.success("Request canceled successfully");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevoke = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/leave-requests/${requestId}/request-revoke`, {
                method: 'POST',
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            toast.success("Revocation requested successfully");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOwner) return null; // APPROVAL ACTIONS will be separate

    return (
        <div className="flex space-x-2">
            {status === LeaveStatus.NEW && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Cancel Request
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently cancel your leave request.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Keep it</AlertDialogCancel>
                            <AlertDialogAction onClick={handleCancel}>Yes, Cancel</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {status === LeaveStatus.APPROVED && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Revoke Request
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Request Revocation</AlertDialogTitle>
                            <AlertDialogDescription>
                                Since this request is already approved, asking to revoke it will create a revocation request that must be approved by your supervisor.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Go Back</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRevoke}>Request Revocation</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {status === LeaveStatus.PENDING_REVOKE && (
                <Button variant="secondary" disabled>
                    Revocation Pending...
                </Button>
            )}
        </div>
    );
}
