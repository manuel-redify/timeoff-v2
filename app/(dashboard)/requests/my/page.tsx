import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { NewLeaveRequestDialog } from "@/components/requests/new-leave-request-dialog";
import { MyRequestsTable } from "@/components/requests/my-requests-table";

export default async function MyRequestsPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    const requests = await prisma.leaveRequest.findMany({
        where: {
            userId: user.id,
            deletedAt: null // Only show non-deleted
        },
        include: {
            leaveType: true,
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">My Requests</h2>
                <div className="flex items-center space-x-2">
                    <NewLeaveRequestDialog userId={user.id} />
                </div>
            </div>

            <MyRequestsTable requests={requests as any} />
        </div>
    );
}
