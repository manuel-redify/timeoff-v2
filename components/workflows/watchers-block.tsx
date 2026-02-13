"use client"

import { Eye, Users, Building, Plus, Trash2 } from "lucide-react"
import { useFieldArray, useFormContext } from "react-hook-form"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Option } from "@/components/ui/multi-select"
import { ResolverType, ContextScope } from "@/types/workflow"
import { WorkflowFormValues } from "@/lib/validations/workflow"
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
import { ChevronsUpDown, Check } from "lucide-react"

interface WatchersBlockProps {
    options: {
        roles: Option[]
        users: Option[]
    }
}

export function WatchersBlock({ options }: WatchersBlockProps) {
    const form = useFormContext<WorkflowFormValues>()
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "watchers",
    })

    const createDefaultWatcher = (): WorkflowFormValues["watchers"][number] => ({
        resolver: ResolverType.ROLE,
        scope: [ContextScope.GLOBAL],
        notificationOnly: true,
        notifyByEmail: true,
        notifyByPush: true,
    })

    const getResolverIcon = (type: string) => {
        switch (type) {
            case ResolverType.ROLE:
                return <Users className="h-4 w-4" />
            case ResolverType.DEPARTMENT_MANAGER:
                return <Building className="h-4 w-4" />
            case ResolverType.LINE_MANAGER:
                return <Eye className="h-4 w-4" />
            case ResolverType.SPECIFIC_USER:
                return <Eye className="h-4 w-4" />
            default:
                return <Eye className="h-4 w-4" />
        }
    }

    return (
        <div className="space-y-4" data-testid="watchers-block">
            {fields.map((field, index) => {
                const watcherPath = `watchers.${index}` as const
                const resolverType = form.watch(`${watcherPath}.resolver`)

                return (
                    <Card key={field.id}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-primary">{getResolverIcon(resolverType)}</span>
                                <CardTitle className="text-base">Watcher {index + 1}</CardTitle>
                                <Badge variant="secondary" className="rounded-sm">Notify</Badge>
                            </div>
                            <CardDescription>
                                Notification-only watcher configuration.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name={`${watcherPath}.resolver`}
                                render={({ field: resolverField }) => (
                                    <FormItem>
                                        <FormLabel>Watcher Type</FormLabel>
                                        <Select onValueChange={resolverField.onChange} defaultValue={resolverField.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select watcher type" />
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

                                {resolverType === ResolverType.ROLE && (
                                    <FormField
                                        control={form.control}
                                        name={`${watcherPath}.resolverId`}
                                        render={({ field: resolverField }) => (
                                            <FormItem>
                                                <FormLabel>Role</FormLabel>
                                                <Select onValueChange={resolverField.onChange} defaultValue={resolverField.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Search and select a role" />
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
                                        name={`${watcherPath}.resolverId`}
                                        render={({ field: resolverField }) => (
                                            <FormItem>
                                                <FormLabel>User</FormLabel>
                                                <Select onValueChange={resolverField.onChange} defaultValue={resolverField.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Search and select a user" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {options.users.map((user) => (
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

                                <FormField
                                    control={form.control}
                                    name={`${watcherPath}.scope`}
                                    render={({ field: scopeField }) => {
                                        const SCOPE_OPTIONS = [
                                            { value: ContextScope.GLOBAL, label: "Global (Any Department)" },
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
                                                                className={cn(
                                                                    "w-full justify-between h-auto min-h-[40px]",
                                                                    (!scopeField.value || scopeField.value.length === 0) && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {scopeField.value && scopeField.value.length > 0 ? (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {scopeField.value.map((val: string) => (
                                                                            <Badge key={val} variant="secondary" className="mr-1 font-normal">
                                                                                {SCOPE_OPTIONS.find((opt) => opt.value === val)?.label || val}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    "Select scope"
                                                                )}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                                                                                    const current = scopeField.value || []

                                                                                    if (scope.value === ContextScope.GLOBAL) {
                                                                                        const isSelected = current.includes(ContextScope.GLOBAL)
                                                                                        scopeField.onChange(isSelected ? [] : [ContextScope.GLOBAL])
                                                                                    } else {
                                                                                        let newValues = current.filter((v: string) => v !== ContextScope.GLOBAL)

                                                                                        if (newValues.includes(scope.value)) {
                                                                                            newValues = newValues.filter((v: string) => v !== scope.value)
                                                                                        } else {
                                                                                            newValues = [...newValues, scope.value]
                                                                                        }

                                                                                        scopeField.onChange(newValues)
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        "mr-2 h-4 w-4",
                                                                                        (scopeField.value || []).includes(scope.value)
                                                                                            ? "opacity-100"
                                                                                            : "opacity-0"
                                                                                    )}
                                                                                />
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

                                <div className="grid gap-3 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name={`${watcherPath}.notifyByEmail`}
                                        render={({ field: emailField }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Email Notifications</FormLabel>
                                                    <FormDescription>
                                                        Send watcher updates by email
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={emailField.value}
                                                        onCheckedChange={emailField.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name={`${watcherPath}.notifyByPush`}
                                        render={({ field: pushField }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Push Notifications</FormLabel>
                                                    <FormDescription>
                                                        Send watcher updates as push notifications
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={pushField.value}
                                                        onCheckedChange={pushField.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name={`${watcherPath}.notificationOnly`}
                                    render={({ field: notificationOnlyField }) => (
                                        <FormItem className="hidden">
                                            <FormControl>
                                                <input
                                                    type="hidden"
                                                    value={notificationOnlyField.value ? "true" : "false"}
                                                    onChange={(event) => notificationOnlyField.onChange(event.target.value === "true")}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => remove(index)}
                                    className="w-full gap-2 sm:w-auto"
                                    data-testid="remove-watcher-btn"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Remove Watcher
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}

            <div className="flex justify-center">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append(createDefaultWatcher())}
                    className="gap-2"
                    data-testid="add-watcher-btn"
                >
                    <Plus className="h-4 w-4" />
                    Add Watcher
                </Button>
            </div>
        </div>
    )
}
