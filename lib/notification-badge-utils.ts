'use client'

import { notificationBadgeUtils } from '@/hooks/use-notification-badge'

/**
 * Manual notification badge update utilities.
 * These can be imported and used throughout the application to trigger notification updates.
 */

/**
 * Refresh the notification badge count from the server.
 * This bypasses the cache and forces a fresh API call.
 */
export const refreshNotificationBadge = (): Promise<number> => {
  return notificationBadgeUtils.refresh()
}

/**
 * Optimistically update the notification count by adding or subtracting.
 * Useful for immediate UI updates after user actions.
 * 
 * @param delta The change to apply (positive for increase, negative for decrease)
 */
export const updateNotificationCount = (delta: number): void => {
  notificationBadgeUtils.updateOptimistic(delta)
}

/**
 * Set the notification count to an exact value.
 * Useful when you know the exact count after an operation.
 * 
 * @param count The exact count to set (will be clamped to 0+)
 */
export const setNotificationCount = (count: number): void => {
  notificationBadgeUtils.setExact(count)
}

/**
 * Get the current notification badge state.
 * Returns a copy to prevent mutation.
 */
export const getNotificationState = () => {
  return notificationBadgeUtils.getState()
}

/**
 * Global function for triggering notification refresh from anywhere.
 * This is also exposed on window.refreshNotificationBadge for convenience.
 */
if (typeof window !== 'undefined') {
  (window as any).refreshNotificationBadge = refreshNotificationBadge
}

// Export types for external usage
export type NotificationState = ReturnType<typeof getNotificationState>