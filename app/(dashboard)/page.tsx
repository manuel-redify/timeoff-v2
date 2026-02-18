import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AllowanceService } from "@/lib/allowance-service";
import { LeaveRequestService } from "@/lib/services/leave-request.service";
import { AllowanceSummary } from "@/components/allowance/allowance-summary";
import { MyRequestsTable } from "@/components/requests/my-requests-table";
import { PendingRequestsCard } from "@/components/dashboard/pending-requests-card";
import { UpcomingCountCard } from "@/components/dashboard/upcoming-count-card";
import { BalanceCard } from "@/components/dashboard/balance-card";
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <PendingRequestsCard value={pendingRequests} />
                <UpcomingCountCard value={upcomingCount} />
                {breakdown.totalAllowance > 0 && (
                    <BalanceCard value={breakdown.availableAllowance} />
                )}
            </div>

            <AllowanceSummary breakdown={serializeData(breakdown)} />

            <div>
                <h2 className="text-xl font-semibold mb-4">My Requests</h2>
                <MyRequestsTable requests={requests as any} />
            </div>
        </div>
    );
}
