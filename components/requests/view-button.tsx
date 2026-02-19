"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { prefetchRequest } from "@/components/requests/request-detail-sheet";
import { Eye } from "lucide-react";

interface ViewButtonProps {
    requestId: string;
}

export function ViewButton({ requestId }: ViewButtonProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleClick = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("requestId", requestId);
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleMouseEnter = () => {
        prefetchRequest(requestId);
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-sm hover:bg-neutral-100"
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
        >
            <Eye className="h-4 w-4 text-neutral-600" />
            <span className="sr-only">View request</span>
        </Button>
    );
}
