import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AllowanceService } from "@/lib/allowance-service";
import { getYear } from "date-fns";
import { serializeData } from "@/lib/serialization";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AllowanceSummary } from "@/components/allowance/allowance-summary";
import { Info, History, ArrowRightLeft } from "lucide-react";

export default async function AllowanceDetailsPage({
    searchParams
}: {
    searchParams: Promise<{ year?: string }>
}) {
    const { userId: clerkId } = await auth();
    if (!clerkId) redirect("/sign-in");

    const user = await prisma.user.findUnique({
        where: { clerkId: clerkId },
        include: { company: true, department: true }
    });

    if (!user) return redirect("/profile");

    const { year } = await searchParams;
    const currentYear = getYear(new Date());
    const targetYear = year ? parseInt(year) : currentYear;

    const breakdown = await AllowanceService.getAllowanceBreakdown(user.id, targetYear);

    // Get adjustements history
    const adjustments = await prisma.userAllowanceAdjustment.findUnique({
        where: {
            userId_year: {
                userId: user.id,
                year: targetYear
            }
        }
    });

    // Get audit logs for adjustments
    const auditLogs = await prisma.audit.findMany({
        where: {
            entityType: 'UserAllowanceAdjustment',
            entityId: adjustments?.id || 'none'
        },
        orderBy: { at: 'desc' },
        include: { byUser: true }
    });

    // Get comments
    const comments = await prisma.comment.findMany({
        where: {
            entityType: 'UserAllowanceAdjustment',
            entityId: adjustments?.id || 'none'
        },
        orderBy: { at: 'desc' },
        include: { byUser: true }
    });

    return (
        <div className="container mx-auto py-10 max-w-4xl px-4 space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Allowance Detals</h1>
                    <p className="text-slate-500">Full breakdown and history for {targetYear}</p>
                </div>

                <div className="flex items-center gap-2">
                    <a
                        href={`?year=${targetYear - 1}`}
                        className="p-2 hover:bg-slate-100 rounded-md border text-sm font-medium transition-colors"
                    >
                        Previous Year
                    </a>
                    <a
                        href={`?year=${targetYear + 1}`}
                        className="p-2 hover:bg-slate-100 rounded-md border text-sm font-medium transition-colors"
                    >
                        Next Year
                    </a>
                </div>
            </div>

            <AllowanceSummary breakdown={serializeData(breakdown)} />

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Info className="size-5 text-indigo-500" />
                            Calculation Method
                        </CardTitle>
                        <CardDescription>How your entitlement is determined</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-dashed">
                            <span className="text-sm text-slate-600">Base Entitlement</span>
                            <span className="font-semibold">{breakdown.baseAllowance} days</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-dashed">
                            <span className="text-sm text-slate-600">Source</span>
                            <span className="text-sm font-medium capitalize">{breakdown.allowanceSource} settings</span>
                        </div>
                        {breakdown.isProRated && (
                            <div className="flex justify-between items-center py-2 border-b border-dashed">
                                <span className="text-sm text-slate-600">Pro-rating Rule</span>
                                <span className="text-sm font-medium text-amber-600">{breakdown.proRatingReason}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center py-2 border-b border-dashed">
                            <span className="text-sm text-slate-600">Carry-over Limit</span>
                            <span className="text-sm font-medium">{user.company.carryOver === 1000 ? 'Unlimited' : `${user.company.carryOver} days`}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <History className="size-5 text-green-500" />
                            Balance History
                        </CardTitle>
                        <CardDescription>Manual adjustments and carry-over</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {auditLogs.length === 0 && !breakdown.carriedOver ? (
                            <div className="text-center py-6 text-slate-400">
                                <p className="text-sm italic">No adjustment history found for this year.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {breakdown.carriedOver > 0 && (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <ArrowRightLeft className="size-4 text-indigo-400" />
                                        <div className="flex-1">
                                            <p className="text-sm font-bold">+{breakdown.carriedOver} days</p>
                                            <p className="text-[11px] text-slate-500 uppercase font-bold tracking-tight">Carried over from {targetYear - 1}</p>
                                        </div>
                                    </div>
                                )}

                                {auditLogs.map((log) => (
                                    <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <History className="size-4 text-slate-400 mt-0.5" />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm font-bold">{parseFloat(log.newValue || '0') > 0 ? '+' : ''}{log.newValue} days</p>
                                                <span className="text-[10px] text-slate-400">{new Date(log.at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500">By {log.byUser?.name || 'Administrator'}</p>
                                            {comments.find(c => c.at.getTime() === log.at.getTime()) && (
                                                <p className="text-xs mt-1 text-slate-600 italic">
                                                    "{comments.find(c => c.at.getTime() === log.at.getTime())?.comment}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-center">
                <a
                    href="/dashboard"
                    className="text-sm text-slate-500 hover:text-indigo-600 transition-colors font-medium underline underline-offset-4"
                >
                    Return to Dashboard
                </a>
            </div>
        </div>
    );
}
