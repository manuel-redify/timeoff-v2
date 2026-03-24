"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
    detectUse24HourClock,
    formatTime,
    type TimeValue,
} from "@/lib/time-utils";
import { useMediaQuery } from "@/hooks/use-media-query";

interface TimePickerProps {
    value?: TimeValue;
    onChange?: (time: TimeValue) => void;
    use24Hour?: boolean;
    stepMinutes?: number;
    placeholder?: string;
    disabled?: boolean;
    mobileOptimized?: boolean;
}

export function TimePicker({
    value,
    onChange,
    use24Hour,
    stepMinutes = 15,
    placeholder = "Select time",
    disabled = false,
    mobileOptimized = false,
}: TimePickerProps) {
    const [open, setOpen] = React.useState(false);
    const isMobile = useMediaQuery("(max-width: 640px)");
    const useMobileLayout = isMobile || mobileOptimized;
    const resolvedUse24Hour = use24Hour ?? detectUse24HourClock();
    const selectedHours = value?.hours ?? 9;
    const selectedMinutes = value?.minutes ?? 0;
    const scrollHeight = useMobileLayout
        ? "h-[min(280px,40vh)]"
        : "h-[min(220px,35vh)]";
    const itemClassName = useMobileLayout
        ? "h-12 text-sm"
        : "h-9 text-xs";
    const popoverWidthClassName = useMobileLayout
        ? "w-[272px] max-w-[calc(100vw-2rem)]"
        : "w-[252px]";
    const hours = Array.from({ length: 24 }, (_, index) => index);
    const minutes = Array.from(
        { length: Math.floor(60 / stepMinutes) },
        (_, index) => index * stepMinutes
    );

    const handleSelect = React.useCallback((nextTime: TimeValue, shouldClose = false) => {
        onChange?.(nextTime);
        if (shouldClose) {
            setOpen(false);
        }
    }, [onChange]);

    const displayValue = value
        ? formatTime(value, resolvedUse24Hour)
        : placeholder;

    const formatHourLabel = React.useCallback((hour: number) => {
        if (resolvedUse24Hour) {
            return hour.toString().padStart(2, "0");
        }

        if (hour === 0) {
            return "12a";
        }

        if (hour < 12) {
            return `${hour}a`;
        }

        if (hour === 12) {
            return "12p";
        }

        return `${hour - 12}p`;
    }, [resolvedUse24Hour]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground"
                    )}
                    disabled={disabled}
                >
                    <Clock className="mr-2 h-4 w-4" />
                    {displayValue}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className={cn(
                    "max-h-[calc(100vh-2rem)] overflow-hidden p-0",
                    popoverWidthClassName
                )}
                align="start"
            >
                <div className="flex flex-nowrap overflow-hidden">
                    <div className="w-[152px] min-w-[152px] border-r">
                        <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
                            Hour
                        </div>
                        <ScrollArea className={cn(scrollHeight, "overscroll-contain scroll-smooth")}>
                            <div className="grid gap-1 p-2">
                                {hours.map((hour) => (
                                    <Button
                                        key={hour}
                                        type="button"
                                        variant={selectedHours === hour ? "default" : "ghost"}
                                        className={cn("w-full min-w-0 justify-center px-2 tabular-nums", itemClassName)}
                                        onClick={() => handleSelect({ hours: hour, minutes: selectedMinutes })}
                                    >
                                        <span className="truncate">{formatHourLabel(hour)}</span>
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                    <div className="w-[100px] min-w-[100px]">
                        <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
                            Minute
                        </div>
                        <ScrollArea className={cn(scrollHeight, "overscroll-contain scroll-smooth")}>
                            <div className="grid gap-1 p-2">
                                {minutes.map((minute) => (
                                    <Button
                                        key={minute}
                                        type="button"
                                        variant={selectedMinutes === minute ? "default" : "ghost"}
                                        className={cn("w-full min-w-0 justify-center px-2 tabular-nums", itemClassName)}
                                        onClick={() => handleSelect({ hours: selectedHours, minutes: minute }, true)}
                                    >
                                        {minute.toString().padStart(2, "0")}
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
