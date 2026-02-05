"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal } from "lucide-react"
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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
            const variant = status === "ACTIVE" ? "default" : "secondary"
            return (
                <Badge variant={variant}>
                    {status.toLowerCase()}
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
                                    const res = await fetch(`/api/projects/${project.id}`, {
                                        method: 'DELETE'
                                    })
                                    if (!res.ok) {
                                        const err = await res.json();
                                        throw new Error(err.error?.message || 'Failed to delete');
                                    }
                                    toast({ title: "Success", description: "Project deleted successfully" })
                                    // Trigger reload - this will be handled by parent component
                                    window.location.reload()
                                } catch (e: any) {
                                    toast({ title: "Error", description: e.message, variant: "destructive" })
                                }
                            }}
                            className="text-red-600"
                        >
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]