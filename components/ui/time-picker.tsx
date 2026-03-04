"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    formatTime,
    generateTimeValues,
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
}

export function TimePicker({
    value,
    onChange,
    use24Hour = true,
    stepMinutes = 15,
    placeholder = "Select time",
    disabled = false,
}: TimePickerProps) {
    const [open, setOpen] = React.useState(false);
    const isMobile = useMediaQuery("(max-width: 640px)");
    const hourScrollRef = React.useRef<HTMLDivElement>(null);
    const minuteScrollRef = React.useRef<HTMLDivElement>(null);
    const timeValues = React.useMemo(
        () => generateTimeValues(stepMinutes),
        [stepMinutes]
    );
    const hours = React.useMemo(
        () => timeValues.filter((t) => t.minutes === 0),
        [timeValues]
    );
    const minutes = React.useMemo(
        () => timeValues.filter((t) => t.hours === (value?.hours ?? 0)),
        [timeValues, value?.hours]
    );

    const handleHourSelect = React.useCallback(
        (hour: number) => {
            if (!value) {
                onChange?.({ hours: hour, minutes: 0 });
            } else {
                onChange?.({ hours: hour, minutes: value.minutes });
            }
        },
        [value, onChange]
    );

    const handleMinuteSelect = React.useCallback(
        (minute: number) => {
            if (!value) {
                onChange?.({ hours: 9, minutes: minute });
            } else {
                onChange?.({ hours: value.hours, minutes: minute });
            }
        },
        [value, onChange]
    );

    const displayValue = value
        ? formatTime(value, use24Hour)
        : placeholder;

    const scrollHeight = isMobile ? "h-[180px]" : "h-[120px]";
    const columnWidth = isMobile ? "w-[50px]" : "w-[40px]";
    const buttonPadding = isMobile ? "px-1 py-0.5" : "px-1 py-0.5";
    const fontSize = isMobile ? "text-xs" : "text-[10px]";

    const handleWheel = React.useCallback((e: React.WheelEvent, scrollRef: React.RefObject<HTMLDivElement | null>) => {
        e.preventDefault();
        if (scrollRef.current) {
            scrollRef.current.scrollTop += e.deltaY;
        }
    }, []);

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
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex">
                    <div 
                        ref={hourScrollRef} 
                        className={cn("border-r overflow-y-scroll scrollbar-hide", columnWidth, "cursor-pointer")}
                        onWheel={(e) => handleWheel(e, hourScrollRef)}
                    >
                        <div className="flex flex-col p-1 sm:p-2">
                            {hours.map((time) => (
                                <button
                                    key={time.hours}
                                    type="button"
                                    onClick={() => handleHourSelect(time.hours)}
                                    className={cn(
                                        "rounded-md font-medium hover:bg-accent hover:text-accent-foreground transition-colors touch-manipulation",
                                        buttonPadding,
                                        fontSize,
                                        value?.hours === time.hours &&
                                            "bg-accent text-accent-foreground"
                                    )}
                                >
                                    {use24Hour
                                        ? time.hours.toString().padStart(2, "0")
                                        : time.hours === 0
                                        ? "12"
                                        : time.hours > 12
                                        ? (time.hours - 12).toString()
                                        : time.hours.toString()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div 
                        ref={minuteScrollRef}
                        className={cn("overflow-y-scroll scrollbar-hide", columnWidth, "cursor-pointer")}
                        onWheel={(e) => handleWheel(e, minuteScrollRef)}
                    >
                        <div className="flex flex-col p-1 sm:p-2">
                            {minutes.map((time) => (
                                <button
                                    key={time.minutes}
                                    type="button"
                                    onClick={() => handleMinuteSelect(time.minutes)}
                                    className={cn(
                                        "rounded-md font-medium hover:bg-accent hover:text-accent-foreground transition-colors touch-manipulation",
                                        buttonPadding,
                                        fontSize,
                                        value?.minutes === time.minutes &&
                                            "bg-accent text-accent-foreground"
                                    )}
                                >
                                    {time.minutes.toString().padStart(2, "0")}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
