"use client"

import { useEffect, useState } from "react"
import { AdminGuard } from "@/components/auth/admin-guard"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { DataTable } from "./data-table"
import { projectColumns } from "./columns"
import { ProjectDialog } from "@/components/settings/projects/project-dialog"

interface Project {
    id: string
    name: string
    client?: {
        name: string
    }
    status: string
    isBillable: boolean
    _count: {
        users: number
    }
}

// Mock data for now - will be replaced with API call
const mockProjects: Project[] = [
    {
        id: "1",
        name: "Website Redesign",
        client: { name: "Acme Corp" },
        status: "ACTIVE",
        isBillable: true,
        _count: { users: 3 }
    },
    {
        id: "2", 
        name: "Mobile App Development",
        client: { name: "TechStart Inc" },
        status: "ACTIVE",
        isBillable: true,
        _count: { users: 5 }
    },
    {
        id: "3",
        name: "Internal Training",
        client: undefined,
        status: "INACTIVE",
        isBillable: false,
        _count: { users: 2 }
    }
]

export default function ProjectsPage() {
    return (
        <AdminGuard>
            <ProjectsPageContent />
        </AdminGuard>
    )
}

function ProjectsPageContent() {
    const [projects, setProjects] = useState<Project[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        // Simulate loading
        setTimeout(() => {
            setProjects(mockProjects)
            setIsLoading(false)
        }, 500)
    }, [])

    async function handleCreateProject(values: any) {
        try {
            // Mock creation - replace with API call
            const newProject: Project = {
                id: Date.now().toString(),
                name: values.name,
                client: values.clientId ? { name: `Client ${values.clientId}` } : undefined,
                status: "ACTIVE",
                isBillable: values.isBillable,
                _count: { users: 0 }
            }
            
            setProjects(prev => [...prev, newProject])
            
            toast({
                title: "Success",
                description: `Project "${values.name}" created successfully`,
            })
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create project",
                variant: "destructive",
            })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Projects</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage projects and assign team members.
                    </p>
                </div>
                {isMounted && (
                    <ProjectDialog onSubmit={handleCreateProject} />
                )}
            </div>
            <Separator />

            <DataTable columns={projectColumns} data={projects} />
        </div>
    )
}