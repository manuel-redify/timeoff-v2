import { MainNavigation } from '@/components/shared/MainNavigation';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
            <MainNavigation />
            <main className="flex-1 p-6 container mx-auto">
                {children}
            </main>
        </div>
    );
}
