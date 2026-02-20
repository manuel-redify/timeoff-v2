"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface StatusFilterProps {
    className?: string;
}

const STATUS_OPTIONS = [
    { value: "all", label: "All" },
    { value: "NEW", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
    { value: "PENDING_REVOKE", label: "Pending Revoke" },
    { value: "CANCELED", label: "Canceled" },
];

export function StatusFilter({ className }: StatusFilterProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const selectedStatus = searchParams.get("status");

    const handleStatusChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "all") {
            params.delete("status");
        } else {
            params.set("status", value);
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <Select
            value={selectedStatus || "all"}
            onValueChange={handleStatusChange}
        >
            <SelectTrigger className="w-[140px] h-8 text-sm rounded-sm border-neutral-200">
                <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="rounded-sm">
                {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-sm">
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
