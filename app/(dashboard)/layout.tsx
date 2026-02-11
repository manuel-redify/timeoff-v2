import { MainNavigation } from '@/components/ui/MainNavigation';
import { MainNavigationSkeleton } from '@/components/ui/main-navigation-skeleton';
import { isAdmin, isAnySupervisor, getPendingApprovalsCount } from '@/lib/rbac';
import { Toaster } from '@/components/ui/sonner';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { headers } from 'next/headers';

// Component that fetches data and renders navigation
async function NavigationWithData() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const adminStatus = await isAdmin();
  const supervisorStatus = await isAnySupervisor();
  const pendingApprovalsCount = await getPendingApprovalsCount();

  return (
    <MainNavigation 
      isAdmin={adminStatus} 
      isSupervisor={supervisorStatus} 
      user={session.user}
      pendingApprovalsCount={pendingApprovalsCount}
    />
  );
}

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

    // Check if current route is settings to apply full width
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '';
    const isSettingsRoute = pathname.startsWith('/settings');

return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
            <Suspense fallback={<MainNavigationSkeleton />}>
                <NavigationWithData />
            </Suspense>
            <main className={`flex-1 p-6 ${isSettingsRoute ? '' : 'container mx-auto'}`}>
                {children}
            </main>
            <Toaster />
        </div>
    );
}
