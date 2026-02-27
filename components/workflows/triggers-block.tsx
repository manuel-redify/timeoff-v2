"use client"

import { useFormContext } from "react-hook-form"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    FormControl,
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
import { MultiSelect, Option } from "@/components/ui/multi-select"
import { WorkflowFormValues } from "@/lib/validations/workflow"

interface TriggersBlockProps {
    options: {
        leaveTypes: Option[]
        contractTypes: Option[]
        roles: Option[]
        departments: Option[]
        projectTypes: Option[]
    }
}

export function TriggersBlock({ options }: TriggersBlockProps) {
    const form = useFormContext<WorkflowFormValues>()

    return (
        <Card>
            <CardHeader>
                <CardTitle>Trigger Conditions</CardTitle>
                <CardDescription>
                    Define when this workflow should be triggered based on the request context.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="requestTypes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Request Type</FormLabel>
                            <FormControl>
                                <MultiSelect
                                    options={options.leaveTypes}
                                    selected={field.value || []}
                                    onChange={field.onChange}
                                    placeholder="Select request types..."
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="contractTypes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contract Type</FormLabel>
                            <FormControl>
                                <Select
                                    value={field.value?.[0] || "any"}
                                    onValueChange={(value) => field.onChange([value])}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select contract type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="any">Any Contract Type</SelectItem>
                                        {options.contractTypes.map((contractType) => (
                                            <SelectItem key={contractType.value} value={contractType.value}>
                                                {contractType.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="subjectRoles"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Subject Role</FormLabel>
                            <FormControl>
                                <MultiSelect
                                    options={[
                                        { value: "any", label: "Any Role", exclusive: true },
                                        ...options.roles,
                                    ]}
                                    selected={field.value || []}
                                    onChange={field.onChange}
                                    placeholder="Select roles..."
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="departments"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Department</FormLabel>
                            <FormControl>
                                <MultiSelect
                                    options={[
                                        { value: "any", label: "Any Department", exclusive: true },
                                        ...options.departments,
                                    ]}
                                    selected={field.value || []}
                                    onChange={field.onChange}
                                    placeholder="Select departments..."
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="projectTypes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Project Type</FormLabel>
                            <FormControl>
                                <MultiSelect
                                    options={[
                                        { value: "any", label: "Any Project Type", exclusive: true },
                                        ...options.projectTypes,
                                    ]}
                                    selected={field.value || []}
                                    onChange={field.onChange}
                                    placeholder="Select project types..."
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    )
}
