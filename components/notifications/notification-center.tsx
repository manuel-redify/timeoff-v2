'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, BellDot, Loader2 } from 'lucide-react'
import { NotificationListEnhanced } from './notification-list-enhanced'
import { useState, useEffect } from 'react'
import { useNotificationBadge } from '@/hooks/use-notification-badge'

interface NotificationCenterProps {
  className?: string
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [open, setOpen] = useState(false)
  const { 
    unreadCount, 
    loading, 
    error, 
    refreshBadge, 
    updateCountOptimistic, 
    setCountExact 
  } = useNotificationBadge()

  // Refresh count when popover closes (user has viewed notifications)
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={className}
          onClick={() => {
            // Refresh count when opening if there was an error
            if (error) {
              refreshBadge()
            }
          }}
        >
          <div className="relative">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : unreadCount > 0 ? (
              <BellDot className="h-5 w-5" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
            
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className={`absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center transition-all ${
                  error ? 'bg-orange-500 animate-pulse' : ''
                }`}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
            
            {error && !loading && (
              <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-orange-500" />
            )}
          </div>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {error && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refreshBadge()}
                className="text-xs h-6 px-2 text-orange-600 hover:text-orange-700"
              >
                Retry
              </Button>
            )}
          </div>
          
          {loading ? (
            <div className="flex items-center gap-2 mt-1">
              <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
              <div className="w-16 h-2 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : error ? (
            <p className="text-xs text-orange-600 mt-1">
              {error}
            </p>
          ) : (
            <p className="text-xs text-gray-600 mt-1">
              {unreadCount > 0 
                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up!'
              }
            </p>
          )}
        </div>
        
        <NotificationListEnhanced 
          unreadOnly={false}
          onNotificationRead={() => {
            // Optimistically update count when notifications are marked as read
            updateCountOptimistic(-1)
          }}
          onAllNotificationsRead={() => {
            // Optimistically clear count when all are marked as read
            setCountExact(0)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}