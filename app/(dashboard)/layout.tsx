import { MainNavigationClientShell } from '@/components/ui/main-navigation-client-shell';
import { isAdmin, isAnySupervisor, getPendingApprovalsCount } from '@/lib/rbac';
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
    const [adminStatus, supervisorStatus, pendingApprovalsCount] = await Promise.all([
        isAdmin(),
        isAnySupervisor(),
        getPendingApprovalsCount(),
    ]);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
            <MainNavigationClientShell
                isAdmin={adminStatus}
                isSupervisor={supervisorStatus}
                user={session.user}
                pendingApprovalsCount={pendingApprovalsCount}
            />
            <main className="flex-1 p-6 overflow-auto container mx-auto">
                {children}
            </main>
            <Toaster />
        </div>
    );
}
