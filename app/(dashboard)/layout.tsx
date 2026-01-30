import { MainNavigation } from '@/components/ui/MainNavigation';
import { isAdmin, isAnySupervisor } from '@/lib/rbac';
import { Toaster } from '@/components/ui/sonner';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const adminStatus = await isAdmin();
    const supervisorStatus = await isAnySupervisor();

return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
            <MainNavigation isAdmin={adminStatus} isSupervisor={supervisorStatus} />
            <main className="flex-1 p-6 container mx-auto">
                {children}
            </main>
            <Toaster />
        </div>
    );
}
