'use client'

import { useState, useEffect } from 'react'
import { NotificationItem } from './notification-item'
import { Button } from '@/components/ui/button'
import { Loader2, Bell, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  link?: string | null
  isRead: boolean
  createdAt: Date
}

interface NotificationListProps {
  unreadOnly?: boolean
  className?: string
  onNotificationRead?: () => void
  onAllNotificationsRead?: () => void
  emptyStateComponent?: React.ReactNode
}

export function NotificationList({ 
  unreadOnly = false, 
  className,
  onNotificationRead,
  onAllNotificationsRead,
  emptyStateComponent
}: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null)

  const limit = 20

  const fetchNotifications = async (reset = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const currentOffset = reset ? 0 : offset
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: currentOffset.toString(),
        ...(unreadOnly && { unreadOnly: 'true' })
      })

      const response = await fetch(`/api/notifications?${params}`)
      if (!response.ok) throw new Error('Failed to fetch notifications')
      
const responseData = await response.json()
      const data = responseData.data || responseData
      
      if (reset) {
        setNotifications(data.notifications)
        setOffset(limit)
      } else {
        setNotifications(prev => [...prev, ...data.notifications])
        setOffset(prev => prev + limit)
      }
      
      setHasMore(data.pagination.hasMore)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      setMarkingAsRead(id)
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      })
      
      if (!response.ok) throw new Error('Failed to mark as read')
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      )
      
      // Call the callback to update badge count
      onNotificationRead?.()
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    } finally {
      setMarkingAsRead(null)
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
    if (unreadIds.length === 0) return

    try {
      setLoading(true)
      await Promise.all(
        unreadIds.map(id => fetch(`/api/notifications/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: true })
        }))
      )
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      )
      
      // Call the callback to clear badge count
      onAllNotificationsRead?.()
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications(true)
  }, [unreadOnly])

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchNotifications(true)}
        >
          Retry
        </Button>
      </div>
    )
  }

  if (notifications.length === 0) {
    if (emptyStateComponent) {
      return <>{emptyStateComponent}</>
    }
    return (
      <div className="p-8 text-center">
        <Bell className="h-8 w-8 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600">
          {unreadOnly ? 'No unread notifications' : 'No notifications yet'}
        </p>
      </div>
    )
  }

  return (
    <div className={cn('max-h-96 overflow-y-auto', className)}>
      {notifications.some(n => !n.isRead) && (
        <div className="p-3 border-b bg-gray-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="w-full justify-start text-xs"
          >
            <CheckCircle className="h-3 w-3 mr-2" />
            Mark all as read
          </Button>
        </div>
      )}
      
      <div>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={markAsRead}
            className={markingAsRead === notification.id ? 'opacity-50' : ''}
          />
        ))}
      </div>
      
      {hasMore && (
        <div className="p-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchNotifications(false)}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
            ) : null}
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}