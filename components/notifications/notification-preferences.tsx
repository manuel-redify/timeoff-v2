'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Loader2, Settings, RotateCcw, Mail, Bell, BellOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotificationPreference {
  id: string
  type: 'LEAVE_SUBMITTED' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'WELCOME'
  channel: 'EMAIL' | 'IN_APP' | 'BOTH' | 'NONE'
}

interface NotificationPreferencesProps {
  className?: string
}

const notificationTypeInfo = {
  LEAVE_SUBMITTED: {
    title: 'Leave Request Submitted',
    description: 'When your leave request is submitted for approval',
    icon: <Bell className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800'
  },
  LEAVE_APPROVED: {
    title: 'Leave Request Approved',
    description: 'When your leave request is approved by your manager',
    icon: <Mail className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800'
  },
  LEAVE_REJECTED: {
    title: 'Leave Request Rejected',
    description: 'When your leave request is rejected by your manager',
    icon: <BellOff className="h-4 w-4" />,
    color: 'bg-red-100 text-red-800'
  },
  WELCOME: {
    title: 'Welcome Messages',
    description: 'System welcome messages and account updates',
    icon: <Settings className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-800'
  }
}

const channelOptions = [
  { value: 'EMAIL', label: 'Email Only', icon: <Mail className="h-4 w-4" /> },
  { value: 'IN_APP', label: 'In-App Only', icon: <Bell className="h-4 w-4" /> },
  { value: 'BOTH', label: 'Both', icon: <Mail className="h-4 w-4 mr-1" /> },
  { value: 'NONE', label: 'None', icon: <BellOff className="h-4 w-4" /> }
] as const

export function NotificationPreferences({ className }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/user/preferences/notifications')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setPreferences(data.data || [])
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error)
      setError(error instanceof Error ? error.message : 'Failed to load preferences')
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      const response = await fetch('/api/user/preferences/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setSuccess(data.message || 'Preferences saved successfully')
      setHasChanges(false)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
      
    } catch (error) {
      console.error('Failed to save notification preferences:', error)
      setError(error instanceof Error ? error.message : 'Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const updatePreference = (type: string, channel: string) => {
    setPreferences(prev => 
      prev.map(pref => 
        pref.type === type ? { ...pref, channel: channel as any } : pref
      )
    )
    setHasChanges(true)
    setError(null)
    setSuccess(null)
  }

  const resetToDefaults = () => {
    const defaultPreferences: NotificationPreference[] = [
      { id: '', type: 'LEAVE_SUBMITTED', channel: 'BOTH' },
      { id: '', type: 'LEAVE_APPROVED', channel: 'BOTH' },
      { id: '', type: 'LEAVE_REJECTED', channel: 'BOTH' },
      { id: '', type: 'WELCOME', channel: 'EMAIL' }
    ]
    
    setPreferences(defaultPreferences)
    setHasChanges(true)
  }

  useEffect(() => {
    fetchPreferences()
  }, [])

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefaults}
                disabled={saving}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset to Defaults
              </Button>
            )}
            
            <Button
              onClick={savePreferences}
              disabled={saving || !hasChanges}
              size="sm"
            >
              {saving ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPreferences}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-4">
              Configure how you want to receive different types of notifications. You can choose to receive notifications via email, in-app, both, or none.
            </div>
            
            <div className="space-y-4">
              {Object.entries(notificationTypeInfo).map(([type, info]) => {
                const preference = preferences.find(p => p.type === type)
                const currentChannel = preference?.channel || 'BOTH'
                
                return (
                  <div key={type} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", info.color)}>
                          {info.icon}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{info.title}</h4>
                          <p className="text-sm text-gray-600">{info.description}</p>
                        </div>
                      </div>
                      
                      <Badge variant="outline" className="text-xs">
                        {type.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Delivery Method</span>
                      
                      <div className="flex gap-2">
                        {channelOptions.map(option => (
                          <Button
                            key={option.value}
                            variant={currentChannel === option.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => updatePreference(type, option.value)}
                            className="flex items-center gap-1"
                          >
                            {option.icon}
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {hasChanges && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  You have unsaved changes. Click "Save Changes" to update your notification preferences.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
