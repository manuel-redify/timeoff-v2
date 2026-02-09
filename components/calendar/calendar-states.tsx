"use client";

import { Users, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    title?: string;
    description?: string;
    onRetry?: () => void;
    className?: string;
}

export function EmptyState({ title = "No records found", description = "There are no users matching your filters.", onRetry, className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>
            {onRetry && (
                <Button variant="outline" onClick={onRetry} className="font-medium">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear Filters
                </Button>
            )}
        </div>
    );
}

interface ErrorStateProps {
    error?: string;
    onRetry?: () => void;
    className?: string;
}

export function ErrorState({ error = "Failed to load calendar data", onRetry, className }: ErrorStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Something went wrong</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-4">{error}</p>
            {onRetry && (
                <Button onClick={onRetry} className="font-medium">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                </Button>
            )}
        </div>
    );
}
