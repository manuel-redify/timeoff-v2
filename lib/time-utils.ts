export interface TimeValue {
    hours: number;
    minutes: number;
}

export function formatTime(time: TimeValue, use24Hour: boolean = true): string {
    const { hours, minutes } = time;
    
    if (use24Hour) {
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    }
    
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function parseTimeString(timeString: string): TimeValue | null {
    const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    
    return { hours, minutes };
}

export function generateTimeValues(stepMinutes: number = 15): TimeValue[] {
    const times: TimeValue[] = [];
    
    for (let hours = 0; hours < 24; hours++) {
        for (let minutes = 0; minutes < 60; minutes += stepMinutes) {
            times.push({ hours, minutes });
        }
    }
    
    return times;
}

export function isTimeAfter(start: TimeValue, end: TimeValue): boolean {
    const startMinutes = start.hours * 60 + start.minutes;
    const endMinutes = end.hours * 60 + end.minutes;
    return endMinutes > startMinutes;
}

export function calculateDuration(start: TimeValue, end: TimeValue): number {
    const startMinutes = start.hours * 60 + start.minutes;
    const endMinutes = end.hours * 60 + end.minutes;
    return endMinutes - startMinutes;
}

export function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
        return `${mins}m`;
    }
    
    if (mins === 0) {
        return `${hours}h`;
    }
    
    return `${hours}h ${mins}m`;
}
