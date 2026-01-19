'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertTriangle, Users } from 'lucide-react';
import { format } from 'date-fns';

interface ConflictingLeave {
    id: string;
    userId: string;
    userName: string;
    dateStart: Date;
    dateEnd: Date;
    leaveTypeName: string;
    leaveTypeColor: string;
}

interface ConflictData {
    hasConflicts: boolean;
    conflictingLeaves: ConflictingLeave[];
    totalConflicts: number;
    message?: string;
}

interface Props {
    leaveRequestId: string;
}

export function ConflictIndicator({ leaveRequestId }: Props) {
    const [conflicts, setConflicts] = useState<ConflictData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchConflicts = async () => {
            try {
                const response = await fetch(`/api/approvals/${leaveRequestId}/conflicts`);
                if (response.ok) {
                    const data = await response.json();
                    setConflicts(data);
                }
            } catch (error) {
                console.error('Failed to fetch conflicts:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConflicts();
    }, [leaveRequestId]);

    if (isLoading || !conflicts || !conflicts.hasConflicts) {
        return null;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge
                        variant="outline"
                        className="cursor-help border-orange-500 text-orange-700 dark:text-orange-400"
                    >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {conflicts.totalConflicts} Conflict{conflicts.totalConflicts !== 1 ? 's' : ''}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm">
                    <div className="space-y-2">
                        <p className="font-medium flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Team members also off:
                        </p>
                        <div className="space-y-1">
                            {conflicts.conflictingLeaves.map((leave) => (
                                <div key={leave.id} className="text-sm">
                                    <span className="font-medium">{leave.userName}</span>
                                    <span className="text-muted-foreground ml-2">
                                        {format(new Date(leave.dateStart), 'MMM d')} -{' '}
                                        {format(new Date(leave.dateEnd), 'MMM d')}
                                    </span>
                                    <Badge
                                        className="ml-2"
                                        style={{
                                            backgroundColor: leave.leaveTypeColor,
                                            color: '#fff',
                                        }}
                                    >
                                        {leave.leaveTypeName}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
