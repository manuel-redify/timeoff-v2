import { MainNavigation } from '@/components/ui/MainNavigation';
import { isAdmin, isAnySupervisor } from '@/lib/rbac';
import { Toaster } from '@/components/ui/sonner';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Explicit authentication check for redundancy
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login');
    }

    const adminStatus = await isAdmin();
    const supervisorStatus = await isAnySupervisor();

return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
            <MainNavigation isAdmin={adminStatus} isSupervisor={supervisorStatus} user={session.user} />
            <main className="flex-1 p-6 container mx-auto">
                {children}
            </main>
            <Toaster />
        </div>
    );
}
