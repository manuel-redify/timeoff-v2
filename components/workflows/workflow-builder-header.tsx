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
            <div className="flex h-16 items-center gap-4 px-6">
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
                                        className="border-0 bg-transparent text-xl font-bold text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto"
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

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        className="rounded-sm"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || !name?.trim()}
                        className="rounded-sm"
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
        </header>
    )
}
