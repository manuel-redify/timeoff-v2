"use client"

import { useFormContext } from "react-hook-form"
import { StepCard } from "./step-card"
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Option } from "@/components/ui/multi-select"
import { ResolverType, ContextScope } from "@/types/workflow"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

function Icon({
    children,
    className = "h-4 w-4",
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
            {children}
        </svg>
    )
}

interface ApprovalStepCardProps {
    index: number
    isLast: boolean
    onRemove: () => void
    canRemove?: boolean
    removeDisabledReason?: string
    onAddParallelStep?: () => void
    showAddParallelStep?: boolean
    inline?: boolean
    inlinePosition?: "left" | "right"
    options: {
        roles: Option[]
        users?: Option[] // Optional for now
    }
}

export function ApprovalStepCard({
    index,
    isLast,
    onRemove,
    canRemove = true,
    removeDisabledReason,
    onAddParallelStep,
    showAddParallelStep = false,
    inline = false,
    inlinePosition = "left",
    options,
}: ApprovalStepCardProps) {
    const form = useFormContext()
    const stepPath = `steps.${index}`

    // Watch resolver type to conditionally show fields
    const resolverType = form.watch(`${stepPath}.resolver`)
    const isAutoApprove = form.watch(`${stepPath}.autoApprove`)

    const getResolverIcon = (type: string) => {
        switch (type) {
            case ResolverType.ROLE:
                return <Icon><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Icon>
            case ResolverType.DEPARTMENT_MANAGER:
                return <Icon><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 9h.01" /><path d="M9 12h.01" /><path d="M9 15h.01" /><path d="M15 9h.01" /><path d="M15 12h.01" /><path d="M15 15h.01" /></Icon>
            case ResolverType.LINE_MANAGER:
            case ResolverType.SPECIFIC_USER:
                return <Icon><path d="M20 21a8 8 0 1 0-16 0" /><circle cx="12" cy="7" r="4" /></Icon>
            default:
                return <Icon><path d="M20 6 9 17l-5-5" /></Icon>
        }
    }

    return (
        <StepCard
            title={`Approval Step ${index + 1}`}
            description="Configure who needs to approve this request"
            icon={getResolverIcon(resolverType)}
            isLast={isLast}
            badge={resolverType ? "Active" : "Pending"}
            position={inline ? inlinePosition : index % 2 === 0 ? "left" : "right"}
            inline={inline}
            mirrorContentForRight={false}
        >
            <div className="space-y-4">
                {/* Resolver Type Selection */}
                <FormField
                    control={form.control}
                    name={`${stepPath}.resolver`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Approver</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isAutoApprove}>
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select approver type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value={ResolverType.ROLE}>Specific Role</SelectItem>
                                    <SelectItem value={ResolverType.DEPARTMENT_MANAGER}>Department Manager</SelectItem>
                                    <SelectItem value={ResolverType.SPECIFIC_USER}>Specific User</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Conditional Scope/Role/User Selection */}
                {resolverType === ResolverType.ROLE && (
                    <FormField
                        control={form.control}
                        name={`${stepPath}.resolverId`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Role</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isAutoApprove}>
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {options.roles.map((role) => (
                                            <SelectItem key={role.value} value={role.value}>
                                                {role.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {resolverType === ResolverType.SPECIFIC_USER && (
                    <FormField
                        control={form.control}
                        name={`${stepPath}.resolverId`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>User</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isAutoApprove}>
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select user" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {options.users?.map((user) => (
                                            <SelectItem key={user.value} value={user.value}>
                                                {user.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {resolverType === ResolverType.ROLE && (
                    <FormField
                        control={form.control}
                        name={`${stepPath}.scope`}
                        render={({ field }) => {
                            const SCOPE_OPTIONS = [
                                { value: ContextScope.GLOBAL, label: "Global" },
                                { value: ContextScope.SAME_DEPARTMENT, label: "Same Department as Requester" },
                                { value: ContextScope.SAME_AREA, label: "Same Area as Requester" },
                                { value: ContextScope.SAME_PROJECT, label: "Same Project as Requester" },
                            ]

                            return (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Scope</FormLabel>
                                    <FormControl>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    disabled={isAutoApprove}
                                                    className={cn(
                                                        "w-full justify-between h-auto min-h-[40px]",
                                                        (!field.value || field.value.length === 0) && "text-muted-foreground",
                                                        isAutoApprove && "opacity-50"
                                                    )}
                                                >
                                                    {field.value && field.value.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {field.value.map((val: string) => (
                                                                <Badge key={val} variant="secondary" className="mr-1 font-normal">
                                                                    {SCOPE_OPTIONS.find((opt) => opt.value === val)?.label || val}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        "Select scope"
                                                    )}
                                                    <Icon className="ml-2 h-4 w-4 shrink-0 opacity-50">
                                                        <path d="m7 15 5 5 5-5" />
                                                        <path d="m7 9 5-5 5 5" />
                                                    </Icon>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search scope..." />
                                                    <CommandList>
                                                        <CommandEmpty>No scope found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {SCOPE_OPTIONS.map((scope) => (
                                                                <CommandItem
                                                                    value={scope.label}
                                                                    key={scope.value}
                                                                    onSelect={() => {
                                                                        const current = field.value || []

                                                                        // Exclusive Logic
                                                                        if (scope.value === ContextScope.GLOBAL) {
                                                                            const isSelected = current.includes(ContextScope.GLOBAL)
                                                                            field.onChange(isSelected ? [] : [ContextScope.GLOBAL])
                                                                        } else {
                                                                            let newValues = current.filter((v: string) => v !== ContextScope.GLOBAL)

                                                                            if (newValues.includes(scope.value)) {
                                                                                newValues = newValues.filter((v: string) => v !== scope.value)
                                                                            } else {
                                                                                newValues = [...newValues, scope.value]
                                                                            }

                                                                            field.onChange(newValues)
                                                                        }
                                                                    }}
                                                                >
                                                                    <Icon
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            (field.value || []).includes(scope.value)
                                                                                ? "opacity-100"
                                                                                : "opacity-0"
                                                                        )}
                                                                    >
                                                                        <path d="M20 6 9 17l-5-5" />
                                                                    </Icon>
                                                                    {scope.label}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )
                        }}
                    />
                )}

                {/* Auto Approve Toggle */}
                <FormField
                    control={form.control}
                    name={`${stepPath}.autoApprove`}
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Auto-Approve</FormLabel>
                                <FormDescription>
                                    Automatically approve if the approver is the requester
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    {showAddParallelStep && onAddParallelStep && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onAddParallelStep}
                            className="w-full gap-2 sm:w-auto"
                            data-testid="add-parallel-step-inline-btn"
                        >
                            <Icon><path d="M12 5v14" /><path d="M5 12h14" /></Icon>
                            Add parallel step
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onRemove}
                        disabled={!canRemove}
                        title={!canRemove ? removeDisabledReason : undefined}
                        className="w-full gap-2 sm:w-auto"
                        data-testid="remove-step-btn"
                    >
                        <Icon><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></Icon>
                        Remove Step
                    </Button>
                </div>
            </div>
        </StepCard>
    )
}

