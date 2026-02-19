"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { XIcon, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusBadge } from "@/components/ui/status-badge"
import Link from "next/link"

const PORTAL_CONTAINER_ID = "portal-drawer-root"

function getPortalContainer(): HTMLElement {
  let container = document.getElementById(PORTAL_CONTAINER_ID)
  if (!container) {
    container = document.createElement("div")
    container.id = PORTAL_CONTAINER_ID
    container.style.cssText = "position: fixed; inset: 0; pointer-events: none; z-index: 9999;"
    document.body.appendChild(container)
  }
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
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  React.useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [open, onOpenChange])

  if (!mounted || !open) return null

  return createPortal(
    <div
      data-slot="leave-details-drawer-wrapper"
      className="fixed inset-0 z-[9999] pointer-events-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        data-slot="leave-details-drawer-backdrop"
        className="fixed inset-0 bg-black/50 animate-in fade-in-0 duration-200"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        data-slot="leave-details-drawer-content"
        className={cn(
          "fixed bg-white flex flex-col h-full w-full sm:max-w-md overflow-y-auto",
          "animate-in duration-300 ease-in-out",
          side === "right" && "right-0 slide-in-from-right",
          side === "left" && "left-0 slide-in-from-left"
        )}
      >
        <LeaveDetailsDrawerHeader
          referenceId={referenceId}
          status={status}
          externalLinkHref={externalLinkHref}
          onClose={() => onOpenChange(false)}
        />
        <div data-slot="leave-details-drawer-body" className="flex-1">
          {children}
        </div>
      </div>
    </div>,
    getPortalContainer()
  )
}

interface LeaveDetailsDrawerHeaderProps {
  referenceId: string
  status: string
  externalLinkHref?: string
  onClose: () => void
}

function LeaveDetailsDrawerHeader({
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
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="Open full page"
            >
              <ExternalLink className="size-5" strokeWidth={1.5} />
            </Link>
          )}
          <button
            data-slot="leave-details-close"
            className="text-neutral-400 hover:text-neutral-600 transition-colors focus:outline-none"
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
        <StatusBadge status={status} />
      </div>
    </div>
  )
}

export { LeaveDetailsDrawerHeader }
