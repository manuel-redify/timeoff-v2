'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface CompanyUser {
    id: string;
    name: string;
    lastname: string;
    email: string;
    department: {
        name: string;
    } | null;
}

interface Props {
    userId: string;
    companyUsers: CompanyUser[];
}

export function DelegationForm({ userId, companyUsers }: Props) {
    const router = useRouter();
    const [delegateId, setDelegateId] = useState('');
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!delegateId || !startDate || !endDate) {
            toast({
                title: 'Missing information',
                description: 'Please select a delegate and both start and end dates',
                variant: 'destructive',
            });
            return;
        }

        if (startDate >= endDate) {
            toast({
                title: 'Invalid dates',
                description: 'End date must be after start date',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/approvals/delegations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    delegateId,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create delegation');
            }

            toast({
                title: 'Success',
                description: 'Delegation created successfully',
            });

            // Reset form
            setDelegateId('');
            setStartDate(undefined);
            setEndDate(undefined);

            router.refresh();
        } catch (error) {
            console.error('Create delegation error:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to create delegation',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create New Delegation</CardTitle>
                <CardDescription>
                    Temporarily delegate your approval authority to another user
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="delegate">Delegate To</Label>
                        <Select value={delegateId} onValueChange={setDelegateId}>
                            <SelectTrigger id="delegate">
                                <SelectValue placeholder="Select a user" />
                            </SelectTrigger>
                            <SelectContent>
                                {companyUsers.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.name} {user.lastname}
                                        {user.department && ` - ${user.department.name}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'w-full justify-start text-left font-normal',
                                            !startDate && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={setStartDate}
                                        initialFocus
                                        disabled={(date) => date < new Date()}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'w-full justify-start text-left font-normal',
                                            !endDate && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={endDate}
                                        onSelect={setEndDate}
                                        initialFocus
                                        disabled={(date) => !startDate || date <= startDate}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? 'Creating...' : 'Create Delegation'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
