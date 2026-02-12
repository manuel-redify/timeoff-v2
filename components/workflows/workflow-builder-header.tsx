"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

interface WorkflowBuilderHeaderProps {
    initialTitle?: string
    initialStatus?: boolean
    isNew?: boolean
    onSave?: (data: { title: string; isActive: boolean }) => Promise<void>
    onCancel?: () => void
}

export function WorkflowBuilderHeader({
    initialTitle = "",
    initialStatus = true,
    isNew = false,
    onSave,
    onCancel,
}: WorkflowBuilderHeaderProps) {
    const [title, setTitle] = useState(initialTitle || (isNew ? "New Workflow" : ""))
    const [isActive, setIsActive] = useState(initialStatus)
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSave() {
        if (!onSave) return
        setIsSubmitting(true)
        try {
            await onSave({ title, isActive })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <header
            className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white"
            data-testid="workflow-builder-header"
        >
            <div className="flex h-16 items-center gap-4 px-6">
                {/* Back Button */}
                <Button
                    variant="outline"
                    size="icon"
                    asChild
                    className="rounded-sm shrink-0"
                >
                    <Link href="/settings/workflows" aria-label="Back to workflows">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>

                {/* Title Input */}
                <div className="flex-1 min-w-0">
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="border-0 bg-transparent text-xl font-bold text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto"
                        placeholder="Enter workflow name..."
                        aria-label="Workflow name"
                    />
                </div>

                {/* Status Toggle */}
                <div className="flex items-center gap-2 shrink-0">
                    <Switch
                        checked={isActive}
                        onCheckedChange={setIsActive}
                        id="workflow-status"
                        aria-label="Toggle workflow status"
                    />
                    <Badge
                        variant="outline"
                        className={isActive ? "bg-green-100 text-green-700 border-green-200 rounded-sm" : "bg-neutral-100 text-neutral-600 border-neutral-200 rounded-sm"}
                    >
                        {isActive ? "Active" : "Inactive"}
                    </Badge>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        asChild
                        className="rounded-sm"
                    >
                        <Link href="/settings/workflows">Cancel</Link>
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSubmitting || !title.trim()}
                        className="rounded-sm"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Policy"
                        )}
                    </Button>
                </div>
            </div>
        </header>
    )
}
