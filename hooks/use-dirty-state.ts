"use client"

import { useEffect, useCallback, useState } from "react"

interface UseDirtyStateOptions {
    isDirty: boolean
    message?: string
    enabled?: boolean
}

export function useDirtyState(options: UseDirtyStateOptions) {
    const { isDirty, message = "You have unsaved changes. Are you sure you want to leave?", enabled = true } = options
    const [showDialog, setShowDialog] = useState(false)
    const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null)

    // Handle beforeunload event (browser close/refresh)
    useEffect(() => {
        if (!enabled || !isDirty) return

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault()
            e.returnValue = message
            return message
        }

        window.addEventListener("beforeunload", handleBeforeUnload)
        return () => window.removeEventListener("beforeunload", handleBeforeUnload)
    }, [isDirty, message, enabled])

    // Function to confirm navigation
    const confirmNavigation = useCallback(() => {
        if (pendingNavigation) {
            pendingNavigation()
        }
        setShowDialog(false)
        setPendingNavigation(null)
    }, [pendingNavigation])

    // Function to cancel navigation
    const cancelNavigation = useCallback(() => {
        setShowDialog(false)
        setPendingNavigation(null)
    }, [])

    // Function to request navigation with confirmation
    const requestNavigation = useCallback(
        (navigate: () => void) => {
            if (!enabled || !isDirty) {
                navigate()
                return
            }

            setPendingNavigation(() => navigate)
            setShowDialog(true)
        },
        [isDirty, enabled]
    )

    return {
        isDirty,
        showDialog,
        setShowDialog,
        confirmNavigation,
        cancelNavigation,
        requestNavigation,
    }
}
