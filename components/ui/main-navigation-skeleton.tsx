import { Skeleton } from '@/components/ui/skeleton';

export function MainNavigationSkeleton() {
  return (
    <nav
      className="sticky top-0 z-50 w-full border-b border-border bg-canvas px-4 py-3 flex items-center justify-between"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center gap-6">
        {/* Logo placeholder */}
        <Skeleton className="h-8 w-[120px] rounded-md" />
        
        {/* New Leave button placeholder */}
        <Skeleton className="h-10 w-10 md:w-auto md:px-6 md:py-2 rounded-full" />
        
        {/* Navigation links - hidden on mobile */}
        <div className="hidden md:flex items-center gap-4">
          {/* Static links */}
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
          
          {/* Dynamic links (Approvals, Settings, Users) - show as skeletons */}
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-14 rounded-full" />
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Notification bell placeholder */}
        <Skeleton className="h-10 w-10 rounded-full" />
        
        {/* Avatar placeholder */}
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </nav>
  );
}
