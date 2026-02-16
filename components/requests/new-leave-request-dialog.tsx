"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { LeaveRequestForm } from "./leave-request-form";
import { toast } from "sonner";

interface LeaveType {
    id: string;
    name: string;
    useAllowance: boolean;
    limit: number | null;
}

interface NewLeaveRequestDialogProps {
    userId: string;
    children?: React.ReactNode;
}

export function NewLeaveRequestDialog({ userId, children }: NewLeaveRequestDialogProps) {
    const [open, setOpen] = useState(false);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    useEffect(() => {
        if (open) {
            fetchLeaveTypes();
        }
    }, [open]);

    async function fetchLeaveTypes() {
        setIsLoading(true);
        try {
            const response = await fetch("/api/leave-types");
            if (!response.ok) {
                throw new Error("Failed to fetch leave types");
            }
            const data = await response.json();
            if (data.success) {
                setLeaveTypes(data.data.map((lt: any) => ({
                    id: lt.id,
                    name: lt.name,
                    useAllowance: lt.useAllowance,
                    limit: lt.limit,
                })));
            }
        } catch (error) {
            toast.error("Failed to load leave types");
        } finally {
            setIsLoading(false);
        }
    }

    function handleSuccess() {
        setOpen(false);
    }

    const triggerButton = children || (
        <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Request
        </Button>
    );

    const formContent = isLoading ? (
        <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
    ) : (
        <LeaveRequestForm
            leaveTypes={leaveTypes}
            userId={userId}
            onSuccess={handleSuccess}
        />
    );

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {triggerButton}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>New Leave Request</DialogTitle>
                        <DialogDescription>
                            Submit a new leave request for approval.
                        </DialogDescription>
                    </DialogHeader>
                    {formContent}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {triggerButton}
            </DrawerTrigger>
            <DrawerContent className="max-h-[90vh]">
                <DrawerHeader className="text-left">
                    <DrawerTitle>New Leave Request</DrawerTitle>
                    <DrawerDescription>
                        Submit a new leave request for approval.
                    </DrawerDescription>
                </DrawerHeader>
                <div className="px-4 pb-4 overflow-y-auto">
                    {formContent}
                </div>
            </DrawerContent>
        </Drawer>
    );
}
