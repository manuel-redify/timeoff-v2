"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { MultiSelect, type Option } from "@/components/ui/multi-select";

interface StatusFilterProps {
    className?: string;
}

const STATUS_OPTIONS: Option[] = [
    { value: "all", label: "All statuses", exclusive: true },
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
    const statusParam = searchParams.get("status") || "";

    const selected = statusParam ? statusParam.split(",").filter(Boolean) : [];

    const handleStatusChange = (newSelected: string[]) => {
        const params = new URLSearchParams(searchParams.toString());
        
        if (newSelected.length === 0 || newSelected.includes("all")) {
            params.delete("status");
        } else {
            params.set("status", newSelected.join(","));
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <MultiSelect
            options={STATUS_OPTIONS}
            selected={selected}
            onChange={handleStatusChange}
            placeholder="Select status..."
            className={className}
        />
    );
}
