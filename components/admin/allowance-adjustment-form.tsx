'use client';

import { useState } from 'react';
import { AllowanceBreakdown } from '@/lib/allowance-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AllowanceSummary } from '../allowance/allowance-summary';

interface AllowanceAdjustmentFormProps {
    userId: string;
    initialBreakdown: AllowanceBreakdown;
}

export function AllowanceAdjustmentForm({ userId, initialBreakdown }: AllowanceAdjustmentFormProps) {
    const [breakdown, setBreakdown] = useState(initialBreakdown);
    const [adjustment, setAdjustment] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const value = parseFloat(adjustment);
        if (isNaN(value)) {
            toast.error('Invalid adjustment value');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/allowance/adjustment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    year: breakdown.year,
                    adjustment: value,
                    reason
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

            setAdjustment('');
            setReason('');
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

            <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
                <h3 className="font-bold text-slate-800">Add Manual Adjustment</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="adjustment">Adjustment (days)</Label>
                        <Input
                            id="adjustment"
                            type="number"
                            step="0.5"
                            placeholder="e.g. 1.5 or -2"
                            value={adjustment}
                            onChange={(e) => setAdjustment(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="reason">Reason (for history)</Label>
                    <Input
                        id="reason"
                        placeholder="e.g. Reward for extra work"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                    />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? 'Saving...' : 'Apply Adjustment'}
                </Button>
            </form>
        </div>
    );
}
