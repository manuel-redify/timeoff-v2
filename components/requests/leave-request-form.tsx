"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, isSameDay } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toastError } from "@/lib/toast-helper";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { EmployeeCombobox } from "@/components/requests/employee-combobox";
import { getUserLeaveContext } from "@/lib/actions/user";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";
import { calculateDuration, formatDuration } from "@/lib/time-utils";

// Enums matching Prisma schema/API
enum DayPart {
    ALL = "ALL",
    MORNING = "MORNING",
    AFTERNOON = "AFTERNOON",
    CUSTOM = "CUSTOM",
}

const formSchema = z.object({
    userId: z.string().optional(),
    ignoreAllowance: z.boolean().optional(),
    status: z.enum(["NEW", "APPROVED", "REJECTED"]).optional(),
    leaveTypeId: z.string().min(1, "Leave type is required"),
    dateStart: z.date({
        message: "Start date is required",
    }),
    dayPartStart: z.nativeEnum(DayPart),
    startTime: z.object({
        hours: z.number(),
        minutes: z.number(),
    }).optional(),
    dateEnd: z.date({
        message: "End date is required",
    }),
    dayPartEnd: z.nativeEnum(DayPart),
    endTime: z.object({
        hours: z.number(),
        minutes: z.number(),
    }).optional(),
    employeeComment: z.string().max(255, "Comment must be 255 characters or less").optional(),
}).refine((data) => {
    if (data.dateEnd < data.dateStart) {
        return false;
    }
    return true;
}, {
    message: "End date cannot be before start date",
    path: ["dateEnd"],
}).refine((data) => {
    if (data.dayPartStart === DayPart.CUSTOM && data.dayPartEnd === DayPart.CUSTOM) {
        if (!data.startTime || !data.endTime) return false;
        const startMinutes = data.startTime.hours * 60 + data.startTime.minutes;
        const endMinutes = data.endTime.hours * 60 + data.endTime.minutes;
        return endMinutes > startMinutes;
    }
    return true;
}, {
    message: "End time must be after start time",
    path: ["endTime"],
});

interface LeaveType {
    id: string;
    name: string;
    useAllowance: boolean;
    limit: number | null;
}

interface LeaveRequestFormProps {
    leaveTypes: LeaveType[];
    userId: string;
    isAdmin?: boolean;
    onSuccess?: () => void;
    minutesPerDay?: number;
}

export function LeaveRequestForm({ leaveTypes, userId, isAdmin, onSuccess, minutesPerDay = 480 }: LeaveRequestFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [calculatedDays, setCalculatedDays] = useState<number | null>(null);
    const [isCustomRange, setIsCustomRange] = useState(false);
    const [isLoadingContext, setIsLoadingContext] = useState(false);
    const [availableAllowance, setAvailableAllowance] = useState<number | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            dayPartStart: DayPart.ALL,
            dayPartEnd: DayPart.ALL,
            ignoreAllowance: false,
            status: "APPROVED",
        },
    });

    const watchDateStart = form.watch("dateStart");
    const watchDateEnd = form.watch("dateEnd");
    const watchDayPartStart = form.watch("dayPartStart");
    const watchStartTime = form.watch("startTime");
    const watchEndTime = form.watch("endTime");
    const watchEmployeeComment = form.watch("employeeComment");
    const watchUserId = form.watch("userId");
    const watchLeaveTypeId = form.watch("leaveTypeId");
    const isSingleDay = watchDateStart && watchDateEnd && isSameDay(watchDateStart, watchDateEnd);
    const targetUserId = watchUserId || userId;

    const selectedLeaveType = leaveTypes.find(t => t.id === watchLeaveTypeId);

    const customDurationMinutes = isCustomRange && watchStartTime && watchEndTime
        ? calculateDuration(watchStartTime, watchEndTime)
        : null;

    const commentLength = watchEmployeeComment?.length ?? 0;
    const maxCommentLength = 255;

    // Reset end date if start date changes to be after it (UX convenience)
    useEffect(() => {
        if (watchDateStart && watchDateEnd && watchDateStart > watchDateEnd) {
            form.setValue("dateEnd", watchDateStart);
        }
    }, [watchDateStart, watchDateEnd, form]);

    // Reset to All Day when switching from single to multi-day
    useEffect(() => {
        if (watchDateStart && watchDateEnd && !isSameDay(watchDateStart, watchDateEnd)) {
            if (watchDayPartStart !== DayPart.ALL) {
                form.setValue("dayPartStart", DayPart.ALL);
                form.setValue("dayPartEnd", DayPart.ALL);
                setIsCustomRange(false);
            }
        }
    }, [watchDateStart, watchDateEnd, watchDayPartStart, form]);

    useEffect(() => {
        let isMounted = true;
        async function fetchContext() {
            setIsLoadingContext(true);
            const res = await getUserLeaveContext(targetUserId);
            if (isMounted) {
                if (res.success && res.data) {
                    setAvailableAllowance(res.data.allowance.availableAllowance);
                } else {
                    setAvailableAllowance(null);
                }
                setIsLoadingContext(false);
            }
        }
        fetchContext();
        return () => { isMounted = false; };
    }, [targetUserId]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);

        // Show immediate feedback that request is being processed
        toast.success("Submitting your leave request...");

        try {
            const formattedValues = {
                ...values,
                userId: values.userId || userId,
                dateStart: format(values.dateStart, "yyyy-MM-dd"),
                dateEnd: format(values.dateEnd, "yyyy-MM-dd"),
            };

            const response = await fetch("/api/leave-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formattedValues),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details?.join(", ") || data.error || "Failed to submit request");
            }

            toast.success(data.message);
            form.reset({
                dayPartStart: DayPart.ALL,
                dayPartEnd: DayPart.ALL,
                ignoreAllowance: false,
                status: "APPROVED",
            });
            setCalculatedDays(null);

            // If onSuccess callback provided, call it; otherwise navigate to my requests page
            if (onSuccess) {
                onSuccess();
            } else {
                router.push("/requests/my");
            }
        } catch (error: any) {
            toastError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                <FormField
                    control={form.control}
                    name="leaveTypeId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Leave Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a leave type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {leaveTypes.map((type) => (
                                        <SelectItem key={type.id} value={type.id}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {selectedLeaveType?.useAllowance && (
                    <div className="rounded-md border p-4 bg-muted/50">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Available Allowance</span>
                            {isLoadingContext ? (
                                <Skeleton className="h-5 w-16" />
                            ) : (
                                <span className={cn(
                                    "font-bold",
                                    availableAllowance !== null && availableAllowance < 0 ? "text-destructive" : "text-primary"
                                )}>
                                    {availableAllowance !== null ? `${availableAllowance} days` : '--'}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {isAdmin && selectedLeaveType?.useAllowance && (
                    <FormField
                        control={form.control}
                        name="ignoreAllowance"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border rounded-md">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        Create even if balance is exceeded
                                    </FormLabel>
                                    <FormDescription>
                                        Bypass allowance validation checks.
                                    </FormDescription>
                                </div>
                            </FormItem>
                        )}
                    />
                )}

                {isAdmin && (
                    <FormField
                        control={form.control}
                        name="userId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Employee</FormLabel>
                                <EmployeeCombobox 
                                    value={field.value} 
                                    onChange={(val) => {
                                        field.onChange(val);
                                    }} 
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {isAdmin && (
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="APPROVED">Approved (Default)</SelectItem>
                                        <SelectItem value="NEW">Pending</SelectItem>
                                        <SelectItem value="REJECTED">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Start Date */}
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="dateStart"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>From</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date < new Date("1900-01-01") // Prevent way past dates
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="dayPartStart"
                            render={({ field }) => (
                                <FormItem className="space-y-3 flex flex-col">
                                    <FormLabel>When?</FormLabel>
                                    <FormControl>
                                        <ToggleGroup
                                            type="single"
                                            value={String(field.value)}
                                            onValueChange={(val) => {
                                                if (!val) return; // Prevent deselection
                                                const isCustom = val === DayPart.CUSTOM;
                                                setIsCustomRange(isCustom);
                                                field.onChange(val);
                                                form.setValue("dayPartEnd", val as DayPart);
                                                if (!isCustom) {
                                                    form.setValue("startTime", undefined);
                                                    form.setValue("endTime", undefined);
                                                }
                                            }}
                                            className="flex gap-1 w-full"
                                        >
                                            <ToggleGroupItem
                                                value={String(DayPart.ALL)}
                                                className="flex-1 h-9 text-xs"
                                            >
                                                All Day
                                            </ToggleGroupItem>
                                            <ToggleGroupItem
                                                value={String(DayPart.MORNING)}
                                                className="flex-1 h-9 text-xs"
                                                disabled={!isSingleDay}
                                            >
                                                Morning
                                            </ToggleGroupItem>
                                            <ToggleGroupItem
                                                value={String(DayPart.AFTERNOON)}
                                                className="flex-1 h-9 text-xs"
                                                disabled={!isSingleDay}
                                            >
                                                Afternoon
                                            </ToggleGroupItem>
                                            <ToggleGroupItem
                                                value={String(DayPart.CUSTOM)}
                                                className="flex-1 h-9 text-xs"
                                                disabled={!isSingleDay}
                                            >
                                                Custom
                                            </ToggleGroupItem>
                                        </ToggleGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {isCustomRange && (
                            <div className="flex gap-3 pt-2 items-end">
                                <FormField
                                    control={form.control}
                                    name="startTime"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormLabel className="text-xs">Start</FormLabel>
                                            <FormControl>
                                                <TimePicker
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="endTime"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormLabel className="text-xs">End</FormLabel>
                                            <FormControl>
                                                <TimePicker
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {customDurationMinutes !== null && customDurationMinutes > 0 && (
                                    <div className="text-xs text-muted-foreground pb-2 min-w-[80px] flex-shrink-0">
                                        {formatDuration(customDurationMinutes)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* End Date */}
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="dateEnd"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>To</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    watchDateStart ? date < watchDateStart : false
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="employeeComment"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Comment (Optional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Reason for leave request..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <div className="flex justify-between items-center">
                                <FormDescription>
                                    You can mention any specific details here.
                                </FormDescription>
                                <span className={cn(
                                    "text-xs",
                                    commentLength > maxCommentLength ? "text-destructive" : "text-muted-foreground"
                                )}>
                                    {commentLength}/{maxCommentLength}
                                </span>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Request
                </Button>
            </form>
        </Form>
    );
}