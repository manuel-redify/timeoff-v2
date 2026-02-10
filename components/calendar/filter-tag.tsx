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
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm",
                "border border-[#e5e7eb] text-slate-900",
                "text-xs font-medium transition-all",
                "bg-[#e2f337]",
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
                className="size-6 -my-1 -my-1 p-0 hover:bg-slate-200 rounded-sm touch-manipulation"
            >
                <X className="size-3.5" />
            </Button>
        </div>
    );
}
