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
                        <span className="text-red-600 ml-2">
                            ⚠️ Total allocation exceeds 100%
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
                                <div>
                                    <label className="text-sm font-bold text-slate-700">Project *</label>
                                    <select
                                                value={assignment.projectId}
                                                onChange={(e) => updateAssignment(index, "projectId", e.target.value)}
                                                disabled={disabled}
                                            >
                                                <option value="">Select project</option>
                                                {activeProjects.map((project) => (
                                                    <option key={project.id} value={project.id}>{project.name}</option>
                                                ))}
                                            </select>
                                </div>

                                {/* Role Select */}
                                <div>
                                    <label className="text-sm font-bold text-slate-700">Role</label>
                                    <select
                                                value={assignment.roleId || ""}
                                                onChange={(e) => updateAssignment(index, "roleId", e.target.value)}
                                                disabled={disabled}
                                            >
                                                <option value="">Use default role</option>
                                                {roles?.map((role) => (
                                                    <option key={role.id} value={role.id}>{role.name}</option>
                                                ))}
                                            </select>
                                </div>

                                {/* Allocation Input */}
                                <div>
                                    <label className="text-sm font-bold text-slate-700">Allocation</label>
                                    <div className="relative">
                                        <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={assignment.allocation}
                                                    onChange={(e) => updateAssignment(index, "allocation", Number(e.target.value))}
                                                    disabled={disabled}
                                                />
                                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                                                            %
                                            </span>
                                    </div>
                                </div>

                                {/* Start Date */}
                                <div>
                                    <label className="text-sm font-bold text-slate-700">Start Date *</label>
                                    <input
                                                    type="date"
                                                    value={assignment.startDate}
                                                    onChange={(e) => updateAssignment(index, "startDate", e.target.value)}
                                                    disabled={disabled}
                                                />
                                </div>

                                {/* End Date */}
                                <div>
                                    <label className="text-sm font-bold text-slate-700">End Date</label>
                                    <input
                                                    type="date"
                                                    value={assignment.endDate || ""}
                                                    onChange={(e) => updateAssignment(index, "endDate", e.target.value || null)}
                                                    disabled={disabled}
                                                />
                                </div>
                            </div>

                            {/* Remove Button */}
                            {!disabled && (
                                <div className="flex justify-end">
                                    <button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeAssignment(index)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Remove Assignment
                                            </button>
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
                            <button type="button" onClick={addAssignment}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add First Project
                            </button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}