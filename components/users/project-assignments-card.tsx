"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

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
    const [currentAssignments, setCurrentAssignments] = useState<ProjectAssignment[]>(assignments || [])

    // Filter active projects only
    const activeProjects = projects?.filter(project => 
        project.status === "ACTIVE" && !project.archived
    ) || []

    // Calculate total allocation
    const totalAllocation = currentAssignments.reduce(
        (sum, assignment) => sum + (assignment.allocation || 0),
        0
    )

    // Notify parent of changes
    useEffect(() => {
        if (onChange) {
            onChange(currentAssignments)
        }
    }, [currentAssignments, onChange])

    function addAssignment() {
        const newAssignment: ProjectAssignment = {
            projectId: "",
            roleId: null,
            allocation: 100,
            startDate: new Date().toISOString().split('T')[0],
            endDate: null,
        }
        setCurrentAssignments([...currentAssignments, newAssignment])
    }

    function removeAssignment(index: number) {
        const updatedAssignments = currentAssignments.filter((_, i) => i !== index)
        setCurrentAssignments(updatedAssignments)
    }

    function updateAssignment(index: number, field: string, value: any) {
        const updatedAssignments = [...currentAssignments]
        updatedAssignments[index] = {
            ...updatedAssignments[index],
            [field]: value
        }
        setCurrentAssignments(updatedAssignments)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    Project Assignments
                    <div className="flex items-center space-x-2">
                        <Badge 
                            variant={totalAllocation > 100 ? "destructive" : totalAllocation === 100 ? "default" : "secondary"}
                            aria-live="polite"
                            aria-label={`Total allocation: ${totalAllocation} percent`}
                        >
                            Total: {totalAllocation}%
                        </Badge>
                        {!disabled && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const newAssignment: ProjectAssignment = {
                                        projectId: "",
                                        roleId: null,
                                        allocation: 100,
                                        startDate: new Date().toISOString().split('T')[0],
                                        endDate: null,
                                    }
                                    setCurrentAssignments([...currentAssignments, newAssignment])
                                }}
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
                        <span 
                            className="text-red-600 ml-2 font-semibold inline-flex items-center gap-1"
                            role="alert"
                            aria-live="assertive"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Total allocation exceeds 100%
                        </span>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {currentAssignments.map((assignment, index) => (
                        <div key={index} className="space-y-4 p-4 border rounded-lg bg-slate-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                                {/* Project Select */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Project *</label>
                                    <select
                                        value={assignment.projectId}
                                        onChange={(e) => updateAssignment(index, "projectId", e.target.value)}
                                        disabled={disabled}
                                        className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">Select project</option>
                                        {activeProjects.map((project) => (
                                            <option key={project.id} value={project.id}>{project.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Role Select */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Role</label>
                                    <select
                                        value={assignment.roleId || ""}
                                        onChange={(e) => updateAssignment(index, "roleId", e.target.value)}
                                        disabled={disabled}
                                        className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">Use default role</option>
                                        {roles?.map((role) => (
                                            <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Allocation Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Allocation</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={assignment.allocation}
                                            onChange={(e) => updateAssignment(index, "allocation", Number(e.target.value))}
                                            disabled={disabled}
                                            className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-8"
                                        />
                                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                                            %
                                        </span>
                                    </div>
                                </div>

                                {/* Start Date */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Start Date *</label>
                                    <input
                                        type="date"
                                        value={assignment.startDate}
                                        onChange={(e) => updateAssignment(index, "startDate", e.target.value)}
                                        disabled={disabled}
                                        className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>

                                {/* End Date */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">End Date</label>
                                    <input
                                        type="date"
                                        value={assignment.endDate || ""}
                                        onChange={(e) => updateAssignment(index, "endDate", e.target.value || null)}
                                        disabled={disabled}
                                        className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            {/* Remove Button */}
                            {!disabled && (
                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeAssignment(index)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Remove Assignment
                                    </Button>
                                </div>
                            )}

                            {/* Separator */}
                            {index < currentAssignments.length - 1 && <Separator />}
                        </div>
                    ))}

                    {/* Empty State */}
                    {currentAssignments.length === 0 && !disabled && (
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
            </CardContent>
        </Card>
    )
}