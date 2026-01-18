'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AllowanceBreakdown } from "@/lib/allowance-service";
import { Calendar, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AllowanceSummaryProps {
    breakdown: AllowanceBreakdown;
}

export function AllowanceSummary({ breakdown }: AllowanceSummaryProps) {
    const total = breakdown.totalAllowance;
    const used = breakdown.usedAllowance;
    const pending = breakdown.pendingAllowance;
    const available = breakdown.availableAllowance;

    // Percentage for progress bar
    const usedPercentage = (used / total) * 100;
    const pendingPercentage = (pending / total) * 100;

    return (
        <Card className="overflow-hidden">
            <CardHeader className="bg-slate-50 border-b py-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="size-5 text-indigo-600" />
                    Allowance for {breakdown.year}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="space-y-1">
                        <p className="text-2xl font-bold text-slate-900">{total}</p>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-2xl font-bold text-green-600">{used}</p>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Used</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-2xl font-bold text-amber-500">{pending}</p>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-2xl font-bold text-indigo-600">{available}</p>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                            className="bg-green-500 h-full transition-all duration-500"
                            style={{ width: `${usedPercentage}%` }}
                            title={`Used: ${used} days`}
                        />
                        <div
                            className="bg-amber-400 h-full transition-all duration-500"
                            style={{ width: `${pendingPercentage}%` }}
                            title={`Pending: ${pending} days`}
                        />
                    </div>
                    <div className="flex justify-between text-[11px] font-medium text-slate-500">
                        <span>Used: {used}d</span>
                        <span>Pending: {pending}d</span>
                        <span className="text-indigo-600 font-bold">Total: {total}d</span>
                    </div>
                </div>

                <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-start gap-2">
                        <Info className="size-4 text-blue-500 mt-0.5 shrink-0" />
                        <div className="text-xs text-blue-800 space-y-1.5">
                            <p>
                                <strong>Base Allowance:</strong> {breakdown.baseAllowance} days (Source: {breakdown.allowanceSource})
                            </p>
                            {breakdown.isProRated && (
                                <p>
                                    <strong>Pro-rated Adjustment:</strong> {breakdown.proRatedAdjustment > 0 ? '+' : ''}{breakdown.proRatedAdjustment} days ({breakdown.proRatingReason})
                                </p>
                            )}
                            {breakdown.carriedOver > 0 && (
                                <p>
                                    <strong>Carried Over:</strong> +{breakdown.carriedOver} days from previous year
                                </p>
                            )}
                            {breakdown.manualAdjustment !== 0 && (
                                <p>
                                    <strong>Manual Adjustment:</strong> {breakdown.manualAdjustment > 0 ? '+' : ''}{breakdown.manualAdjustment} days
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
