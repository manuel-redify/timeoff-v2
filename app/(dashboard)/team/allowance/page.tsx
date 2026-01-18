import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AllowanceService } from "@/lib/allowance-service";
import { getYear } from "date-fns";
import { serializeData } from "@/lib/serialization";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Download } from "lucide-react";
import { isAnySupervisor, getCurrentUser } from "@/lib/rbac";

export default async function TeamAllowancePage() {
    const isSup = await isAnySupervisor();
    const currentUser = await getCurrentUser();

    if (!isSup && !currentUser?.isAdmin) {
        redirect("/");
    }

    const currentYear = getYear(new Date());

    // Get all departments where the user is a supervisor
    const departments = await prisma.department.findMany({
        where: {
            OR: [
                { bossId: currentUser?.id },
                { supervisors: { some: { userId: currentUser?.id } } }
            ]
        },
        include: {
            users: {
                where: { deletedAt: null },
                include: {
                    allowanceAdjustments: {
                        where: { year: currentYear }
                    }
                }
            }
        }
    });

    // If admin, maybe show everything? For now let's stick to what they supervise + admin view if applicable.
    // If Admin, let's get all users if they have no supervised departments.
    let teamUsers = departments.flatMap(d => d.users.map(u => ({ ...u, departmentName: d.name })));

    if (currentUser?.isAdmin && teamUsers.length === 0) {
        const allUsers = await prisma.user.findMany({
            where: { deletedAt: null },
            include: {
                department: true,
                allowanceAdjustments: {
                    where: { year: currentYear }
                }
            }
        });
        teamUsers = allUsers.map(u => ({ ...u, departmentName: u.department?.name || 'No Department' }));
    }

    // Get breakdowns for all users
    const userBreakdowns = await Promise.all(
        teamUsers.map(async (u) => {
            const breakdown = await AllowanceService.getAllowanceBreakdown(u.id, currentYear);
            return {
                ...u,
                breakdown
            };
        })
    );

    return (
        <div className="container mx-auto py-10 px-4 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Team Allowance</h1>
                <p className="text-slate-500">Monitor leave entitlements for your team members in {currentYear}</p>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                    <div>
                        <CardTitle className="text-xl">Team Overview</CardTitle>
                        <CardDescription>
                            {userBreakdowns.length} team members under your supervision
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Used</TableHead>
                                <TableHead className="text-right">Pending</TableHead>
                                <TableHead className="text-right">Available</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {userBreakdowns.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{user.name} {user.lastname}</span>
                                            <span className="text-xs text-slate-500">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-normal">
                                            {user.departmentName}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">{user.breakdown.totalAllowance}</TableCell>
                                    <TableCell className="text-right text-slate-600">{user.breakdown.usedAllowance}</TableCell>
                                    <TableCell className="text-right text-amber-600">{user.breakdown.pendingAllowance}</TableCell>
                                    <TableCell className="text-right">
                                        <span className={cn(
                                            "font-bold",
                                            user.breakdown.availableAllowance < 0 ? "text-red-600" : "text-indigo-600"
                                        )}>
                                            {user.breakdown.availableAllowance}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {currentUser?.isAdmin ? (
                                            <a
                                                href={`/admin/users/${user.id}`}
                                                className="text-xs text-indigo-600 hover:underline font-medium"
                                            >
                                                Manage
                                            </a>
                                        ) : (
                                            <span className="text-xs text-slate-400">---</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function cn(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}
