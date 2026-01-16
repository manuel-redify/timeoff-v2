"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { ScheduleEditor, ScheduleData } from "@/components/schedule-editor"
import { Separator } from "@/components/ui/separator"

interface UserScheduleFormProps {
    userId: string
}

export function UserScheduleForm({ userId }: UserScheduleFormProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [schedule, setSchedule] = useState<ScheduleData | null>(null)
    const [isDefault, setIsDefault] = useState(true)

    useEffect(() => {
        async function loadSchedule() {
            try {
                // Fetch user specific schedule
                const res = await fetch(`/api/schedule/user/${userId}`);
                if (res.ok) {
                    const result = await res.json();
                    if (result.success) {
                        if (result.data) {
                            setSchedule({
                                monday: result.data.monday,
                                tuesday: result.data.tuesday,
                                wednesday: result.data.wednesday,
                                thursday: result.data.thursday,
                                friday: result.data.friday,
                                saturday: result.data.saturday,
                                sunday: result.data.sunday
                            });
                            setIsDefault(false);
                            return;
                        }
                    }
                }
                // If no user schedule or error, fetch company default to show?
                // Or just show empty/default?
                // Let's explicitly fetch company default to display "Default" state
                // But the editor needs values.
                // We'll init with standard values if null.
                setSchedule({
                    monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 2, sunday: 2
                });
                setIsDefault(true);

            } catch (e) {
                console.error('Failed to load schedule', e);
            } finally {
                setIsLoading(false);
            }
        }
        loadSchedule();
    }, [userId]);

    async function onSave() {
        if (!schedule) return;
        try {
            const res = await fetch(`/api/schedule/user/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(schedule)
            });

            if (!res.ok) throw new Error('Failed to update');

            toast({
                title: "Schedule updated",
                description: "User schedule saved.",
            })
            setIsDefault(false);
        } catch (e) {
            toast({
                title: "Error",
                description: "Failed to update schedule.",
                variant: "destructive"
            })
        }
    }

    async function onReset() {
        if (!confirm("Reset to company default?")) return;
        try {
            const res = await fetch(`/api/schedule/user/${userId}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to reset');

            toast({ title: "Schedule reset to default" });
            setIsDefault(true);
            // Reload to get defaults? Or just manual reset?
            // Ideally we reload.
            window.location.reload();
        } catch (e) {
            toast({ title: "Error", variant: "destructive" })
        }
    }

    if (isLoading) return <div>Loading...</div>
    if (!schedule) return <div>Error loading schedule</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Working Schedule</h3>
                    <p className="text-sm text-muted-foreground">
                        {isDefault ? "Using Company Default" : "Custom User Schedule"}
                    </p>
                </div>
                {!isDefault && (
                    <Button variant="outline" onClick={onReset}>Reset to Default</Button>
                )}
            </div>
            <Separator />
            <ScheduleEditor schedule={schedule} onChange={setSchedule} />
            <Button onClick={onSave} disabled={isDefault && false}>Save Override</Button>
        </div>
    )
}
