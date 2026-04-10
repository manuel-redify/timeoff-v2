"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, isSameDay } from "date-fns";
import { AlertCircle, CalendarIcon, Loader2 } from "lucide-react";
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

const PERIOD_PRESETS = [
    {
        value: DayPart.ALL,
        label: "All Day",
        timeRange: "09:00-18:00",
    },
    {
        value: DayPart.MORNING,
        label: "Morning",
        timeRange: "09:00-13:00",
    },
    {
        value: DayPart.AFTERNOON,
        label: "Afternoon",
        timeRange: "14:00-18:00",
    },
    {
        value: DayPart.CUSTOM,
        label: "Custom Range",
        timeRange: "Choose times",
    },
] as const;

const formSchema = z.object({
    userId: z.string().optional(),
    forceCreate: z.boolean().optional(),
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
    isMobileLayout?: boolean;
}

function formatApproxDays(minutes: number, minutesPerDay: number): string {
    if (minutesPerDay <= 0) {
        return "0";
    }

    const days = minutes / minutesPerDay;
    return Number(days.toFixed(2)).toString();
}

export function LeaveRequestForm({ leaveTypes, userId, isAdmin, onSuccess, isMobileLayout = false }: LeaveRequestFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCustomRange, setIsCustomRange] = useState(false);
    const [isLoadingContext, setIsLoadingContext] = useState(false);
    const [contextError, setContextError] = useState<string | null>(null);
    const [allowNegativeAllowance, setAllowNegativeAllowance] = useState<boolean>(false);
    const [availableAllowance, setAvailableAllowance] = useState<number | null>(null);
    const [minutesPerDay, setMinutesPerDay] = useState(480);
    const [contextLeaveTypes, setContextLeaveTypes] = useState<LeaveType[] | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            userId,
            dayPartStart: DayPart.ALL,
            dayPartEnd: DayPart.ALL,
            forceCreate: false,
            status: isAdmin ? "NEW" : undefined,
        },
    });

    const statusTouchedRef = useRef(false);

    const watchDateStart = form.watch("dateStart");
    const watchDateEnd = form.watch("dateEnd");
    const watchDayPartStart = form.watch("dayPartStart");
    const watchStartTime = form.watch("startTime");
    const watchEndTime = form.watch("endTime");
    const watchEmployeeComment = form.watch("employeeComment");
    const watchUserId = form.watch("userId");
    const watchLeaveTypeId = form.watch("leaveTypeId");
    const watchStatus = form.watch("status");
    const isSingleDay = watchDateStart && watchDateEnd && isSameDay(watchDateStart, watchDateEnd);
    const targetUserId = watchUserId || userId;

    const effectiveLeaveTypes = contextLeaveTypes ?? leaveTypes;
    const selectedLeaveType = effectiveLeaveTypes.find(t => t.id === watchLeaveTypeId);

     // Calculate duration for all selections
     let durationMinutes = 0;
     let durationText = null;
     
     if (isCustomRange && watchStartTime && watchEndTime) {
         // Custom range calculation
         durationMinutes = calculateDuration(watchStartTime, watchEndTime);
         const isValidRange = durationMinutes > 0;
         durationText = isValidRange 
             ? `Duration: ${formatDuration(durationMinutes)} (~${formatApproxDays(durationMinutes, minutesPerDay)} days)`
             : null;
     } else if (watchDateStart && watchDateEnd) {
         // For predefined ranges (ALL, MORNING, AFTERNOON), calculate based on day parts
         const startDate = watchDateStart;
         const endDate = watchDateEnd;
         const dayPartStart = watchDayPartStart;
         
         // Calculate minutes for single day
         if (isSameDay(startDate, endDate)) {
             switch (dayPartStart) {
                 case DayPart.ALL:
                     durationMinutes = minutesPerDay;
                     break;
                 case DayPart.MORNING:
                 case DayPart.AFTERNOON:
                     durationMinutes = minutesPerDay / 2;
                     break;
                 case DayPart.CUSTOM:
                     // For custom range on single day, use time picker values
                     if (watchStartTime && watchEndTime) {
                         durationMinutes = calculateDuration(watchStartTime, watchEndTime);
                     } else {
                         durationMinutes = minutesPerDay; // fallback
                     }
                     break;
             }
         } else {
             // Multi-day calculation
             // Simplified: assume each day is full day for now
             // A more sophisticated version would use the leave calculation service
             const daysDiff = Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
             durationMinutes = (daysDiff + 1) * minutesPerDay; // +1 to include both start and end dates
         }
         
         durationText = `Duration: ${formatDuration(durationMinutes)} (~${formatApproxDays(durationMinutes, minutesPerDay)} days)`;
     }

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
                form.setValue("startTime", undefined);
                form.setValue("endTime", undefined);
                setIsCustomRange(false);
                toast.info("Partial day options reset for multi-day requests");
            }
        }
    }, [watchDateStart, watchDateEnd, watchDayPartStart, form]);

    useEffect(() => {
        let isMounted = true;
        async function fetchContext() {
            setIsLoadingContext(true);
            setContextError(null);
            const res = await getUserLeaveContext(targetUserId);
            if (isMounted) {
                if (res.success && res.data) {
                    setAvailableAllowance(res.data.allowance.availableAllowance);
                    setMinutesPerDay(res.data.minutesPerDay ?? 480);
                    setContextLeaveTypes(res.data.leaveTypes ?? leaveTypes);
                    // Extract allowNegativeAllowance from company data
                    setAllowNegativeAllowance(res.data.companyAllowNegativeAllowance ?? false);
                } else {
                    setAvailableAllowance(null);
                    setMinutesPerDay(480);
                    setContextLeaveTypes(leaveTypes);
                    setAllowNegativeAllowance(false);
                    setContextError(res.error || "Failed to load employee context.");
                }
                setIsLoadingContext(false);
            }
        }
        fetchContext();
        return () => { isMounted = false; };
    }, [targetUserId, leaveTypes]);

    useEffect(() => {
        if (!watchLeaveTypeId) {
            if (effectiveLeaveTypes.length === 1) {
                form.setValue("leaveTypeId", effectiveLeaveTypes[0].id, { shouldValidate: true });
            }
            return;
        }

        const leaveTypeStillValid = effectiveLeaveTypes.some((type) => type.id === watchLeaveTypeId);
        if (!leaveTypeStillValid) {
            form.setValue("leaveTypeId", effectiveLeaveTypes.length === 1 ? effectiveLeaveTypes[0].id : "", {
                shouldValidate: true,
            });
        }
    }, [effectiveLeaveTypes, form, watchLeaveTypeId]);

    useEffect(() => {
        if (!isCustomRange) {
            form.clearErrors("endTime");
            return;
        }

        if (!watchStartTime || !watchEndTime) {
            form.clearErrors("endTime");
            return;
        }

    if (calculateDuration(watchStartTime, watchEndTime) <= 0) {
        form.setError("startTime", {
            type: "validate",
            message: "End time must be after start time",
        });
        form.setError("endTime", {
            type: "validate",
            message: "End time must be after start time",
        });
        return;
    }

        form.clearErrors("endTime");
    }, [form, isCustomRange, watchEndTime, watchStartTime]);

    // Automatically set forceCreate based on company settings when relevant values change
    useEffect(() => {
        // Only apply for admins and when leave type uses allowance
        if (!isAdmin || !selectedLeaveType?.useAllowance) {
            return;
        }

        // Check if we have the necessary data
        if (availableAllowance === null || !effectiveLeaveTypes) {
            return;
        }

        // Calculate requested duration
        let requestedDays = 0;
        if (isCustomRange && watchStartTime && watchEndTime) {
            // For custom range, we need to calculate based on minutes
            const durationMinutes = calculateDuration(watchStartTime, watchEndTime);
            requestedDays = durationMinutes / (minutesPerDay > 0 ? minutesPerDay : 480);
        } else if (watchDateStart && watchDateEnd) {
            // For predefined ranges
            const startDate = watchDateStart;
            const endDate = watchDateEnd;
            
            // Calculate minutes for single day
            if (isSameDay(startDate, endDate)) {
                switch (watchDayPartStart) {
                    case DayPart.ALL:
                        requestedDays = 1;
                        break;
                    case DayPart.MORNING:
                    case DayPart.AFTERNOON:
                        requestedDays = 0.5;
                        break;
                    case DayPart.CUSTOM:
                        if (watchStartTime && watchEndTime) {
                            const durationMinutes = calculateDuration(watchStartTime, watchEndTime);
                            requestedDays = durationMinutes / (minutesPerDay > 0 ? minutesPerDay : 480);
                        } else {
                            requestedDays = 1; // fallback
                        }
                        break;
                }
            } else {
                // Multi-day calculation
                const daysDiff = Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
                requestedDays = daysDiff + 1; // +1 to include both start and end dates
            }
        }

        // Set forceCreate if requested days exceed available allowance and company allows negative allowance
        if (requestedDays > 0 && availableAllowance < requestedDays && allowNegativeAllowance) {
            form.setValue("forceCreate", true);
        } else {
            form.setValue("forceCreate", false);
        }
    }, [isAdmin, selectedLeaveType?.useAllowance, availableAllowance, allowNegativeAllowance, 
        isCustomRange, watchStartTime, watchEndTime, watchDateStart, watchDateEnd, 
        watchDayPartStart, minutesPerDay, effectiveLeaveTypes, form]);

    useEffect(() => {
        if (!isAdmin || statusTouchedRef.current) {
            return;
        }

        const nextStatus = targetUserId !== userId ? "APPROVED" : "NEW";
        if (watchStatus !== nextStatus) {
            form.setValue("status", nextStatus, { shouldValidate: true });
        }
    }, [form, isAdmin, targetUserId, userId, watchStatus]);

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
                status: values.status?.toLowerCase(),
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
            statusTouchedRef.current = false;
            form.reset({
                userId,
                dayPartStart: DayPart.ALL,
                dayPartEnd: DayPart.ALL,
                forceCreate: false,
                status: isAdmin ? "NEW" : undefined,
            });

            // If onSuccess callback provided, call it; otherwise navigate to my requests page
            if (onSuccess) {
                onSuccess();
            } else {
                router.push("/requests/my");
            }
        } catch (error: unknown) {
            toastError(error instanceof Error ? error.message : "Failed to submit request");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className={cn(
                    "space-y-6",
                    isMobileLayout && "space-y-5 pb-2"
                )}
            >

                <FormField
                    control={form.control}
                    name="leaveTypeId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Leave Type</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={isLoadingContext || effectiveLeaveTypes.length === 0}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={
                                                isLoadingContext
                                                    ? "Loading leave types..."
                                                    : effectiveLeaveTypes.length === 0
                                                        ? "No leave types available"
                                                        : "Select a leave type"
                                            }
                                        />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {effectiveLeaveTypes.map((type) => (
                                        <SelectItem key={type.id} value={type.id}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {isAdmin && (
                                <FormDescription>
                                    Leave types refresh for the selected employee context.
                                </FormDescription>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />





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

                {contextError && (
                    <div className="rounded-md border bg-muted/30 p-4">
                        <div className="flex items-start gap-2 text-sm text-destructive">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{contextError}</span>
                        </div>
                    </div>
                )}

                {isAdmin && (
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select
                                    onValueChange={(value) => {
                                        statusTouchedRef.current = true;
                                        field.onChange(value);
                                    }}
                                    value={field.value}
                                >
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

                <div className={cn("grid gap-6", isMobileLayout ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
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
                    name="dayPartStart"
                    render={({ field }) => (
                        <FormItem className="space-y-3 flex flex-col">
                            <FormLabel>When?</FormLabel>
                            <FormControl>
                                <ToggleGroup
                                    type="single"
                                    value={String(field.value)}
                                    onValueChange={(val) => {
                                        if (!val) return;
                                        const isCustom = val === DayPart.CUSTOM;
                                        setIsCustomRange(isCustom);
                                        field.onChange(val);
                                        form.setValue("dayPartEnd", val as DayPart);
                                        if (!isCustom) {
                                            form.setValue("startTime", undefined);
                                            form.setValue("endTime", undefined);
                                        }
                                    }}
                                    className="w-full flex-nowrap items-stretch gap-2 h-auto"
                                >
                                    {PERIOD_PRESETS.map((preset) => {
                                        const isDisabled = preset.value !== DayPart.ALL && !isSingleDay;

                                        return (
                                            <ToggleGroupItem
                                                key={preset.value}
                                                value={String(preset.value)}
                                                className={cn(
                                                    "h-auto min-h-[4.25rem] min-w-0 flex-1 flex-col items-start justify-center gap-1 px-3 py-2.5 text-left",
                                                    "border-muted bg-background/60",
                                                    "data-[state=on]:border-primary data-[state=on]:bg-primary/8 data-[state=on]:text-foreground data-[state=on]:shadow-sm"
                                                )}
                                                disabled={isDisabled}
                                            >
                                                <span className="w-full truncate text-sm font-medium leading-none">
                                                    {preset.label}
                                                </span>
                                                <span className="w-full truncate text-[11px] leading-none text-muted-foreground">
                                                    {preset.timeRange}
                                                </span>
                                            </ToggleGroupItem>
                                        );
                                    })}
                                </ToggleGroup>
                            </FormControl>
                            {!isSingleDay && (
                                <FormDescription>
                                    Multi-day requests use All Day only. Morning, Afternoon, and Custom Range are available for single-day requests.
                                </FormDescription>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />

{isCustomRange && (
    <div className={cn(
        "space-y-3 rounded-lg border border-border/70 p-3 pt-4",
        durationMinutes !== null && durationMinutes <= 0 && "border-destructive bg-destructive/5"
    )}>
    <div className={cn(
        "gap-3 items-end",
        isMobileLayout ? "grid grid-cols-1" : "flex"
    )}>
    <FormField
        control={form.control}
        name="startTime"
        render={({ field }) => (
            <FormItem className="flex-1 min-w-0">
                <FormLabel className="text-xs">Start</FormLabel>
                <FormControl>
                    <TimePicker
                        value={field.value}
                        onChange={field.onChange}
                        mobileOptimized={isMobileLayout}
                    />
                </FormControl>
            </FormItem>
        )}
    />
    <FormField
        control={form.control}
        name="endTime"
        render={({ field }) => (
            <FormItem className="flex-1 min-w-0">
                <FormLabel className="text-xs">End</FormLabel>
                <FormControl>
                    <TimePicker
                        value={field.value}
                        onChange={field.onChange}
                        mobileOptimized={isMobileLayout}
                    />
                </FormControl>
                <FormMessage />
            </FormItem>
        )}
    />
</div>
                        {durationText && (
                            <div className="text-xs text-muted-foreground">
                                {durationText}
                            </div>
                        )}
                        {durationMinutes !== null && durationMinutes <= 0 && (
                            <p className="text-sm text-destructive">
                                End time must be after start time.
                            </p>
                        )}
                    </div>
                )}

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
                                    maxLength={maxCommentLength}
                                    rows={isMobileLayout ? 4 : 3}
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

<Button
                     type="submit"
                     disabled={isSubmitting || (durationMinutes !== null && durationMinutes <= 0)}
                     className={cn(isMobileLayout && "min-h-11 w-full")}
                   >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Request
                </Button>
            </form>
        </Form>
    );
}
