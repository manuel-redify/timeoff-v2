"use client"

import { useEffect, useState } from "react"
import { AdminGuard } from "@/components/auth/admin-guard"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { DataTable } from "./data-table"
import { projectColumns } from "./columns"

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
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Project
                    </Button>
                )}
            </div>
            <Separator />

            <DataTable columns={projectColumns} data={projects} />
        </div>
    )
}