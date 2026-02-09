'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Bell, BellDot, BellOff, Loader2, X } from 'lucide-react'
import { NotificationList } from './notification-list'
import { useState, useEffect } from 'react'
import { useNotificationBadge } from '@/hooks/use-notification-badge'
import { Button } from '@/components/ui/button'

interface NotificationDrawerProps {
  className?: string
}

export function NotificationDrawer({ className }: NotificationDrawerProps) {
  const [open, setOpen] = useState(false)
  const { 
    unreadCount, 
    loading, 
    error, 
    refreshBadge, 
    updateCountOptimistic, 
    setCountExact 
  } = useNotificationBadge()

  // Refresh count when drawer closes (user has viewed notifications)
  useEffect(() => {
    if (!open && unreadCount > 0) {
      // Small delay to allow mark-as-read operations to complete
      const timeout = setTimeout(() => {
        refreshBadge()
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [open, refreshBadge, unreadCount])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="relative flex items-center justify-center p-2 rounded-full transition-all duration-150 ease-in-out hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
          onClick={() => {
            if (error) {
              refreshBadge()
            }
          }}
        >
          <div className="relative">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
            ) : unreadCount > 0 ? (
              <BellDot className="h-5 w-5 text-neutral-700" />
            ) : (
              <Bell className="h-5 w-5 text-neutral-400" />
            )}
            
            {unreadCount > 0 && (
              <span 
                className={`absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full text-xs font-medium flex items-center justify-center bg-[#e2f337] text-black transition-all ${
                  error ? 'animate-pulse' : ''
                }`}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            
            {error && !loading && unreadCount === 0 && (
              <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-orange-500" />
            )}
          </div>
        </button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="border-b px-4 py-4 space-y-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-semibold">Notifications</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          
          {error && (
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-orange-600">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refreshBadge()}
                className="text-xs h-6 px-2 text-orange-600 hover:text-orange-700"
              >
                Retry
              </Button>
            </div>
          )}
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden">
          <NotificationList 
            unreadOnly={true}
            onNotificationRead={() => {
              // Optimistically update count when notifications are marked as read
              updateCountOptimistic(-1)
            }}
            onAllNotificationsRead={() => {
              // Optimistically clear count when all are marked as read
              setCountExact(0)
            }}
            emptyStateComponent={
              <div className="flex flex-col items-center justify-center h-full py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                  <BellOff className="h-8 w-8 text-neutral-400" />
                </div>
                <h3 className="text-sm font-medium text-neutral-900 mb-1">No notifications</h3>
                <p className="text-sm text-neutral-400 text-center">
                  You're all caught up! Check back later for updates.
                </p>
              </div>
            }
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
