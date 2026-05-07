"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import * as z from "zod"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { parseTimeString, formatDuration } from "@/lib/time-utils"

function minutesToTimeString(totalMinutes: number) {
    const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0")
    const minutes = (totalMinutes % 60).toString().padStart(2, "0")
    return `${hours}:${minutes}`
}

function timeStringToMinutes(value: string) {
    const parsed = parseTimeString(value)
    return parsed ? (parsed.hours * 60) + parsed.minutes : null
}

const companyFormSchema = z.object({
    name: z.string().min(2, {
        message: "Company name must be at least 2 characters.",
    }),
    country: z.string().length(2).optional(),
    timezone: z.string().min(1),
    dateFormat: z.string().min(1),
    startOfNewYear: z.coerce.number().min(1).max(12),
    shareAllAbsences: z.boolean().default(false),
    isTeamViewHidden: z.boolean().default(false),
    carryOver: z.coerce.number().min(0).default(0),
    mode: z.coerce.number().int().default(1),
    isUnlimitedAllowance: z.boolean().default(false),
    allowNegativeAllowance: z.boolean().default(false),
    defaultAllowance: z.coerce.number().min(0).default(20),
    workdayStart: z.string().min(1, "Workday start is required"),
    morningEnd: z.string().min(1, "Morning end is required"),
    afternoonStart: z.string().min(1, "Afternoon start is required"),
    workdayEnd: z.string().min(1, "Workday end is required"),
}).superRefine((data, ctx) => {
    const workdayStart = timeStringToMinutes(data.workdayStart)
    const morningEnd = timeStringToMinutes(data.morningEnd)
    const afternoonStart = timeStringToMinutes(data.afternoonStart)
    const workdayEnd = timeStringToMinutes(data.workdayEnd)

    if (
        workdayStart === null ||
        morningEnd === null ||
        afternoonStart === null ||
        workdayEnd === null
    ) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["workdayStart"],
            message: "Use valid times in HH:MM format.",
        })
        return
    }

    if (workdayStart >= morningEnd) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["morningEnd"],
            message: "Morning must end after the workday starts.",
        })
    }

    if (morningEnd > afternoonStart) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["afternoonStart"],
            message: "Afternoon must start at or after morning end.",
        })
    }

    if (afternoonStart >= workdayEnd) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["workdayEnd"],
            message: "Workday must end after the afternoon starts.",
        })
    }
})

type CompanyFormValues = z.infer<typeof companyFormSchema>

export function CompanySettingsForm() {
    const [isLoading, setIsLoading] = useState(true)
    const form = useForm<CompanyFormValues>({
        resolver: zodResolver(companyFormSchema) as any,
        defaultValues: {
            name: "",
            timezone: "Europe/London",
            dateFormat: "YYYY-MM-DD",
            startOfNewYear: 1,
            shareAllAbsences: false,
            isTeamViewHidden: false,
            carryOver: 0,
            country: "",
            isUnlimitedAllowance: false,
            allowNegativeAllowance: false,
            defaultAllowance: 20,
            workdayStart: "09:00",
            morningEnd: "13:00",
            afternoonStart: "14:00",
            workdayEnd: "18:00",
        },
    })

    const [isUnlimitedAllowance, workdayStart, morningEnd, afternoonStart, workdayEnd] = useWatch({
        control: form.control,
        name: ['isUnlimitedAllowance', 'workdayStart', 'morningEnd', 'afternoonStart', 'workdayEnd']
    })

    const workdayStartMinutes = timeStringToMinutes(workdayStart ?? "")
    const morningEndMinutes = timeStringToMinutes(morningEnd ?? "")
    const afternoonStartMinutes = timeStringToMinutes(afternoonStart ?? "")
    const workdayEndMinutes = timeStringToMinutes(workdayEnd ?? "")
    const morningMinutes =
        workdayStartMinutes !== null && morningEndMinutes !== null
            ? Math.max(morningEndMinutes - workdayStartMinutes, 0)
            : 0
    const afternoonMinutes =
        afternoonStartMinutes !== null && workdayEndMinutes !== null
            ? Math.max(workdayEndMinutes - afternoonStartMinutes, 0)
            : 0
    const lunchBreakMinutes =
        morningEndMinutes !== null && afternoonStartMinutes !== null
            ? Math.max(afternoonStartMinutes - morningEndMinutes, 0)
            : 0
    const paidMinutesPerDay = morningMinutes + afternoonMinutes

    useEffect(() => {
        async function loadData() {
            try {
                const res = await fetch('/api/company');
                if (res.ok) {
                    const result = await res.json();
                    if (result.success && result.data) {
                        form.reset({
                            name: result.data.name,
                            country: result.data.country || "",
                            timezone: result.data.timezone,
                            dateFormat: result.data.dateFormat,
                            startOfNewYear: result.data.startOfNewYear,
                            shareAllAbsences: result.data.shareAllAbsences,
                            isTeamViewHidden: result.data.isTeamViewHidden,
                            carryOver: result.data.carryOver,
                            isUnlimitedAllowance: result.data.isUnlimitedAllowance || false,
                            allowNegativeAllowance: result.data.allowNegativeAllowance ?? false,
                            defaultAllowance: result.data.defaultAllowance ? Number(result.data.defaultAllowance) : 20,
                            workdayStart: minutesToTimeString(result.data.workdayStartMinutes ?? 540),
                            morningEnd: minutesToTimeString(result.data.morningEndMinutes ?? 780),
                            afternoonStart: minutesToTimeString(result.data.afternoonStartMinutes ?? 840),
                            workdayEnd: minutesToTimeString(result.data.workdayEndMinutes ?? 1080),
                        });
                    }
                }
            } catch (e) {
                console.error('Failed to load company settings', e);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [form]);

    async function onSubmit(data: CompanyFormValues) {
        try {
            const nextWorkdayStartMinutes = timeStringToMinutes(data.workdayStart)
            const nextMorningEndMinutes = timeStringToMinutes(data.morningEnd)
            const nextAfternoonStartMinutes = timeStringToMinutes(data.afternoonStart)
            const nextWorkdayEndMinutes = timeStringToMinutes(data.workdayEnd)

            if (
                nextWorkdayStartMinutes === null ||
                nextMorningEndMinutes === null ||
                nextAfternoonStartMinutes === null ||
                nextWorkdayEndMinutes === null
            ) {
                throw new Error("Invalid company workday settings.")
            }

            const nextMinutesPerDay =
                (nextMorningEndMinutes - nextWorkdayStartMinutes) +
                (nextWorkdayEndMinutes - nextAfternoonStartMinutes)

            const res = await fetch('/api/company', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    minutesPerDay: nextMinutesPerDay,
                    workdayStartMinutes: nextWorkdayStartMinutes,
                    morningEndMinutes: nextMorningEndMinutes,
                    afternoonStartMinutes: nextAfternoonStartMinutes,
                    workdayEndMinutes: nextWorkdayEndMinutes,
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error?.message || 'Failed to update');
            }

            toast({
                title: "Settings updated",
                description: "Your company settings have been saved.",
            })
        } catch (e: any) {
            console.error(e);
            toast({
                title: "Error",
                description: e.message || "Failed to update settings.",
                variant: "destructive"
            })
        }
    }

    if (isLoading) return <div>Loading...</div>

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Acme Inc." {...field} />
                            </FormControl>
                            <FormDescription>
                                This is the name that will be displayed on your profile and in emails.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Country (ISO Code)</FormLabel>
                                <FormControl>
                                    <Input placeholder="UK" maxLength={2} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="timezone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Timezone</FormLabel>
                                <FormControl>
                                    <Input placeholder="Europe/London" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="dateFormat"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Date Format</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a format" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="startOfNewYear"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Start of New Year (Month)</FormLabel>
                                <FormControl>
                                    <Input type="number" min={1} max={12} {...field} />
                                </FormControl>
                                <FormDescription>1 = January, 12 = December</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Separator />

                <FormField
                    control={form.control}
                    name="shareAllAbsences"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Share All Absences</FormLabel>
                                <FormDescription>
                                    Allow all employees to see each other's absences.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="isTeamViewHidden"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Hide Team View</FormLabel>
                                <FormDescription>
                                    Hide the team view calendar from employees.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="allowNegativeAllowance"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Allow Excess Requests</FormLabel>
                                <FormDescription>
                                    Allow users to submit requests that exceed their available allowance (will result in negative balance).
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <Separator />

                <div className="space-y-4 rounded-lg border p-4">
                    <div className="space-y-1">
                        <h3 className="text-base font-semibold">Workday Segments</h3>
                        <p className="text-sm text-muted-foreground">
                            These times drive morning and afternoon leave requests, wallchart rendering, and calendar exports.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="workdayStart"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Workday starts</FormLabel>
                                    <FormControl>
                                        <Input type="time" step={900} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="morningEnd"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Morning ends</FormLabel>
                                    <FormControl>
                                        <Input type="time" step={900} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="afternoonStart"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Afternoon starts</FormLabel>
                                    <FormControl>
                                        <Input type="time" step={900} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="workdayEnd"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Workday ends</FormLabel>
                                    <FormControl>
                                        <Input type="time" step={900} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="rounded-md border bg-slate-50 px-3 py-2">
                            <div className="text-xs font-medium text-slate-500">Morning leave</div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                                {workdayStart} - {morningEnd}
                            </div>
                            <div className="text-xs text-slate-500">{formatDuration(morningMinutes)}</div>
                        </div>
                        <div className="rounded-md border bg-slate-50 px-3 py-2">
                            <div className="text-xs font-medium text-slate-500">Lunch break</div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                                {morningEnd} - {afternoonStart}
                            </div>
                            <div className="text-xs text-slate-500">{formatDuration(lunchBreakMinutes)}</div>
                        </div>
                        <div className="rounded-md border bg-slate-50 px-3 py-2">
                            <div className="text-xs font-medium text-slate-500">Afternoon leave</div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                                {afternoonStart} - {workdayEnd}
                            </div>
                            <div className="text-xs text-slate-500">{formatDuration(afternoonMinutes)}</div>
                        </div>
                    </div>

                    <div className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                        Paid working time per day: <span className="font-semibold text-foreground">{formatDuration(paidMinutesPerDay)}</span>
                    </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="defaultAllowance"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Default Allowance (days)</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        min={0} 
                                        {...field} 
                                        disabled={isUnlimitedAllowance}
                                    />
                                </FormControl>
                                <FormDescription>
                                    {isUnlimitedAllowance ? "Disabled when unlimited" : "Default days per year"}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="isUnlimitedAllowance"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Unlimited Allowance</FormLabel>
                                <FormDescription>
                                    No limit on leave days for this company.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <Button type="submit">Update settings</Button>
            </form>
        </Form>
    )
}
