'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Plus, User, Settings, Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { NotificationDrawer } from '@/components/notifications/notification-drawer';
import { signOut } from 'next-auth/react';
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
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname === path
      ? 'bg-[#f2f3f5] text-neutral-900 font-bold'
      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900';
  };

  const isInactive = (path: string) => {
    return pathname !== path
      ? 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900'
      : 'bg-[#f2f3f5] text-neutral-900 font-bold';
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
        "sticky z-50 w-full border-b border-border bg-canvas px-4 py-3 transition-transform duration-300 ease-in-out top-0",
        isHidden ? "-translate-y-full" : "translate-y-0"
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-[90rem] mx-auto flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.svg"
            alt="TimeOff"
            width={100}
            height={32}
            priority
            style={{ maxWidth: '100px' }}
          />
        </Link>
        <div className="hidden md:flex items-center gap-4">
          <ProtectedLink
            href="/"
            className={`flex items-center gap-2 text-sm rounded-sm px-3 py-1.5 transition-all duration-150 ease-in-out ${isActive('/')}`}
          >
            Dashboard
          </ProtectedLink>
          <ProtectedLink
            href="/calendar"
            className={`flex items-center gap-2 text-sm rounded-sm px-3 py-1.5 transition-all duration-150 ease-in-out ${isActive('/calendar')}`}
          >
            Calendar
          </ProtectedLink>
          {isAdmin && (
            <ProtectedLink
              href="/admin/users"
              className={`flex items-center gap-2 text-sm rounded-sm px-3 py-1.5 transition-all duration-150 ease-in-out ${isActive('/admin/users')}`}
            >
              Users
            </ProtectedLink>
          )}
          {(isAdmin || isSupervisor || pendingApprovalsCount > 0) && (
            <ProtectedLink
              href="/approvals"
              className={`flex items-center gap-2 text-sm rounded-sm px-3 py-1.5 transition-all duration-150 ease-in-out ${isActive('/approvals')}`}
            >
              Approvals
              {pendingApprovalsCount > 0 && (
                <span className="ml-1 bg-[#e2f337] text-black text-xs font-medium rounded-full min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center">
                  {pendingApprovalsCount > 99 ? '99+' : pendingApprovalsCount}
                </span>
              )}
            </ProtectedLink>
          )}
        </div>
        
        
      </div>
      <div className="flex items-center gap-2">
        {/* Mobile: New Leave, Notification Bell, Burger Menu */}
        <div className="md:hidden flex items-center gap-2">
          <ProtectedLink
            href="/requests/new"
            className="flex items-center justify-center w-10 h-10 rounded-sm bg-[#e2f337] text-black hover:bg-[#d4e62e] active:scale-95 transition-all duration-150 ease-in-out"
            aria-label="New Leave Request"
          >
            <Plus className="w-5 h-5" />
          </ProtectedLink>
          <NotificationDrawer />
          
          {/* Mobile Burger Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="flex items-center justify-center p-2 rounded-full transition-all duration-150 ease-in-out hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-neutral-600" />
              </button>
            </SheetTrigger>
            
            <SheetContent side="left" className="w-full sm:max-w-md p-0 flex flex-col" showCloseButton={false}>
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              {/* User Profile Section */}
              <div className="border-b border-neutral-200 p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
                    {user?.image && (
                      <AvatarImage src={user.image} alt={fullName} />
                    )}
                    <AvatarFallback className="bg-neutral-100 text-neutral-900 text-base font-medium">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">{fullName}</p>
                    {user?.email && (
                      <p className="text-xs text-neutral-500">{user.email}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center p-1 rounded-full transition-all duration-150 ease-in-out hover:bg-neutral-100"
                    aria-label="Close menu"
                  >
                    <X className="w-4 h-4 text-neutral-400" />
                  </button>
                </div>
              </div>
              
              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-1">
                  <ProtectedLink
                    href="/"
                    className={`flex items-center gap-3 w-full text-sm rounded-sm px-3 py-3 transition-all duration-150 ease-in-out ${isActive('/')}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </ProtectedLink>
                  
                  <ProtectedLink
                    href="/calendar"
                    className={`flex items-center gap-3 w-full text-sm rounded-sm px-3 py-3 transition-all duration-150 ease-in-out ${isActive('/calendar')}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Calendar
                  </ProtectedLink>
                  
                  {(isAdmin || isSupervisor || pendingApprovalsCount > 0) && (
                    <ProtectedLink
                      href="/approvals"
                      className={`flex items-center gap-3 w-full text-sm rounded-sm px-3 py-3 transition-all duration-150 ease-in-out ${isActive('/approvals')}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Approvals
                      {pendingApprovalsCount > 0 && (
                        <span className="ml-auto bg-[#e2f337] text-black text-xs font-medium rounded-full min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center">
                          {pendingApprovalsCount > 99 ? '99+' : pendingApprovalsCount}
                        </span>
                      )}
                    </ProtectedLink>
                  )}
                </div>
                
                {/* App Settings (Admin Only) */}
                {isAdmin && (
                  <div className="border-t border-neutral-200 p-4 space-y-1">
                    <ProtectedLink
                      href="/admin/users"
                      className={`flex items-center gap-3 w-full text-sm rounded-sm px-3 py-3 transition-all duration-150 ease-in-out ${isActive('/admin/users')}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Users
                    </ProtectedLink>
                    
                    <ProtectedLink
                      href="/settings/delegations"
                      className={`flex items-center gap-3 w-full text-sm rounded-sm px-3 py-3 transition-all duration-150 ease-in-out ${pathname?.startsWith('/settings') ? 'bg-[#f2f3f5] text-neutral-900 font-bold' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Settings
                    </ProtectedLink>
                  </div>
                )}
                
                {/* Account Actions */}
                <div className="border-t border-neutral-200 p-4 space-y-1">
                  <ProtectedLink
                    href="/profile"
                    className="flex items-center gap-3 w-full text-sm rounded-sm px-3 py-3 transition-all duration-150 ease-in-out text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </ProtectedLink>
                  
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex items-center gap-3 w-full text-sm rounded-sm px-3 py-3 transition-all duration-150 ease-in-out text-red-600 hover:bg-neutral-100 hover:text-red-700 text-left"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Desktop: New Leave, Notification Bell, Settings, User Avatar */}
        <div className="hidden md:flex items-center gap-2">
          <ProtectedLink
            href="/requests/new"
            className="flex items-center gap-2 text-sm rounded-sm px-3 py-1.5 bg-[#e2f337] text-black hover:bg-[#d4e62e] active:scale-95 transition-all duration-150 ease-in-out font-medium"
            aria-label="New Leave Request"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden md:inline">New Leave</span>
          </ProtectedLink>
          <NotificationDrawer />
          {isAdmin && (
            <ProtectedLink
              href="/settings/delegations"
              className="flex items-center justify-center w-10 h-10 rounded-sm text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition-all duration-150 ease-in-out"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </ProtectedLink>
          )}
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
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-red-600 focus:text-red-600"
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
      </div>
    </nav>
  );
}
