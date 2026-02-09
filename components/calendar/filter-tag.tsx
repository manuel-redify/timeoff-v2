"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterTagProps {
    label: string;
    onRemove: () => void;
    className?: string;
}

export function FilterTag({ label, onRemove, className }: FilterTagProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
                "border border-slate-200 bg-white text-slate-700",
                "text-xs font-medium transition-all hover:bg-slate-50",
                className
            )}
        >
            <span className="truncate max-w-[120px]">{label}</span>
            <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
                className="size-4 p-0 hover:bg-slate-200 rounded-full"
            >
                <X className="size-3" />
            </Button>
        </div>
    );
}
