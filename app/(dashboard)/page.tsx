import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AllowanceService } from "@/lib/allowance-service";
import { AllowanceSummary } from "@/components/allowance/allowance-summary";
import { MyRequestsTable } from "@/components/requests/my-requests-table";
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

            <AllowanceSummary breakdown={serializeData(breakdown)} />

            <div>
                <h2 className="text-xl font-semibold mb-4">My Requests</h2>
                <MyRequestsTable requests={requests as any} />
            </div>
        </div>
    );
}
