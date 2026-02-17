import { isAdmin } from "@/lib/rbac";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import AdminUserForm from "./admin-user-form";
import { UserScheduleForm } from "./user-schedule-form";
import { serializeData } from "@/lib/serialization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AllowanceService } from "@/lib/allowance-service";
import { AllowanceAdjustmentForm } from "@/components/admin/allowance-adjustment-form";
import { ProjectAssignmentsForm } from "./project-assignments-form";
import { getYear } from "date-fns";

export default async function AdminEditUserPage({ params }: { params: Promise<{ id: string }> }) {
    if (!await isAdmin()) redirect("/");

    const { id } = await params;

    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            department: true,
            defaultRole: true,
            area: true,
        }
    });

    if (!user || user.deletedAt) notFound();

    const departments = await prisma.department.findMany({
        where: { deletedAt: null }
    });

    const roles = await prisma.role.findMany();

    const areas = await prisma.area.findMany();

    const currentYear = getYear(new Date());
    const allowanceBreakdown = await AllowanceService.getAllowanceBreakdown(user.id, currentYear);

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="mb-8">
                <Link href="/admin/users" className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold mb-4 transition-colors">
                    <ChevronLeft className="size-4" />
                    Back to Users
                </Link>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Edit Account</h1>
                        <p className="text-slate-500 mt-1 text-lg font-medium">{user.name} {user.lastname}</p>
                    </div>

                </div>
            </div>

            <Tabs defaultValue="account" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                    <TabsTrigger value="allowance">Allowance</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                </TabsList>
                <TabsContent value="account">
                    <Card className="ring-1 ring-slate-200 shadow-xl shadow-slate-200/50">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/30">
                            <CardTitle className="text-xl text-slate-800">Account Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <AdminUserForm
                                user={serializeData(user)}
                                departments={serializeData(departments)}
                                roles={roles}
                                areas={areas}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="projects">
                    <Card className="ring-1 ring-slate-200 shadow-xl shadow-slate-200/50">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/30">
                            <CardTitle className="text-xl text-slate-800">Project Assignments</CardTitle>
                            <p className="text-sm text-slate-600">
                                Assign this user to projects with specific roles and allocation percentages.
                            </p>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <ProjectAssignmentsForm
                                userId={user.id}
                                roles={roles}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="allowance">
                    <Card className="ring-1 ring-slate-200 shadow-xl shadow-slate-200/50">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/30">
                            <CardTitle className="text-xl text-slate-800">Allowance Management</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <AllowanceAdjustmentForm
                                userId={user.id}
                                initialBreakdown={serializeData(allowanceBreakdown)}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="schedule">
                    <Card className="ring-1 ring-slate-200 shadow-xl shadow-slate-200/50">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/30">
                            <CardTitle className="text-xl text-slate-800">Schedule Override</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <UserScheduleForm userId={user.id} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
