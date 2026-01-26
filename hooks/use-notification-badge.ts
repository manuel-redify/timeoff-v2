'use client'

import { useState, useEffect, useCallback } from 'react'

interface NotificationBadgeState {
  unreadCount: number
  loading: boolean
  error: string | null
}

interface NotificationBadgeHookReturn extends NotificationBadgeState {
  refreshBadge: () => void
  updateCountOptimistic: (delta: number) => void
  setCountExact: (count: number) => void
}

// Global state for notification count (singleton pattern)
let globalState: NotificationBadgeState = {
  unreadCount: 0,
  loading: false,
  error: null
}

let listeners: Set<(state: NotificationBadgeState) => void> = new Set()

// Cache control
let lastFetch = 0
const CACHE_DURATION = 30 * 1000 // 30 seconds

const updateGlobalState = (updates: Partial<NotificationBadgeState>) => {
  globalState = { ...globalState, ...updates }
  listeners.forEach(listener => listener(globalState))
}

const fetchUnreadCount = async (forceRefresh = false): Promise<number> => {
  const now = Date.now()
  
  // Skip if we recently fetched and not forcing refresh
  if (!forceRefresh && now - lastFetch < CACHE_DURATION) {
    return globalState.unreadCount
  }

  try {
    updateGlobalState({ loading: true, error: null })
    
    const response = await fetch('/api/notifications?limit=1&unreadOnly=true', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    const newCount = data.pagination.total
    
    lastFetch = now
    updateGlobalState({ unreadCount: newCount, loading: false, error: null })
    
    return newCount
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notifications'
    updateGlobalState({ loading: false, error: errorMessage })
    
    // Retry after 1 minute on error
    setTimeout(() => {
      fetchUnreadCount(true)
    }, 60 * 1000)
    
    throw error
  }
}

// Set up periodic polling
if (typeof window !== 'undefined') {
  setInterval(() => {
    fetchUnreadCount(true)
  }, 5 * 60 * 1000) // 5 minutes
}

export function useNotificationBadge(): NotificationBadgeHookReturn {
  const [state, setState] = useState<NotificationBadgeState>(globalState)

  // Subscribe to global state changes
  useEffect(() => {
    const listener = (newState: NotificationBadgeState) => {
      setState(newState)
    }
    
    listeners.add(listener)
    
    // Initial fetch if not already loaded
    if (lastFetch === 0) {
      fetchUnreadCount().catch(() => {
        // Ignore initial fetch errors
      })
    }
    
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const refreshBadge = useCallback(() => {
    return fetchUnreadCount(true)
  }, [])

  const updateCountOptimistic = useCallback((delta: number) => {
    const newCount = Math.max(0, globalState.unreadCount + delta)
    updateGlobalState({ unreadCount: newCount })
  }, [])

  const setCountExact = useCallback((count: number) => {
    updateGlobalState({ unreadCount: Math.max(0, count) })
  }, [])

  return {
    ...state,
    refreshBadge,
    updateCountOptimistic,
    setCountExact
  }
}

// Export utility functions for external usage
export const notificationBadgeUtils = {
  refresh: () => fetchUnreadCount(true),
  updateOptimistic: (delta: number) => updateGlobalState({ 
    unreadCount: Math.max(0, globalState.unreadCount + delta) 
  }),
  setExact: (count: number) => updateGlobalState({ 
    unreadCount: Math.max(0, count) 
  }),
  getState: () => ({ ...globalState })
}