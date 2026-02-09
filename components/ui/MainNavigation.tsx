'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Plus, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NotificationDrawer } from '@/components/notifications/notification-drawer';
import { signOutAction } from '@/lib/actions/auth';
import { ProtectedLink } from '@/components/auth/protected-link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useScrollDirection } from '@/hooks/use-scroll-direction';

interface UserData {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  image?: string | null;
}

export function MainNavigation({
  isAdmin,
  isSupervisor,
  user,
  pendingApprovalsCount = 0,
}: {
  isAdmin: boolean;
  isSupervisor: boolean;
  user?: UserData;
  pendingApprovalsCount?: number;
}) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path
      ? 'bg-[#f2f3f5] text-neutral-900 font-bold'
      : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900';
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const fullName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email || 'User';

  const { isHidden } = useScrollDirection(100);

  return (
    <nav
      className={cn(
        "sticky z-50 w-full border-b border-border bg-canvas px-4 py-3 flex items-center justify-between",
        "transition-transform duration-300 ease-in-out",
        isHidden ? "-translate-y-full" : "translate-y-0",
        "top-0"
      )}
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
        <div className="hidden md:flex items-center gap-4">
          <ProtectedLink
            href="/"
            className={`flex items-center gap-2 text-sm rounded-full px-3 py-1.5 transition-all duration-150 ease-in-out ${isActive('/')}`}
          >
            Dashboard
          </ProtectedLink>
          <ProtectedLink
            href="/requests/my"
            className={`flex items-center gap-2 text-sm rounded-full px-3 py-1.5 transition-all duration-150 ease-in-out ${isActive('/requests/my')}`}
          >
            My Requests
          </ProtectedLink>
          <ProtectedLink
            href="/team/allowance"
            className={`flex items-center gap-2 text-sm rounded-full px-3 py-1.5 transition-all duration-150 ease-in-out ${isActive('/team/allowance')}`}
          >
            Team
          </ProtectedLink>
          <ProtectedLink
            href="/calendar"
            className={`flex items-center gap-2 text-sm rounded-full px-3 py-1.5 transition-all duration-150 ease-in-out ${isActive('/calendar')}`}
          >
            Calendar
          </ProtectedLink>
          {(isAdmin || isSupervisor || pendingApprovalsCount > 0) && (
            <ProtectedLink
              href="/approvals"
              className={`flex items-center gap-2 text-sm rounded-full px-3 py-1.5 transition-all duration-150 ease-in-out ${isActive('/approvals')}`}
            >
              Approvals
              {pendingApprovalsCount > 0 && (
                <span className="ml-1 bg-[#e2f337] text-black text-xs font-medium rounded-full min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center">
                  {pendingApprovalsCount > 99 ? '99+' : pendingApprovalsCount}
                </span>
              )}
            </ProtectedLink>
          )}
          {isAdmin && (
            <ProtectedLink
              href="/settings/delegations"
              className={`flex items-center gap-2 text-sm rounded-full px-3 py-1.5 transition-all duration-150 ease-in-out ${pathname?.startsWith('/settings') ? 'bg-[#f2f3f5] text-neutral-900 font-bold' : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900'}`}
            >
              Settings
            </ProtectedLink>
          )}
          {isAdmin && (
            <ProtectedLink
              href="/admin/users"
              className={`flex items-center gap-2 text-sm rounded-full px-3 py-1.5 transition-all duration-150 ease-in-out ${isActive('/admin/users')}`}
            >
              Users
            </ProtectedLink>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <NotificationDrawer />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative flex items-center justify-center rounded-full outline-none hover:ring-[0.0625rem] hover:ring-[#e2f337] transition-all duration-150 ease-in-out focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="User menu"
            >
              <Avatar className="size-8">
                {user?.image && (
                  <AvatarImage src={user.image} alt={fullName} />
                )}
                <AvatarFallback className="bg-neutral-100 text-neutral-900 text-sm font-medium">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{fullName}</p>
                {user?.email && (
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                const form = document.createElement('form');
                form.action = '/api/auth/signout';
                form.method = 'POST';
                document.body.appendChild(form);
                form.submit();
              }}
              className="text-red-600 focus:text-red-600"
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
