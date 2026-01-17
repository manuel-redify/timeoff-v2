import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ProfileForm from "./profile-form";
import { serializeData } from "@/lib/serialization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCountryName } from "@/lib/countries";

export default async function ProfilePage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: {
            department: true,
            company: true,
            defaultRole: true,
        }
    });

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">User Not Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Your user record has not been synchronized with our database yet. This usually takes a few seconds after your first login.</p>
                        <p className="mt-4 text-sm text-slate-500">If this persists, please contact your administrator.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 max-w-2xl px-4">
            <h1 className="text-3xl font-bold mb-8 text-slate-900 tracking-tight">Your Profile</h1>

            <div className="grid gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ProfileForm user={serializeData(user)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Employment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Email Address</p>
                                <p className="text-lg font-medium text-slate-900">{user.email}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Department</p>
                                <p className="text-lg font-medium text-slate-900">{user.department?.name ?? 'Not assigned'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Country</p>
                                <p className="text-lg font-medium text-slate-900">{user.country ? getCountryName(user.country) : 'Not specified'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Contract Type</p>
                                <p className="text-lg font-medium text-slate-900">{user.contractType}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Role</p>
                                <p className="text-lg font-medium text-slate-900">{user.defaultRole?.name ?? 'General'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Start Date</p>
                                <p className="text-lg font-medium text-slate-900">{new Date(user.startDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Account Status</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`size-2 rounded-full ${user.activated ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    <p className="text-lg font-medium text-slate-900">{user.activated ? 'Active' : 'Deactivated'}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
