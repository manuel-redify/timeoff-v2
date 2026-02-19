"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

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

interface PortalDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  side?: "left" | "right"
  className?: string
  showCloseButton?: boolean
}

function PortalDrawer({
  open,
  onOpenChange,
  children,
  side = "right",
  className,
  showCloseButton = true,
}: PortalDrawerProps) {
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
      data-slot="portal-drawer-wrapper"
      className="fixed inset-0 z-[9999] pointer-events-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        data-slot="portal-drawer-backdrop"
        className="fixed inset-0 bg-black/50 animate-in fade-in-0 duration-200"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        data-slot="portal-drawer-content"
        className={cn(
          "fixed bg-white flex flex-col h-full w-3/4 sm:max-w-sm border-0 border-[#e5e7eb] shadow-lg",
          "animate-in duration-300 ease-in-out",
          side === "right" && "right-0 slide-in-from-right",
          side === "left" && "left-0 slide-in-from-left",
          className
        )}
      >
        {showCloseButton && (
          <button
            data-slot="portal-drawer-close"
            className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-600 transition-colors focus:outline-none"
            onClick={() => onOpenChange(false)}
            aria-label="Close drawer"
          >
            <XIcon className="size-5" strokeWidth={1.5} />
          </button>
        )}
        {children}
      </div>
    </div>,
    getPortalContainer()
  )
}

function PortalDrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="portal-drawer-header"
      className={cn("flex flex-col gap-3 p-6 border-b border-[#e5e7eb]", className)}
      {...props}
    />
  )
}

function PortalDrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="portal-drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function PortalDrawerTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="portal-drawer-title"
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
}

function PortalDrawerDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="portal-drawer-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  PortalDrawer,
  PortalDrawerHeader,
  PortalDrawerFooter,
  PortalDrawerTitle,
  PortalDrawerDescription,
}
