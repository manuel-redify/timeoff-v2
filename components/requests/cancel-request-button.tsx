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
import { Ban, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { LeaveStatus } from "@/lib/generated/prisma/enums";

interface CancelRequestButtonProps {
    requestId: string;
    status: string; // Using string to handle enum or string input
}

export function CancelRequestButton({ requestId, status }: CancelRequestButtonProps) {
    const router = useRouter();
    // const { toast } = useToast(); -> Removed
    const [isCanceling, setIsCanceling] = useState(false);

    // Only show for NEW or APPROVED requests
    const normalizedStatus = typeof status === 'string' ? status.toUpperCase() : '';
    const canCancel =
        normalizedStatus === 'NEW' ||
        normalizedStatus === 'APPROVED';

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

            toast({
                title: "Success",
                description: "Request canceled successfully",
            });

            router.refresh(); // Refresh page data
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to cancel request",
                variant: "destructive"
            });
        } finally {
            setIsCanceling(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={isCanceling}
                >
                    {isCanceling ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Ban className="h-4 w-4 mr-2" />
                    )}
                    Cancel
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
