'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { refreshNotificationBadge, updateNotificationCount, setNotificationCount, getNotificationState } from '@/lib/notification-badge-utils'
import { RefreshCw, Plus, Minus } from 'lucide-react'
import { useState } from 'react'

export function NotificationBadgeTest() {
  const [state, setState] = useState(getNotificationState())
  const [lastAction, setLastAction] = useState<string>('')

  const updateState = () => {
    setState(getNotificationState())
  }

  const handleRefresh = async () => {
    setLastAction('Refreshing from server...')
    try {
      await refreshNotificationBadge()
      setLastAction('Successfully refreshed from server')
    } catch (error) {
      setLastAction(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    updateState()
  }

  const handleIncrement = () => {
    updateNotificationCount(1)
    setLastAction('Incremented count by 1')
    updateState()
  }

  const handleDecrement = () => {
    updateNotificationCount(-1)
    setLastAction('Decremented count by 1')
    updateState()
  }

  const handleZero = () => {
    setNotificationCount(0)
    setLastAction('Set count to 0')
    updateState()
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Notification Badge Test</CardTitle>
        <CardDescription>
          Test the notification badge update functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Current State:</h4>
          <div className="text-xs space-y-1">
            <p>Unread Count: <span className="font-mono bg-white px-2 py-1 rounded">{state.unreadCount}</span></p>
            <p>Loading: <span className="font-mono bg-white px-2 py-1 rounded">{state.loading ? 'Yes' : 'No'}</span></p>
            <p>Error: <span className="font-mono bg-white px-2 py-1 rounded">{state.error || 'None'}</span></p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Manual Controls:</h4>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={state.loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleIncrement}
              className="flex items-center gap-2"
            >
              <Plus className="h-3 w-3" />
              +1
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecrement}
              className="flex items-center gap-2"
            >
              <Minus className="h-3 w-3" />
              -1
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleZero}
              className="flex items-center gap-2"
            >
              0
            </Button>
          </div>
        </div>

        {lastAction && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Last Action:</strong> {lastAction}
            </p>
          </div>
        )}

        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>Tip:</strong> Look at the bell icon in the header to see badge updates in real-time.
            You can also call <code>refreshNotificationBadge()</code> from browser console.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}