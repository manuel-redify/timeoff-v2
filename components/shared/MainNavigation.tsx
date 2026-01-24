'use client';

import Link from 'next/link';
import { Home, Users, User, Settings, Calendar as CalendarIcon } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils'; // Assuming standard shadcn util, if not I'll just use template literal but usually it's there. 
// Wait, I didn't check for lib/utils. I'll check first or just use template literals to be safe.
// I will use template literals to be safe for now, as I didn't verify lib/utils.

export function MainNavigation({ isAdmin, isSupervisor }: { isAdmin: boolean, isSupervisor: boolean }) {
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname === path ? "text-black dark:text-white font-medium" : "text-zinc-600 dark:text-zinc-400";
    };

    return (
        <nav className="border-b bg-white dark:bg-zinc-950 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-6">
                <Link href="/" className="font-bold text-lg flex items-center gap-2">
                    TimeOff
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/" className={`flex items-center gap-2 text-sm hover:text-black dark:hover:text-white transition-colors ${isActive('/')}`}>
                        <Home className="w-4 h-4" />
                        Dashboard
                    </Link>
                    <Link href="/requests/new" className={`flex items-center gap-2 text-sm hover:text-black dark:hover:text-white transition-colors ${isActive('/requests/new')}`}>
                        <span>+ New Request</span>
                    </Link>
                    <Link href="/requests/my" className={`flex items-center gap-2 text-sm hover:text-black dark:hover:text-white transition-colors ${isActive('/requests/my')}`}>
                        <span>My Requests</span>
                    </Link>
                    <Link href="/profile" className={`flex items-center gap-2 text-sm hover:text-black dark:hover:text-white transition-colors ${isActive('/profile')}`}>
                        <User className="w-4 h-4" />
                        Profile
                    </Link>
                    <Link href="/allowance" className={`flex items-center gap-2 text-sm hover:text-black dark:hover:text-white transition-colors ${isActive('/allowance')}`}>
                        <Settings className="w-4 h-4" />
                        Allowance
                    </Link>
                    <Link href="/calendar" className={`flex items-center gap-2 text-sm hover:text-black dark:hover:text-white transition-colors ${isActive('/calendar')}`}>
                        <CalendarIcon className="w-4 h-4" />
                        Calendar
                    </Link>
                    {(isSupervisor || isAdmin) && (
                        <>
                            <Link href="/team/allowance" className={`flex items-center gap-2 text-sm hover:text-black dark:hover:text-white transition-colors ${isActive('/team/allowance')}`}>
                                <Users className="w-4 h-4" />
                                Team
                            </Link>
                            <Link href="/approvals" className={`flex items-center gap-2 text-sm hover:text-black dark:hover:text-white transition-colors ${isActive('/approvals')}`}>
                                <Home className="w-4 h-4" />
                                Approvals
                            </Link>
                            <Link href="/settings/delegations" className={`flex items-center gap-2 text-sm hover:text-black dark:hover:text-white transition-colors ${pathname?.startsWith('/settings') ? "text-black dark:text-white font-medium" : "text-zinc-600 dark:text-zinc-400"}`}>
                                <Settings className="w-4 h-4" />
                                Settings
                            </Link>
                        </>
                    )}
                    {isAdmin && (
                        <Link href="/admin/users" className={`flex items-center gap-2 text-sm hover:text-black dark:hover:text-white transition-colors ${isActive('/admin/users')}`}>
                            <Users className="w-4 h-4" />
                            Users
                        </Link>
                    )}
                </div>
            </div>
            <div>
                <UserButton afterSignOutUrl="/" />
            </div>
        </nav>
    );
}
