'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AllowanceBreakdown } from '@/lib/allowance-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { AllowanceSummary } from '../allowance/allowance-summary';

const adjustmentSchema = z.object({
    adjustment: z.number()
        .min(-365, 'Adjustment must be at least -365 days')
        .max(365, 'Adjustment must be at most 365 days')
        .step(0.5, 'Adjustment must be in 0.5 day increments'),
    reason: z.string()
        .min(10, 'Reason must be at least 10 characters')
        .max(500, 'Reason must be at most 500 characters')
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

interface AllowanceAdjustmentFormProps {
    userId: string;
    initialBreakdown: AllowanceBreakdown;
}

export function AllowanceAdjustmentForm({ userId, initialBreakdown }: AllowanceAdjustmentFormProps) {
    const [breakdown, setBreakdown] = useState(initialBreakdown);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<AdjustmentFormData>({
        resolver: zodResolver(adjustmentSchema),
        defaultValues: {
            adjustment: 0,
            reason: ''
        }
    });

    const onSubmit = async (data: AdjustmentFormData) => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/allowance/adjustment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    year: breakdown.year,
                    adjustment: data.adjustment,
                    reason: data.reason
                })
            });

            if (!response.ok) throw new Error('Failed to save adjustment');

            toast.success('Adjustment saved successfully');

            // Refresh breakdown
            const refreshRes = await fetch(`/api/allowance/user/${userId}/year/${breakdown.year}`);
            if (refreshRes.ok) {
                const newBreakdown = await refreshRes.json();
                setBreakdown(newBreakdown);
            }

            form.reset();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save adjustment');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <AllowanceSummary breakdown={breakdown} />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
                    <h3 className="font-bold text-slate-800">Add Manual Adjustment</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="adjustment"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="adjustment">Adjustment (days)</FormLabel>
                                    <FormControl>
                                        <Input
                                            id="adjustment"
                                            type="number"
                                            step="0.5"
                                            placeholder="e.g. 1.5 or -2"
                                            {...field}
                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="reason"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel htmlFor="reason">Reason (for history)</FormLabel>
                                <FormControl>
                                    <Input
                                        id="reason"
                                        placeholder="e.g. Reward for extra work"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                        {isSubmitting ? 'Saving...' : 'Apply Adjustment'}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
