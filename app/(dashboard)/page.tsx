import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AllowanceService } from "@/lib/allowance-service";
import { AllowanceSummary } from "@/components/allowance/allowance-summary";
import { getYear } from "date-fns";
import { serializeData } from "@/lib/serialization";

export default async function DashboardPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const user = await prisma.user.findUnique({
        where: { clerkId: userId }
    });

    if (!user) {
        return <div>Loading...</div>;
    }

    const currentYear = getYear(new Date());
    const breakdown = await AllowanceService.getAllowanceBreakdown(user.id, currentYear);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <AllowanceSummary breakdown={serializeData(breakdown)} />
                </div>

                {/* Future widgets will go here: Upcoming Leaves, Team Status, etc. */}
            </div>
        </div>
    );
}
