"use client";

import { Button } from "@/components/ui/button";
import { prefetchRequest } from "@/components/requests/request-detail-sheet";
import { Eye } from "lucide-react";

interface ViewButtonProps {
    requestId: string;
    onOpenRequest: (requestId: string) => void;
}

export function ViewButton({ requestId, onOpenRequest }: ViewButtonProps) {
    const handleClick = () => {
        prefetchRequest(requestId);
        onOpenRequest(requestId);
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-sm hover:bg-neutral-100"
            onClick={handleClick}
        >
            <Eye className="h-4 w-4 text-neutral-600" />
            <span className="sr-only">View request</span>
        </Button>
    );
}
