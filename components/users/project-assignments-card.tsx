"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectAssignmentsFields, ProjectAssignment, Project, Role } from "./project-assignments-fields"

export type { ProjectAssignment, Project, Role }

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
    return (
        <Card>
            <CardHeader>
                <CardTitle>Project Assignments</CardTitle>
                <CardDescription>
                    Assign this user to projects with specific roles and allocation percentages.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ProjectAssignmentsFields
                    assignments={assignments}
                    projects={projects}
                    roles={roles}
                    defaultRoleId={defaultRoleId}
                    onChange={onChange}
                    disabled={disabled}
                />
            </CardContent>
        </Card>
    )
}
