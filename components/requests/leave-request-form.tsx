"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, isSameDay } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Enums matching the Prisma schema/API
enum DayPart {
    ALL = "ALL",
    MORNING = "MORNING",
    AFTERNOON = "AFTERNOON",
}

const formSchema = z.object({
    leaveTypeId: z.string().min(1, "Leave type is required"),
    dateStart: z.date({
        message: "Start date is required",
    }),
    dayPartStart: z.nativeEnum(DayPart),
    dateEnd: z.date({
        message: "End date is required",
    }),
    dayPartEnd: z.nativeEnum(DayPart),
    employeeComment: z.string().max(255, "Comment must be 255 characters or less").optional(),
}).refine((data) => {
    if (data.dateEnd < data.dateStart) {
        return false;
    }
    return true;
}, {
    message: "End date cannot be before start date",
    path: ["dateEnd"],
});

interface LeaveType {
    id: string;
    name: string;
    useAllowance: boolean;
    limit: number | null;
    // availableAllowance?: number; // Might need this later
}

interface LeaveRequestFormProps {
    leaveTypes: LeaveType[];
    userId: string; // To fetch allowance info if needed
}

export function LeaveRequestForm({ leaveTypes, userId }: LeaveRequestFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [calculatedDays, setCalculatedDays] = useState<number | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            dayPartStart: DayPart.ALL,
            dayPartEnd: DayPart.ALL,
        },
    });

    const watchDateStart = form.watch("dateStart");
    const watchDateEnd = form.watch("dateEnd");
    const watchDayPartStart = form.watch("dayPartStart");
    const watchDayPartEnd = form.watch("dayPartEnd");

    // Reset end date if start date changes to be after it (UX convenience)
    useEffect(() => {
        if (watchDateStart && watchDateEnd && watchDateStart > watchDateEnd) {
            form.setValue("dateEnd", watchDateStart);
        }
    }, [watchDateStart, watchDateEnd, form]);

    // Handle single day logic visually
    const isSingleDay = watchDateStart && watchDateEnd && isSameDay(watchDateStart, watchDateEnd);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/leave-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details?.join(", ") || data.error || "Failed to submit request");
            }

            toast.success(data.message);
            form.reset({
                dayPartStart: DayPart.ALL,
                dayPartEnd: DayPart.ALL,
            });
            setCalculatedDays(null);

            // Refresh the page or redirect to my requests
            router.refresh();
            router.push("/requests/my");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    // Effect to calculate days
    // We can't easily calculate allowance-aware days purely client side without user schedule.
    // We should create a helper endpoint for this or just rely on backend response?
    // PRD says "real-time feedback".
    // Let's stub calculation for now or just trust the backend return? 
    // Ideally we hit an endpoint: POST /api/leave-requests/calculate-days

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
                                <FormItem className="space-y-3 pt-6">
                                    <FormLabel>When?</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={(val) => {
                                                field.onChange(val);
                                                // Sync end part with start part
                                                form.setValue("dayPartEnd", val as DayPart);
                                            }}
                                            defaultValue={field.value}
                                            className="flex flex-col space-y-1"
                                        >
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value={DayPart.ALL} />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                    All Day
                                                </FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value={DayPart.MORNING} />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                    Morning Only
                                                </FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value={DayPart.AFTERNOON} />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                    Afternoon Only
                                                </FormLabel>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
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
                            <FormDescription>
                                You can mention any specific details here.
                            </FormDescription>
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
