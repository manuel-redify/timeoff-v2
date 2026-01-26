import { cn } from '@/lib/utils'
import { Bell, CheckCircle, XCircle, AlertCircle, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (id: string) => void
  className?: string
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'LEAVE_SUBMITTED':
      return <AlertCircle className="h-4 w-4 text-blue-500" />
    case 'LEAVE_APPROVED':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'LEAVE_REJECTED':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'WELCOME':
      return <Mail className="h-4 w-4 text-purple-500" />
    default:
      return <Bell className="h-4 w-4 text-gray-500" />
  }
}

const getNotificationVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (type) {
    case 'LEAVE_SUBMITTED':
      return 'secondary'
    case 'LEAVE_APPROVED':
      return 'default'
    case 'LEAVE_REJECTED':
      return 'destructive'
    case 'WELCOME':
      return 'outline'
    default:
      return 'secondary'
  }
}

export function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  className 
}: NotificationItemProps) {
  const isRead = notification.isRead

  return (
    <div
      className={cn(
        'p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors',
        !isRead && 'bg-blue-50/50',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={getNotificationVariant(notification.type)} className="text-xs">
              {notification.type.replace('_', ' ')}
            </Badge>
            {!isRead && (
              <span className="h-2 w-2 rounded-full bg-blue-500" />
            )}
          </div>
          
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {notification.title}
          </h4>
          
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {new Date(notification.createdAt).toLocaleDateString()} • {' '}
              {new Date(notification.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            
            {!isRead && onMarkAsRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkAsRead(notification.id)}
                className="text-xs h-6 px-2"
              >
                Mark as read
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}