"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, RefreshCw, Check, CalendarDays } from "lucide-react";
import { toast } from "sonner";

interface CalendarIntegrationProps {
    initialToken: string;
}

export function CalendarIntegration({ initialToken }: CalendarIntegrationProps) {
    const [token, setToken] = useState(initialToken);
    const [regenerating, setRegenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    const getFeedUrl = () => {
        if (typeof window === "undefined") return "";
        return `${window.location.origin}/api/calendar/ical/${token}`;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(getFeedUrl());
        setCopied(true);
        toast.success("Calendar feed URL copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRegenerate = async () => {
        if (!confirm("Regenerating the token will invalidate your current calendar feed URL. Are you sure?")) {
            return;
        }

        setRegenerating(true);
        try {
            const res = await fetch('/api/users/me/ical-token', { method: 'POST' });
            if (res.ok) {
                const json = await res.json();
                setToken(json.data.token);
                toast.success("Calendar token regenerated successfully");
            } else {
                toast.error("Failed to regenerate calendar token");
            }
        } catch (error) {
            console.error("Error regenerating token:", error);
            toast.error("An error occurred while regenerating the token");
        } finally {
            setRegenerating(false);
        }
    };

    return (
        <Card className="border-slate-200">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <CalendarDays className="size-5 text-blue-600" />
                    </div>
                    <div>
                        <CardTitle className="text-xl">Calendar Integration</CardTitle>
                        <CardDescription>
                            Sync your absences with external calendars (Google, Outlook, Apple).
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider">iCal Feed URL</label>
                    <div className="flex gap-2">
                        <Input
                            readOnly
                            value={getFeedUrl()}
                            className="bg-slate-50 border-slate-200 font-mono text-xs h-10"
                        />
                        <Button variant="outline" size="icon" onClick={handleCopy} className="size-10 shrink-0">
                            {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                        </Button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium italic">
                        Treat this URL like a password. Anyone with this link can see your approved absences.
                    </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRegenerate}
                        disabled={regenerating}
                        className="text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                    >
                        <RefreshCw className={cn("size-3 mr-2", regenerating && "animate-spin")} />
                        Reset Integration Token
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
