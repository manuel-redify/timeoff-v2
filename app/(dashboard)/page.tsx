import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AllowanceService } from "@/lib/allowance-service";
import { LeaveRequestService } from "@/lib/services/leave-request.service";
import { AllowanceSummary } from "@/components/allowance/allowance-summary";
import { RequestsTable } from "@/components/requests/requests-table";
import { HeroCard } from "@/components/dashboard/hero-card";
import { PendingRequestsCard } from "@/components/dashboard/pending-requests-card";
import { UpcomingCountCard } from "@/components/dashboard/upcoming-count-card";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { LeavesTakenCard } from "@/components/dashboard/leaves-taken-card";
import { BentoGrid, BentoItem, BentoKpiGrid } from "@/components/ui/bento-grid";
import { getYear } from "date-fns";
import { serializeData } from "@/lib/serialization";

export default async function DashboardPage() {
const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!user) {
        return <div>Loading...</div>;
    }

    const currentYear = getYear(new Date());
    const breakdown = await AllowanceService.getAllowanceBreakdown(user.id, currentYear);
    const pendingRequests = await LeaveRequestService.getPendingRequests(user.id);
    const upcomingCount = await LeaveRequestService.getUpcomingCount(user.id);
    const leavesTakenYTD = await LeaveRequestService.getLeavesTakenYTD(user.id);
    const nextLeave = await LeaveRequestService.getNextLeave(user.id);
    const hasAllowance = breakdown.totalAllowance > 0;

    const requests = await prisma.leaveRequest.findMany({
        where: {
            userId: user.id,
            deletedAt: null
        },
        include: { leaveType: true },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            </div>

            <BentoGrid>
                <BentoItem colSpan={2} rowSpan={hasAllowance ? 2 : 1}>
                    <HeroCard leave={nextLeave} className="h-full" />
                </BentoItem>
                <BentoItem colSpan={2} rowSpan={hasAllowance ? 2 : 1}>
                    <BentoKpiGrid>
                        <PendingRequestsCard value={pendingRequests} />
                        <UpcomingCountCard value={upcomingCount} />
                        {hasAllowance && <LeavesTakenCard value={leavesTakenYTD} />}
                        {hasAllowance && <BalanceCard value={breakdown.availableAllowance} />}
                    </BentoKpiGrid>
                </BentoItem>
            </BentoGrid>

            <AllowanceSummary breakdown={serializeData(breakdown)} />

            <div>
                <h2 className="text-xl font-semibold mb-4">My Requests</h2>
                <RequestsTable requests={requests as any} />
            </div>
        </div>
    );
}
