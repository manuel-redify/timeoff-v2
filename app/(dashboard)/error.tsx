"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Dashboard error:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50">
                <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-neutral-900">Something went wrong</h2>
                <p className="text-sm text-neutral-500 max-w-md">
                    {error.message || "An error occurred while loading the dashboard. Please try again."}
                </p>
            </div>
            <Button
                onClick={reset}
                variant="outline"
                className="gap-2"
            >
                <RefreshCw className="h-4 w-4" />
                Try again
            </Button>
        </div>
    );
}
