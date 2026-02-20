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
    defaultAllowance: z.coerce.number().min(0).default(20),
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
            defaultAllowance: 20,
        },
    })

    const [isUnlimitedAllowance, defaultAllowance] = useWatch({
        control: form.control,
        name: ['isUnlimitedAllowance', 'defaultAllowance']
    })

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
                            defaultAllowance: result.data.defaultAllowance ? Number(result.data.defaultAllowance) : 20,
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
            const res = await fetch('/api/company', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
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
