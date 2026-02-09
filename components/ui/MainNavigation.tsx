'use client';

import Link from 'next/link';
import Image from 'next/image';
import { User, Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { signOutAction } from '@/lib/actions/auth';
import { ProtectedLink } from '@/components/auth/protected-link';

export function MainNavigation({ isAdmin, isSupervisor }: { isAdmin: boolean, isSupervisor: boolean }) {
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname === path 
            ? "bg-[#f2f3f5] text-neutral-900 font-bold" 
            : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900";
    };

    return (
        <nav
            className="sticky top-0 z-50 w-full border-b border-border bg-canvas px-4 py-3 flex items-center justify-between"
            role="navigation"
            aria-label="Main navigation"
        >
            <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center">
                    <Image
                        src="/assets/logo.svg"
                        alt="TimeOff"
                        width={120}
                        height={32}
                        priority
                    />
                </Link>
                <ProtectedLink
                    href="/requests/new"
                    className="flex items-center justify-center bg-[#e2f337] text-black hover:bg-[#d4e62e] active:scale-95 transition-all duration-150 ease-in-out rounded-full md:px-6 md:py-2 w-10 h-10 md:w-auto md:h-auto"
                    aria-label="New Leave Request"
                >
                    <Plus className="w-5 h-5 md:mr-2" />
                    <span className="hidden md:inline font-medium">New Leave</span>
                </ProtectedLink>
                <div className="flex items-center gap-4">
<ProtectedLink href="/" className={`flex items-center gap-2 text-sm rounded-full px-3 py-1.5 transition-all duration-150 ease-in-out ${isActive('/')}`}>
                        Dashboard
                    </ProtectedLink>
                    <ProtectedLink href="/requests/my" className={`flex items-center gap-2 text-sm rounded-full px-3 py-1.5 transition-all duration-150 ease-in-out ${isActive('/requests/my')}`}>
                        My Requests
                    </ProtectedLink>
                    <ProtectedLink href="/team/allowance" className={`flex items-center gap-2 text-sm rounded-full px-3 py-1.5 transition-all duration-150 ease-in-out ${isActive('/team/allowance')}`}>
                        Team
                    </ProtectedLink>
{(isSupervisor || isAdmin) && (
                        <>
                            <ProtectedLink href="/approvals" className={`flex items-center gap-2 text-sm rounded-full px-3 py-1.5 transition-all duration-150 ease-in-out ${isActive('/approvals')}`}>
                                Approvals
                            </ProtectedLink>
                            <ProtectedLink href="/settings/delegations" className={`flex items-center gap-2 text-sm rounded-full px-3 py-1.5 transition-all duration-150 ease-in-out ${pathname?.startsWith('/settings') ? "bg-[#f2f3f5] text-neutral-900 font-bold" : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"}`}>
                                Settings
                            </ProtectedLink>
                        </>
                    )}
                    {isAdmin && (
                        <ProtectedLink href="/admin/users" className={`flex items-center gap-2 text-sm rounded-full px-3 py-1.5 transition-all duration-150 ease-in-out ${isActive('/admin/users')}`}>
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
                        className="flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-900 rounded-full px-3 py-1.5 transition-all duration-150 ease-in-out"
                    >
                        Sign Out
                    </button>
                </form>
            </div>
        </nav>
    );
}
