"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { XIcon, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusBadge } from "@/components/ui/status-badge"
import Link from "next/link"

const PORTAL_CONTAINER_ID = "portal-drawer-root"

let portalContainer: HTMLElement | null = null

function getPortalContainer(): HTMLElement | null {
  if (typeof document === "undefined") return null
  if (portalContainer) return portalContainer
  
  let container = document.getElementById(PORTAL_CONTAINER_ID)
  if (!container) {
    container = document.createElement("div")
    container.id = PORTAL_CONTAINER_ID
    container.style.cssText = "position: fixed; inset: 0; pointer-events: none; z-index: 9999;"
    document.body.appendChild(container)
  }
  portalContainer = container
  return container
}

interface LeaveDetailsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  referenceId: string
  status: string
  children?: React.ReactNode
  externalLinkHref?: string
  side?: "left" | "right"
}

export function LeaveDetailsDrawer({
  open,
  onOpenChange,
  referenceId,
  status,
  children,
  externalLinkHref,
  side = "right",
}: LeaveDetailsDrawerProps) {
  const [closing, setClosing] = React.useState(false)
  const container = React.useMemo(() => getPortalContainer(), [])

  React.useEffect(() => {
    if (!open) {
      setClosing(false)
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
    }

    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [open])

  const handleClose = React.useCallback(() => {
    setClosing(true)
    requestAnimationFrame(() => onOpenChange(false))
  }, [onOpenChange])

  if (!open || !container) return null

  return createPortal(
    <div
      data-slot="leave-details-drawer-wrapper"
      className={cn(
        "fixed inset-0 z-[9999] pointer-events-auto",
        closing && "pointer-events-none"
      )}
      role="dialog"
      aria-modal="true"
    >
      <div
        data-slot="leave-details-drawer-backdrop"
        className={cn(
          "fixed inset-0 bg-black/50 transition-opacity duration-150",
          closing ? "opacity-0" : "opacity-100"
        )}
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        data-slot="leave-details-drawer-content"
        className={cn(
          "fixed bg-white flex flex-col h-full w-full sm:max-w-md overflow-y-auto",
          "transition-transform duration-150 ease-out",
          side === "right" && "right-0",
          side === "left" && "left-0",
          side === "right" && (closing ? "translate-x-full" : "translate-x-0"),
          side === "left" && (closing ? "-translate-x-full" : "translate-x-0")
        )}
      >
        <LeaveDetailsDrawerHeader
          referenceId={referenceId}
          status={status}
          externalLinkHref={externalLinkHref}
          onClose={handleClose}
        />
        <div data-slot="leave-details-drawer-body" className="flex-1">
          {children}
        </div>
      </div>
    </div>,
    container
  )
}

interface LeaveDetailsDrawerHeaderProps {
  referenceId: string
  status: string
  externalLinkHref?: string
  onClose: () => void
}

const LeaveDetailsDrawerHeader = React.memo(function LeaveDetailsDrawerHeader({
  referenceId,
  status,
  externalLinkHref,
  onClose,
}: LeaveDetailsDrawerHeaderProps) {
  return (
    <div
      data-slot="leave-details-header"
      className="flex flex-col gap-3 p-6 border-b border-[#e5e7eb]"
    >
      <div className="flex items-start justify-between gap-4">
        <h2
          data-slot="leave-details-title"
          className="text-lg font-semibold text-neutral-900 leading-tight"
        >
          Leave Details
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          {externalLinkHref && (
            <Link
              href={externalLinkHref}
              className="size-11 min-h-11 min-w-11 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="Open full page"
            >
              <ExternalLink className="size-5" strokeWidth={1.5} />
            </Link>
          )}
          <button
            data-slot="leave-details-close"
            className="size-11 min-h-11 min-w-11 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 rounded-md"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <XIcon className="size-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span
          data-slot="leave-details-reference"
          className="text-xs text-neutral-400 font-medium"
        >
          Ref: {referenceId}
        </span>
        {status && <StatusBadge status={status} />}
      </div>
    </div>
  )
})

export { LeaveDetailsDrawerHeader }
