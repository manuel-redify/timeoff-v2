import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { LeaveRequestForm } from "@/components/requests/leave-request-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewLeaveRequestPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch active leave types for the company
    const leaveTypes = await prisma.leaveType.findMany({
where: {
            companyId: user.companyId,
        },
        orderBy: {
            sortOrder: 'asc'
        },
        select: {
            id: true,
            name: true,
            useAllowance: true,
            limit: true
        }
    });

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">New Leave Request</h2>
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Request Time Off</CardTitle>
                        <CardDescription>
                            Submit a new leave request for approval.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LeaveRequestForm
                            leaveTypes={leaveTypes}
                            userId={user.id}
                        />
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Allowance Summary</CardTitle>
                        <CardDescription>
                            Your current balance overview.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            TODO: Add Allowance Breakdown Component here.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
