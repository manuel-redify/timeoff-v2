'use client';

import Link from 'next/link';
import { Home, Users, User, Settings, Calendar as CalendarIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { signOutAction } from '@/lib/actions/auth';
import { ProtectedLink } from '@/components/auth/protected-link';

export function MainNavigation({ isAdmin, isSupervisor }: { isAdmin: boolean, isSupervisor: boolean }) {
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname === path ? "text-black dark:text-white font-medium" : "text-zinc-600 dark:text-zinc-400";
    };

    return (
        <nav
            className="sticky top-0 z-50 w-full border-b border-border bg-canvas px-4 py-3 flex items-center justify-between"
            role="navigation"
            aria-label="Main navigation"
        >
            <div className="flex items-center gap-6">
                <Link href="/" className="font-bold text-lg flex items-center gap-2">
                    TimeOff
                </Link>
                <div className="flex items-center gap-4">
<ProtectedLink href="/" className={`flex items-center gap-2 text-sm hover:text-black dark:hover:text-white transition-colors ${isActive('/')}`}>
                        <Home className="w-4 h-4" />
                        Dashboard
                    </ProtectedLink>
                    <ProtectedLink href="/requests/new" className={`flex items-center gap-2 text-sm hover:text-black dark:hover:text-white transition-colors ${isActive('/requests/new')}`}>
                        <span>+ New Request</span>
                    </ProtectedLink>
                    <ProtectedLink href="/requests/my" className={`flex items-center gap-2 text-sm hover:text-black dark:hover:text-white transition-colors ${isActive('/requests/my')}`}>
                        <span>My Requests</span>
                    </ProtectedLink>
                    <ProtectedLink href="/profile" className={`flex items-center gap-2 text-sm hover:text-black dark:hover:text-white transition-colors ${isActive('/profile')}`}>
                        <User className="w-4 h-4" />
                        Profile
                    </ProtectedLink>
                    <ProtectedLink href="/allowance" className={`flex items-center gap-2 text-sm hover:text-black dark:hover:text-white transition-colors ${isActive('/allowance')}`}>
                        <Settings className="w-4 h-4" />
                        Allowance
                    </ProtectedLink>
                    <ProtectedLink href="/calendar" className={`flex items-center gap-2 text-sm hover:text-black dark:hover:text-white transition-colors ${isActive('/calendar')}`}>
                        <CalendarIcon className="w-4 h-4" />
                        Calendar
                    </ProtectedLink>
{(isSupervisor || isAdmin) && (
                        <>
                            <ProtectedLink href="/team/allowance" className={`flex items-center gap-2 text-sm hover:text-black dark:hover:text-white transition-colors ${isActive('/team/allowance')}`}>
                                <Users className="w-4 h-4" />
                                Team
                            </ProtectedLink>
                            <ProtectedLink href="/approvals" className={`flex items-center gap-2 text-sm hover:text-black dark:hover:text-white transition-colors ${isActive('/approvals')}`}>
                                <Home className="w-4 h-4" />
                                Approvals
                            </ProtectedLink>
                            <ProtectedLink href="/settings/delegations" className={`flex items-center gap-2 text-sm hover:text-black dark:hover:text-white transition-colors ${pathname?.startsWith('/settings') ? "text-black dark:text-white font-medium" : "text-zinc-600 dark:text-zinc-400"}`}>
                                <Settings className="w-4 h-4" />
                                Settings
                            </ProtectedLink>
                        </>
                    )}
                    {isAdmin && (
                        <ProtectedLink href="/admin/users" className={`flex items-center gap-2 text-sm hover:text-black dark:hover:text-white transition-colors ${isActive('/admin/users')}`}>
                            <Users className="w-4 h-4" />
                            Users
                        </ProtectedLink>
                    )}
                </div>
            </div>
<div className="flex items-center gap-2">
                <NotificationCenter />
                <form action={signOutAction}>
                    <button
                        type="submit"
                        className="flex items-center gap-2 text-sm hover:text-black dark:hover:text-white transition-colors"
                    >
                        <User className="w-4 h-4" />
                        Sign Out
                    </button>
                </form>
            </div>
        </nav>
    );
}
