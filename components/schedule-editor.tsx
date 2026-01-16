"use client"

import * as React from "react"
import { Check, Info } from "lucide-react"

import { cn } from "@/lib/utils"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export interface ScheduleData {
    monday: number
    tuesday: number
    wednesday: number
    thursday: number
    friday: number
    saturday: number
    sunday: number
}

interface ScheduleEditorProps {
    schedule: ScheduleData
    onChange: (newSchedule: ScheduleData) => void
    readOnly?: boolean
}

const DAYS = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
] as const

export function ScheduleEditor({ schedule, onChange, readOnly = false }: ScheduleEditorProps) {

    const updateDay = (dayKey: keyof ScheduleData, value: number) => {
        onChange({
            ...schedule,
            [dayKey]: value
        })
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[150px]">Day</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {DAYS.map((day) => (
                        <TableRow key={day.key}>
                            <TableCell className="font-medium capitalize">{day.label}</TableCell>
                            <TableCell>
                                <Select
                                    disabled={readOnly}
                                    value={schedule[day.key].toString()}
                                    onValueChange={(val) => updateDay(day.key, parseInt(val))}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Working Day</SelectItem>
                                        <SelectItem value="2">Non-working Day</SelectItem>
                                        <SelectItem value="3">Morning Only</SelectItem>
                                        <SelectItem value="4">Afternoon Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
