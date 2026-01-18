import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MyRequestsTable } from "@/components/requests/my-requests-table";

export default async function MyRequestsPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/sign-in");
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
                    <Button asChild>
                        <Link href="/requests/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Request
                        </Link>
                    </Button>
                </div>
            </div>

            <MyRequestsTable requests={requests as any} />
        </div>
    );
}
