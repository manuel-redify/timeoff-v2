"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface YearFilterProps {
    availableYears: number[];
    currentYear: number;
}

export function YearFilter({ availableYears, currentYear }: YearFilterProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const selectedYear = searchParams.get("year");

    const handleYearChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "all") {
            params.delete("year");
        } else {
            params.set("year", value);
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <Select
            value={selectedYear || "all"}
            onValueChange={handleYearChange}
        >
            <SelectTrigger className="w-[140px] h-8 text-sm rounded-sm border-neutral-200">
                <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent className="rounded-sm">
                <SelectItem value="all" className="text-sm">
                    All Time
                </SelectItem>
                {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()} className="text-sm">
                        {year}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
