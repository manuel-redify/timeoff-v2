"use client"

import { useEffect, useState } from "react"
import { AdminGuard } from "@/components/auth/admin-guard"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { DataTable } from "./data-table"
import { projectColumns, type Project } from "./columns"
import { ProjectDialog } from "@/components/settings/projects/project-dialog"

// Mock data for now - will be replaced with API call
const mockProjects: Project[] = [
    {
        id: "1",
        name: "Website Redesign",
        client: { name: "Acme Corp" },
        status: "ACTIVE",
        isBillable: true,
        archived: false,
        _count: { users: 3 }
    },
    {
        id: "2", 
        name: "Mobile App Development",
        client: { name: "TechStart Inc" },
        status: "ACTIVE",
        isBillable: true,
        archived: false,
        _count: { users: 5 }
    },
    {
        id: "3",
        name: "Internal Training",
        client: undefined,
        status: "INACTIVE",
        isBillable: false,
        archived: false,
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
        loadProjects()
    }, [])

    async function loadProjects() {
        setIsLoading(true)
        try {
            const res = await fetch('/api/projects', { cache: 'no-store' })
            if (res.ok) {
                const result = await res.json()
                if (result.success) {
                    setProjects(result.data)
                }
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleArchiveProject(id: string, archived: boolean) {
        try {
            const res = await fetch(`/api/projects/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ archived })
            })
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error?.message || 'Failed to ' + (archived ? 'archive' : 'unarchive') + ' project');
            }
            toast({ 
                title: "Success", 
                description: `Project ${archived ? 'archived' : 'unarchived'} successfully` 
            })
            loadProjects()
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" })
        }
    }

    async function handleCreateProject(values: any) {
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values)
            })

            if (!res.ok) {
                const err = await res.json();
                const errorMessage = err.error?.message || err.error || 'Failed to create project';
                throw new Error(errorMessage);
            }

            const result = await res.json()
            if (result.success) {
                toast({ title: "Success", description: `Project "${values.name}" created successfully` })
                loadProjects()
            }
        } catch (e: any) {
            toast({
                title: "Error",
                description: e.message,
                variant: "destructive"
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
                    <ProjectDialog 
                        onSubmit={handleCreateProject} 
                        onProjectUpdated={loadProjects}
                    />
                )}
            </div>
            <Separator />

            <DataTable columns={projectColumns} data={projects} />
        </div>
    )
}