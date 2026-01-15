import { isAdmin } from "@/lib/rbac";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import AdminUserForm from "./admin-user-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default async function AdminEditUserPage({ params }: { params: Promise<{ id: string }> }) {
    if (!await isAdmin()) redirect("/");

    const { id } = await params;

    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            department: true,
            defaultRole: true,
        }
    });

    if (!user || user.deletedAt) notFound();

    const departments = await prisma.department.findMany({
        where: { deletedAt: null }
    });

    const roles = await prisma.role.findMany();

    return (
        <div className="container mx-auto py-10 px-4 max-w-4xl">
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
                    <div className="text-sm text-slate-400 font-medium">
                        ID: <code className="bg-slate-50 px-1 rounded">{user.id.slice(0, 8)}...</code>
                    </div>
                </div>
            </div>

            <Card className="ring-1 ring-slate-200 shadow-xl shadow-slate-200/50">
                <CardHeader className="border-b border-slate-100 bg-slate-50/30">
                    <CardTitle className="text-xl text-slate-800">Account Configuration</CardTitle>
                </CardHeader>
                <CardContent className="pt-8">
                    <AdminUserForm
                        user={user}
                        departments={departments}
                        roles={roles}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
