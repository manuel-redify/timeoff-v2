import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AllowanceService } from "@/lib/allowance-service";
import { LeaveRequestService } from "@/lib/services/leave-request.service";
import { DashboardRequestsPanel } from "@/components/requests/dashboard-requests-panel";
import { YearFilter } from "@/components/requests/year-filter";
import { StatusFilter } from "@/components/requests/status-filter";
import { HeroCard } from "@/components/dashboard/hero-card";
import { PendingRequestsCard } from "@/components/dashboard/pending-requests-card";
import { UpcomingCountCard } from "@/components/dashboard/upcoming-count-card";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { LeavesTakenCard } from "@/components/dashboard/leaves-taken-card";
import { BentoGrid, BentoItem, BentoKpiGrid } from "@/components/ui/bento-grid";
import { getYear } from "date-fns";
import { LeaveStatus } from "@/lib/generated/prisma/enums";

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ year?: string; requestId?: string; status?: string | string[]; page?: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!user) {
        return <div>Loading...</div>;
    }

    const currentYear = getYear(new Date());
    const params = await searchParams;
    const selectedYear = params.year ? parseInt(params.year, 10) : null;
    const statusParam = params.status;
    const statusArray = typeof statusParam === 'string' ? statusParam.split(",").filter(Boolean) : [];
    const currentPage = params.page ? parseInt(params.page, 10) : 1;
    const itemsPerPage = 10;

    const [breakdown, pendingRequests, upcomingCount, leavesTakenYTD, nextLeave] = 
        await Promise.all([
            AllowanceService.getAllowanceBreakdown(user.id, currentYear),
            LeaveRequestService.getPendingRequests(user.id),
            LeaveRequestService.getUpcomingCount(user.id),
            LeaveRequestService.getLeavesTakenYTD(user.id),
            LeaveRequestService.getNextLeave(user.id),
        ]);
    const hasAllowance = breakdown.totalAllowance > 0;
    const isUnlimited = breakdown.totalAllowance >= 9999;

    const yearFilter = selectedYear ? { gte: new Date(selectedYear, 0, 1), lt: new Date(selectedYear + 1, 0, 1) } : undefined;
    const statusFilter = statusArray.length > 0 && !statusArray.includes("all") 
        ? { in: statusArray as LeaveStatus[] } 
        : undefined;

    const whereClause = {
        userId: user.id,
        deletedAt: null,
        ...(yearFilter && { dateStart: yearFilter }),
        ...(statusFilter && { status: statusFilter }),
    };

    const [paginatedRequests, totalItems] = await Promise.all([
        prisma.leaveRequest.findMany({
            where: whereClause,
            include: { leaveType: true },
            orderBy: { createdAt: 'desc' },
            skip: (currentPage - 1) * itemsPerPage,
            take: itemsPerPage,
        }),
        prisma.leaveRequest.count({ where: whereClause }),
    ]);

    const yearsWithDataSet = await prisma.leaveRequest.findMany({
        where: { userId: user.id, deletedAt: null },
        select: { dateStart: true },
        distinct: ['dateStart'],
    });

    const yearsWithData = new Set<number>();
    yearsWithDataSet.forEach((req) => {
        yearsWithData.add(getYear(new Date(req.dateStart)));
    });
    yearsWithData.add(currentYear);

    const availableYears = Array.from(yearsWithData).sort((a, b) => b - a);

    const totalPages = Math.ceil(totalItems / itemsPerPage);

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
                        {hasAllowance && <LeavesTakenCard value={leavesTakenYTD} totalAllowance={isUnlimited ? undefined : breakdown.totalAllowance} />}
                        {hasAllowance && !isUnlimited && <BalanceCard value={breakdown.availableAllowance} />}
                    </BentoKpiGrid>
                </BentoItem>
            </BentoGrid>

            {/*<AllowanceSummary breakdown={serializeData(breakdown)} />*/}

            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">My Requests</h2>
                    <div className="flex gap-2">
                        <StatusFilter />
                        <YearFilter availableYears={availableYears} currentYear={currentYear} />
                    </div>
                </div>
                <DashboardRequestsPanel
                    requests={paginatedRequests}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    initialRequestId={params.requestId ?? null}
                />
            </div>
        </div>
    );
}
