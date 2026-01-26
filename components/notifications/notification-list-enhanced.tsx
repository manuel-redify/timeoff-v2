'use client'

import { useState, useEffect, useMemo } from 'react'
import { NotificationItem } from './notification-item'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Loader2, Bell, CheckCircle, Search, Filter, ChevronDown, 
  Calendar, X, RotateCcw, AlertCircle, CheckSquare 
} from 'lucide-react'
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
}

interface FilterState {
  status: 'all' | 'read' | 'unread'
  type: 'all' | string
  search: string
}

const notificationTypes = [
  { value: 'LEAVE_SUBMITTED', label: 'Leave Submitted', icon: '📝' },
  { value: 'LEAVE_APPROVED', label: 'Leave Approved', icon: '✅' },
  { value: 'LEAVE_REJECTED', label: 'Leave Rejected', icon: '❌' },
  { value: 'WELCOME', label: 'Welcome', icon: '🎉' }
]

export function NotificationListEnhanced({ 
  unreadOnly = false, 
  className,
  onNotificationRead,
  onAllNotificationsRead 
}: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    status: unreadOnly ? 'unread' : 'all',
    type: 'all',
    search: ''
  })
  
  const limit = 20

  // Filter notifications based on current filters
  const filteredNotifications = useMemo(() => {
    let filtered = Array.isArray(notifications) ? [...notifications] : []
    
    // Status filter
    if (filters.status === 'read') {
      filtered = filtered.filter(n => n.isRead)
    } else if (filters.status === 'unread') {
      filtered = filtered.filter(n => !n.isRead)
    }
    
    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(n => n.type === filters.type)
    }
    
    // Search filter
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchLower) ||
        n.message.toLowerCase().includes(searchLower)
      )
    }
    
    return filtered
  }, [notifications, filters])

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
      
      if (!data.notifications || !Array.isArray(data.notifications)) {
        throw new Error('Invalid response format from API')
      }
      
      if (reset) {
        setNotifications(data.notifications)
        setOffset(limit)
      } else {
        setNotifications(prev => [...(Array.isArray(prev) ? prev : []), ...data.notifications])
        setOffset(prev => prev + limit)
      }
      
      setHasMore(data.pagination.hasMore)
      setTotalCount(data.pagination.total)
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
      
      onAllNotificationsRead?.()
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    } finally {
      setLoading(false)
    }
  }

  const markAllFilteredAsRead = async () => {
    const unreadFilteredIds = filteredNotifications.filter(n => !n.isRead).map(n => n.id)
    if (unreadFilteredIds.length === 0) return

    try {
      setLoading(true)
      await Promise.all(
        unreadFilteredIds.map(id => fetch(`/api/notifications/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: true })
        }))
      )
      
      setNotifications(prev => 
        prev.map(n => unreadFilteredIds.includes(n.id) ? { ...n, isRead: true } : n)
      )
      
      onNotificationRead?.()
    } catch (err) {
      console.error('Failed to mark filtered notifications as read:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setFilters({
      status: unreadOnly ? 'unread' : 'all',
      type: 'all',
      search: ''
    })
  }

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    fetchNotifications(true)
  }, [])

  useEffect(() => {
    // Refetch when unreadOnly prop changes
    if (unreadOnly) {
      setFilters(prev => ({ ...prev, status: 'unread' }))
    } else {
      setFilters(prev => ({ ...prev, status: 'all' }))
    }
  }, [unreadOnly])

  const unreadCount = notifications.filter(n => !n.isRead).length
  const filteredUnreadCount = filteredNotifications.filter(n => !n.isRead).length

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Filters and Search Bar */}
      <div className="p-4 border-b bg-gray-50 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search notifications..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-9"
            />
          </div>
          
          {/* Status Filter */}
          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value as any)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3" />
                  All Status
                </div>
              </SelectItem>
              <SelectItem value="unread">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3 w-3" />
                  Unread Only
                </div>
              </SelectItem>
              <SelectItem value="read">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-3 w-3" />
                  Read Only
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          {/* Type Filter */}
          <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3" />
                  All Types
                </div>
              </SelectItem>
              {notificationTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <span>{type.icon}</span>
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Filter Summary and Actions */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="text-gray-500">
              {filteredNotifications.length} of {totalCount} notifications
            </span>
            {(filters.status !== 'all' || filters.type !== 'all' || filters.search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-6 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {filteredUnreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllFilteredAsRead}
                disabled={loading}
                className="h-6 px-2 text-xs"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Mark {filteredUnreadCount} as Read
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-hidden">
        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32">
            <Card className="w-full max-w-md">
              <CardContent className="text-center p-4">
                <div className="text-red-500 mb-2">
                  <AlertCircle className="h-8 w-8 mx-auto" />
                </div>
                <p className="text-sm text-red-600 mb-3">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNotifications(true)}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Bell className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">
                {filters.search || filters.status !== 'all' || filters.type !== 'all'
                  ? 'No notifications match your filters'
                  : unreadOnly 
                    ? 'No unread notifications' 
                    : 'No notifications yet'
                }
              </p>
              {(filters.search || filters.status !== 'all' || filters.type !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-3"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            {/* Mark all as read banner */}
            {unreadCount > 0 && filters.status === 'all' && !filters.search && filters.type === 'all' && (
              <div className="p-3 border-b bg-blue-50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="w-full justify-start text-xs"
                >
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Mark all {unreadCount} as read
                </Button>
              </div>
            )}
            
            {/* Notifications */}
            <div>
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  className={markingAsRead === notification.id ? 'opacity-50' : ''}
                />
              ))}
            </div>
            
            {/* Load More */}
            {hasMore && !filters.search && filters.type === 'all' && (
              <div className="p-4 border-t">
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
                  Load more notifications
                  <ChevronDown className="h-3 w-3 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}