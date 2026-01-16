"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { ScheduleEditor, ScheduleData } from "@/components/schedule-editor"

export function CompanyScheduleForm() {
    const [isLoading, setIsLoading] = useState(true)
    const [schedule, setSchedule] = useState<ScheduleData>({
        monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 2, sunday: 2
    })

    useEffect(() => {
        async function loadSchedule() {
            try {
                const res = await fetch('/api/schedule/company');
                if (res.ok) {
                    const result = await res.json();
                    if (result.success && result.data) {
                        setSchedule({
                            monday: result.data.monday,
                            tuesday: result.data.tuesday,
                            wednesday: result.data.wednesday,
                            thursday: result.data.thursday,
                            friday: result.data.friday,
                            saturday: result.data.saturday,
                            sunday: result.data.sunday
                        });
                    }
                }
            } catch (e) {
                console.error('Failed to load schedule', e);
            } finally {
                setIsLoading(false);
            }
        }
        loadSchedule();
    }, []);

    async function onSave() {
        try {
            const res = await fetch('/api/schedule/company', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(schedule)
            });

            if (!res.ok) throw new Error('Failed to update');

            toast({
                title: "Schedule updated",
                description: "Company default schedule saved.",
            })
        } catch (e) {
            toast({
                title: "Error",
                description: "Failed to update schedule.",
                variant: "destructive"
            })
        }
    }

    if (isLoading) return <div>Loading...</div>

    return (
        <div className="space-y-6">
            <ScheduleEditor schedule={schedule} onChange={setSchedule} />
            <Button onClick={onSave}>Save Schedule</Button>
        </div>
    )
}
