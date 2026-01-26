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
    color: 'bg-blue-100 text-blue-800',
    recommended: 'BOTH'
  },
  LEAVE_APPROVED: {
    title: 'Leave Request Approved',
    description: 'When your leave request is approved by your manager',
    icon: <Mail className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800',
    recommended: 'EMAIL'
  },
  LEAVE_REJECTED: {
    title: 'Leave Request Rejected',
    description: 'When your leave request is rejected by your manager',
    icon: <BellOff className="h-4 w-4" />,
    color: 'bg-red-100 text-red-800',
    recommended: 'EMAIL'
  },
  WELCOME: {
    title: 'Welcome Messages',
    description: 'System welcome messages and account updates',
    icon: <Settings className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-800',
    recommended: 'EMAIL'
  }
}

export function NotificationPreferencesCompact({ className }: NotificationPreferencesProps) {
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

  const updateEmailToggle = (type: string, enabled: boolean) => {
    const pref = preferences.find(p => p.type === type)
    if (!pref) return
    
    let newChannel: 'EMAIL' | 'IN_APP' | 'BOTH' | 'NONE'
    
    if (enabled) {
      // Enable email
      if (pref.channel === 'NONE') {
        newChannel = 'EMAIL'
      } else if (pref.channel === 'IN_APP') {
        newChannel = 'BOTH'
      } else {
        newChannel = pref.channel
      }
    } else {
      // Disable email
      if (pref.channel === 'EMAIL') {
        newChannel = 'IN_APP'
      } else if (pref.channel === 'BOTH') {
        newChannel = 'IN_APP'
      } else {
        newChannel = pref.channel
      }
    }
    
    updatePreference(type, newChannel)
  }

  const updateInAppToggle = (type: string, enabled: boolean) => {
    const pref = preferences.find(p => p.type === type)
    if (!pref) return
    
    let newChannel: 'EMAIL' | 'IN_APP' | 'BOTH' | 'NONE'
    
    if (enabled) {
      // Enable in-app
      if (pref.channel === 'NONE') {
        newChannel = 'IN_APP'
      } else if (pref.channel === 'EMAIL') {
        newChannel = 'BOTH'
      } else {
        newChannel = pref.channel
      }
    } else {
      // Disable in-app
      if (pref.channel === 'IN_APP') {
        newChannel = 'EMAIL'
      } else if (pref.channel === 'BOTH') {
        newChannel = 'EMAIL'
      } else {
        newChannel = pref.channel
      }
    }
    
    updatePreference(type, newChannel)
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
      { id: '', type: 'LEAVE_APPROVED', channel: 'EMAIL' },
      { id: '', type: 'LEAVE_REJECTED', channel: 'EMAIL' },
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
            <div className="text-sm text-gray-600 mb-6">
              Choose how you want to receive different types of notifications.
            </div>
            
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-600 border-b pb-2">
                <div className="col-span-6">Notification Type</div>
                <div className="col-span-3 text-center">Email</div>
                <div className="col-span-3 text-center">In-App</div>
              </div>
              
              {Object.entries(notificationTypeInfo).map(([type, info]) => {
                const preference = preferences.find(p => p.type === type)
                const currentChannel = preference?.channel || 'BOTH'
                
                const hasEmail = currentChannel === 'EMAIL' || currentChannel === 'BOTH'
                const hasInApp = currentChannel === 'IN_APP' || currentChannel === 'BOTH'
                const isRecommended = currentChannel === info.recommended
                
                return (
                  <div key={type} className={cn(
                    "grid grid-cols-12 gap-4 items-center py-3 border-b last:border-b-0",
                    hasChanges && "bg-blue-50/50"
                  )}>
                    <div className="col-span-6">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-1.5 rounded", info.color)}>
                          {info.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900 text-sm">{info.title}</h4>
                            {isRecommended && (
                              <Badge variant="secondary" className="text-xs">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">{info.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-3 flex justify-center">
                      <Switch
                        checked={hasEmail}
                        onCheckedChange={(checked) => updateEmailToggle(type, checked)}
                        disabled={saving}
                      />
                    </div>
                    
                    <div className="col-span-3 flex justify-center">
                      <Switch
                        checked={hasInApp}
                        onCheckedChange={(checked) => updateInAppToggle(type, checked)}
                        disabled={saving}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-6 text-xs text-gray-500 space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                <span>Email notifications are sent to your registered email address</span>
              </div>
              <div className="flex items-center gap-2">
                <Bell className="h-3 w-3" />
                <span>In-app notifications appear in the notification center</span>
              </div>
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