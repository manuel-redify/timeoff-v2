"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Archive, ArchiveRestore, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export interface Project {
    id: string
    name: string
    client?: {
        name: string
    }
    status: string
    isBillable: boolean
    archived: boolean
    _count: {
        users: number
    }
}

export const projectColumns: ColumnDef<Project>[] = [
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
            return <div className="font-medium">{row.getValue("name")}</div>
        },
    },
    {
        accessorKey: "client",
        header: "Client",
        cell: ({ row }) => {
            const client = row.getValue("client") as Project["client"]
            return client ? (
                <Badge variant="secondary">{client.name}</Badge>
            ) : (
                <Badge variant="outline">No Client</Badge>
            )
        },
    },
    {
        accessorKey: "status", 
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            const archived = row.original.archived
            let variant: "default" | "secondary" | "outline" = "default"
            let text = status.toLowerCase()
            
            if (archived) {
                variant = "secondary"
                text = "archived"
            } else if (status === "ACTIVE") {
                variant = "default"
                text = status.toLowerCase()
            } else {
                variant = "outline"
                text = status.toLowerCase()
            }
            
            return (
                <Badge variant={variant}>
                    {text}
                </Badge>
            )
        },
    },
    {
        accessorKey: "isBillable",
        header: "Billable",
        cell: ({ row }) => {
            const isBillable = row.getValue("isBillable") as boolean
            return (
                <Badge variant={isBillable ? "default" : "outline"}>
                    {isBillable ? "Billable" : "Non-billable"}
                </Badge>
            )
        },
    },
    {
        accessorKey: "_count.users",
        header: "Users",
        cell: ({ row }) => {
            const userCount = row.original._count.users
            return <span className="text-sm">{userCount}</span>
        },
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const project = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                            Edit Project
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            onClick={async () => {
                                try {
                                    const action = project.archived ? 'unarchive' : 'archive'
                                    const res = await fetch(`/api/projects/${project.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ archived: !project.archived })
                                    })
                                    if (!res.ok) {
                                        const err = await res.json();
                                        throw new Error(err.error?.message || 'Failed to ' + action + ' project');
                                    }
                                    toast({ 
                                        title: "Success", 
                                        description: `Project ${action}d successfully` 
                                    })
                                } catch (e: any) {
                                    toast({ title: "Error", description: e.message, variant: "destructive" })
                                }
                            }}
                        >
                            {project.archived ? (
                                <>
                                    <ArchiveRestore className="mr-2 h-4 w-4" />
                                    Unarchive
                                </>
                            ) : (
                                <>
                                    <Archive className="mr-2 h-4 w-4" />
                                    Archive
                                </>
                            )}
                        </DropdownMenuItem>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div>
                                        <DropdownMenuItem 
                                            onClick={async () => {
                                                if (project._count.users > 0) return
                                                try {
                                                    const res = await fetch(`/api/projects/${project.id}`, {
                                                        method: 'DELETE'
                                                    })
                                                    if (!res.ok) {
                                                        const err = await res.json();
                                                        throw new Error(err.error?.message || 'Failed to delete');
                                                    }
                                                    toast({ title: "Success", description: "Project deleted successfully" })
                                                } catch (e: any) {
                                                    toast({ title: "Error", description: e.message, variant: "destructive" })
                                                }
                                            }}
                                            className={`${project._count.users > 0 ? 'text-muted-foreground cursor-not-allowed' : 'text-red-600'}`}
                                            disabled={project._count.users > 0}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </div>
                                </TooltipTrigger>
                                {project._count.users > 0 && (
                                    <TooltipContent side="left">
                                        <p>Cannot delete project with {project._count.users} assigned user{project._count.users === 1 ? '' : 's'}. Unassign users first.</p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]