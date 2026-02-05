"use client"

import { useEffect, useState } from "react"
import { AdminGuard } from "@/components/auth/admin-guard"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { DataTable } from "./data-table"
import { getProjectColumns, type Project } from "./columns"
import { ProjectDialog } from "@/components/settings/projects/project-dialog"
import { ProjectDetailDialog } from "@/components/settings/projects/project-detail-dialog"

// Mock data for now - will be replaced with API call
const mockProjects: Project[] = [
    {
        id: "1",
        name: "Website Redesign",
        clientId: "client-1",
        clientObj: { id: "client-1", name: "Acme Corp", companyId: "comp-1" },
        status: "ACTIVE",
        isBillable: true,
        archived: false,
        _count: { userProjects: 3 }
    },
    {
        id: "2", 
        name: "Mobile App Development",
        clientId: "client-2",
        clientObj: { id: "client-2", name: "TechStart Inc", companyId: "comp-1" },
        status: "ACTIVE",
        isBillable: true,
        archived: false,
        _count: { userProjects: 5 }
    },
    {
        id: "3",
        name: "Internal Training",
        clientId: undefined,
        clientObj: undefined,
        status: "INACTIVE",
        isBillable: false,
        archived: false,
        _count: { userProjects: 2 }
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
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [viewingProject, setViewingProject] = useState<Project | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)

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
            } else {
                const errorData = await res.json()
                console.error('Failed to load projects:', errorData)
            }
        } catch (e) {
            console.error('Error loading projects:', e)
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

    async function handleEditProject(values: any) {
        if (!editingProject) return
        try {
            const res = await fetch(`/api/projects/${editingProject.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values)
            })

            if (!res.ok) {
                const err = await res.json();
                const errorMessage = err.error?.message || err.error || 'Failed to update project';
                throw new Error(errorMessage);
            }

            const result = await res.json()
            if (result.success) {
                toast({ title: "Success", description: `Project "${values.name}" updated successfully` })
                setEditingProject(null)
                setIsDialogOpen(false)
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

    function handleEdit(project: Project) {
        setEditingProject(project)
        setIsDialogOpen(true)
    }

    function handleCreate() {
        setEditingProject(null)
        setIsDialogOpen(true)
    }

    function handleView(project: Project) {
        setViewingProject(project)
        setIsDetailOpen(true)
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
                        open={isDialogOpen}
                        onOpenChange={setIsDialogOpen}
                        defaultValues={editingProject ? {
                            name: editingProject.name,
                            clientId: editingProject.clientObj?.id || null,
                            isBillable: editingProject.isBillable,
                            description: editingProject.description || "",
                            color: editingProject.color || "#3B82F6"
                        } : undefined}
                        onSubmit={editingProject ? handleEditProject : handleCreateProject}
                        onProjectUpdated={() => {
                            setEditingProject(null)
                            setIsDialogOpen(false)
                            loadProjects()
                        }}
                    />
                )}
            </div>
            <Separator />

            <DataTable 
                columns={getProjectColumns(handleEdit, handleView)} 
                data={projects} 
            />

            <ProjectDetailDialog
                project={viewingProject}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
                onEdit={() => {
                    setViewingProject(null)
                    setIsDetailOpen(false)
                    handleEdit(viewingProject!)
                }}
            />
        </div>
    )
}