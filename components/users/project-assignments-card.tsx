"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Trash2, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Form,
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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// Schema for individual project assignment
const projectAssignmentSchema = z.object({
    projectId: z.string().min(1, "Project is required"),
    roleId: z.string().nullable(),
    allocation: z.number().min(0, "Allocation must be at least 0").max(100, "Allocation cannot exceed 100%"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().nullable().optional(),
}).refine((data) => {
    // Cross-field validation: endDate must be >= startDate or null
    if (data.endDate && data.startDate) {
        const end = new Date(data.endDate);
        const start = new Date(data.startDate);
        return end >= start;
    }
    return true;
}, {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
})

// Schema for the entire assignments form
const projectAssignmentsFormSchema = z.object({
    assignments: z.array(projectAssignmentSchema),
})

export interface ProjectAssignment {
    projectId: string
    roleId: string | null
    allocation: number
    startDate: string
    endDate: string | null
}

export interface Project {
    id: string
    name: string
    status: string
    archived: boolean
}

export interface Role {
    id: string
    name: string
}

interface ProjectAssignmentsCardProps {
    assignments?: ProjectAssignment[]
    projects?: Project[]
    roles?: Role[]
    defaultRoleId?: string
    onChange?: (assignments: ProjectAssignment[]) => void
    disabled?: boolean
}

export function ProjectAssignmentsCard({
    assignments = [],
    projects = [],
    roles = [],
    defaultRoleId,
    onChange,
    disabled = false,
}: ProjectAssignmentsCardProps) {
const form = useForm({
        resolver: zodResolver(projectAssignmentsFormSchema) as any,
        defaultValues: {
            assignments: assignments || [{
                projectId: "",
                roleId: null,
                allocation: 100,
                startDate: new Date().toISOString().split('T')[0],
                endDate: null,
            }],
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "assignments",
    })

    const watchedAssignments = useWatch({
        control: form.control,
        name: "assignments",
    })

    // Calculate total allocation
    const totalAllocation = watchedAssignments.reduce(
        (sum, assignment) => sum + (assignment.allocation || 0),
        0
    )

    // Filter active projects only
    const activeProjects = projects.filter(project => 
        project.status === "ACTIVE" && !project.archived
    )

    // Notify parent of changes
    useEffect(() => {
        if (onChange) {
            onChange(watchedAssignments)
        }
    }, [watchedAssignments, onChange])

function addAssignment() {
        append({
            projectId: "",
            roleId: null as string | null,
            allocation: 100,
            startDate: new Date().toISOString().split('T')[0],
            endDate: null as string | null,
        })
    }

    function removeAssignment(index: number) {
        remove(index)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    Project Assignments
                    <div className="flex items-center space-x-2">
                        <Badge 
                            variant={totalAllocation > 100 ? "destructive" : totalAllocation === 100 ? "default" : "secondary"}
                        >
                            Total: {totalAllocation}%
                        </Badge>
                        {!disabled && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addAssignment}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Project
                            </Button>
                        )}
                    </div>
                </CardTitle>
                <CardDescription>
                    Assign this user to projects with specific roles and allocation percentages.
                    {totalAllocation > 100 && (
                        <span className="text-red-600 ml-2">
                            ⚠️ Total allocation exceeds 100%
                        </span>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                                    {/* Project Select */}
                                    <FormField
                                        control={form.control}
                                        name={`assignments.${index}.projectId`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Project *</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    disabled={disabled}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select project" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {activeProjects.map((project) => (
                                                            <SelectItem key={project.id} value={project.id}>
                                                                {project.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Role Select */}
                                    <FormField
                                        control={form.control}
                                        name={`assignments.${index}.roleId`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Role</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value || ""}
                                                    disabled={disabled}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Use default role" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="">Use default role</SelectItem>
                                                        {roles.map((role) => (
                                                            <SelectItem key={role.id} value={role.id}>
                                                                {role.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Allocation Input */}
                                    <FormField
                                        control={form.control}
                                        name={`assignments.${index}.allocation`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Allocation</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            placeholder="100"
                                                            {...field}
                                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                                            disabled={disabled}
                                                        />
                                                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                                                            %
                                                        </span>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Start Date */}
                                    <FormField
                                        control={form.control}
                                        name={`assignments.${index}.startDate`}
                                        render={({ field, fieldState }) => (
                                            <FormItem>
                                                <FormLabel>Start Date *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="date"
                                                        {...field}
                                                        disabled={disabled}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                                {fieldState.error && (
                                                    <p className="text-sm text-red-600 mt-1">
                                                        {fieldState.error.message}
                                                    </p>
                                                )}
                                            </FormItem>
                                        )}
                                    />

                                    {/* End Date */}
                                    <FormField
                                        control={form.control}
                                        name={`assignments.${index}.endDate`}
                                        render={({ field, fieldState }) => {
                                            const hasDateError = field.value && fieldState.error?.type === 'custom';
                                            return (
                                                <FormItem>
                                                    <FormLabel>End Date</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="date"
                                                            {...field}
                                                            value={field.value || ""}
                                                            onChange={(e) => field.onChange(e.target.value || null)}
                                                            disabled={disabled}
                                                        />
                                                    </FormControl>
                                                    {hasDateError && (
                                                        <p className="text-sm text-red-600 mt-1">
                                                            End date must be after start date
                                                        </p>
                                                    )}
                                                    <FormMessage />
                                                </FormItem>
                                            )
                                        }}
                                    />
                                </div>

                                {/* Remove Button */}
                                {!disabled && fields.length > 1 && (
                                    <div className="flex justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeAssignment(index)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Remove Assignment
                                        </Button>
                                    </div>
                                )}

                                {/* Separator */}
                                {index < fields.length - 1 && <Separator />}
                            </div>
                        ))}

                        {/* Empty State */}
                        {fields.length === 0 && !disabled && (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground mb-4">
                                    No project assignments yet. Click "Add Project" to get started.
                                </p>
                                <Button type="button" variant="outline" onClick={addAssignment}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add First Project
                                </Button>
                            </div>
                        )}
                    </div>
                </Form>
            </CardContent>
        </Card>
    )
}