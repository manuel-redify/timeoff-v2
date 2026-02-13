"use client"

import { ArrowLeft, Loader2 } from "lucide-react"
import { useFormContext } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { WorkflowFormValues } from "@/lib/validations/workflow"

interface WorkflowBuilderHeaderProps {
    isNew?: boolean
    onCancel?: () => void
    onBack?: () => void
}

export function WorkflowBuilderHeader({
    onCancel,
    onBack,
}: WorkflowBuilderHeaderProps) {
    const form = useFormContext<WorkflowFormValues>()
    const { isSubmitting } = form.formState

    // Get form values for display
    const name = form.watch("name")
    const isActive = form.watch("isActive")

    return (
        <header
            className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white"
            data-testid="workflow-builder-header"
        >
            <div className="flex flex-col gap-3 px-4 py-3 sm:h-16 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-0">
                {/* Top Row: Back Button, Title, and Mobile Actions */}
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-4">
                    {/* Back Button */}
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={onBack}
                        className="rounded-sm shrink-0"
                        aria-label="Back to workflows"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>

                    {/* Title Input with Form Integration */}
                    <div className="flex-1 min-w-0">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className="space-y-0">
                                    <FormControl>
                                        <Input
                                            {...field}
                                            className="border-0 bg-transparent text-lg sm:text-xl font-bold text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto"
                                            placeholder="Enter workflow name..."
                                            aria-label="Workflow name"
                                            data-testid="workflow-name-input"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Mobile-only Action Buttons */}
                    <div className="flex w-full items-center justify-end gap-2 sm:hidden">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            className="h-11 rounded-sm px-4"
                            aria-label="Cancel"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !name?.trim()}
                            className="h-11 rounded-sm px-4"
                            data-testid="save-policy-button"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save"
                            )}
                        </Button>
                    </div>
                </div>

                {/* Bottom Row: Status Toggle and Desktop Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end sm:gap-4">
                    {/* Status Toggle */}
                    <div className="flex items-center gap-2 shrink-0">
                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-2 space-y-0">
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            id="workflow-status"
                                            aria-label="Toggle workflow status"
                                        />
                                    </FormControl>
                                    <Badge
                                        variant="outline"
                                        className={isActive ? "bg-green-100 text-green-700 border-green-200 rounded-sm" : "bg-neutral-100 text-neutral-600 border-neutral-200 rounded-sm"}
                                    >
                                        {isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Desktop Action Buttons */}
                    <div className="hidden shrink-0 items-center gap-2 sm:flex">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            className="h-11 rounded-sm px-4"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !name?.trim()}
                            className="h-11 rounded-sm px-4"
                            data-testid="save-policy-button"
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
            </div>
        </header>
    )
}
