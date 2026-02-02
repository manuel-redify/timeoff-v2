"use client"

import { useEffect, useState } from "react"
import { AdminGuard } from "@/components/auth/admin-guard"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { MoreHorizontal, Plus, Shirt, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface Area {
    id: string
    name: string
    createdAt: string
    users?: Array<{
        id: string
        name: string
        lastname: string
        email: string
    }>
    _count: {
        users: number
    }
}

const createAreaSchema = z.object({
    name: z.string().min(1, "Area name is required"),
})

const editAreaSchema = createAreaSchema.extend({
    id: z.string().uuid(),
})

export default function AreasPage() {
    return (
        <AdminGuard>
            <AreasPageContent />
        </AdminGuard>
    )
}

function AreasPageContent() {
    const [areas, setAreas] = useState<Area[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingArea, setEditingArea] = useState<Area | null>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    const createForm = useForm<z.infer<typeof createAreaSchema>>({
        resolver: zodResolver(createAreaSchema) as any,
        defaultValues: {
            name: "",
        }
    })

    const editForm = useForm<z.infer<typeof editAreaSchema>>({
        resolver: zodResolver(editAreaSchema) as any,
        defaultValues: {
            name: "",
        }
    })

    async function loadAreas() {
        try {
            const res = await fetch('/api/areas', { cache: 'no-store' })
            if (res.ok) {
                const result = await res.json()
                if (result.success) {
                    setAreas(result.data)
                }
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        setIsMounted(true)
        loadAreas()
    }, [])

    async function onCreate(data: z.infer<typeof createAreaSchema>) {
        try {
            const res = await fetch('/api/areas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error?.message || 'Failed to create area');
            }

            toast({ title: "Area created successfully" })
            setIsCreateOpen(false)
            createForm.reset()
            loadAreas()
        } catch (e: any) {
            toast({
                title: "Error",
                description: e.message,
                variant: "destructive"
            })
        }
    }

    async function onUpdate(data: z.infer<typeof editAreaSchema>) {
        if (!editingArea) return
        
        try {
            const res = await fetch(`/api/areas/${data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.name,
                })
            })

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error?.message || 'Failed to update area');
            }

            toast({ title: "Area updated successfully" })
            setIsEditOpen(false)
            setEditingArea(null)
            editForm.reset()
            loadAreas()
        } catch (e: any) {
            toast({
                title: "Error",
                description: e.message,
                variant: "destructive"
            })
        }
    }

    async function onDelete(id: string, name: string) {
        if (!confirm(`Are you sure you want to delete area "${name}"? This cannot be undone.`)) return;
        try {
            const res = await fetch(`/api/areas/${id}`, {
                method: 'DELETE'
            })
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error?.message || 'Failed to delete area');
            }
            toast({ title: "Area deleted successfully" })
            loadAreas()
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" })
        }
    }

    function handleEdit(area: Area) {
        setEditingArea(area)
        editForm.reset({
            id: area.id,
            name: area.name,
        })
        setIsEditOpen(true)
    }

    return (
        <TooltipProvider>
            <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Areas</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage organizational areas and their user assignments.
                    </p>
                </div>
                {isMounted && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Area
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Area</DialogTitle>
                                <DialogDescription>
                                    Add a new area for organizing users and roles.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...createForm}>
                                <form onSubmit={createForm.handleSubmit(onCreate)} className="space-y-4">
                                    <FormField
                                        control={createForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Area Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., Sales, Engineering, Marketing" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                        <Button type="submit">Create Area</Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
            <Separator />

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Area Name</TableHead>
                            <TableHead className="text-center">Users</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8">
                                    Loading areas...
                                </TableCell>
                            </TableRow>
                        ) : areas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8">
                                    <div className="flex flex-col items-center space-y-2">
                                        <Shirt className="h-8 w-8 text-muted-foreground" />
                                        <p className="text-muted-foreground">No areas found.</p>
                                        <p className="text-sm text-muted-foreground">
                                            Create your first area to get started.
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            areas.map((area) => (
                                <TableRow key={area.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Shirt className="h-4 w-4 text-muted-foreground" />
                                            {area.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Users className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-sm text-muted-foreground">
                                                            {area._count?.users || 0}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {area._count?.users === 1 ? 'user' : 'users'}
                                                    </p>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Number of users assigned to this area</p>
                                                {area.users && Array.isArray(area.users) && area.users.length > 0 && (
                                                    <div className="text-xs mt-1">
                                                        <p className="font-semibold">Users:</p>
                                                        {area.users.map((user: any, idx: number) => (
                                                            <span key={user.id || idx}>
                                                                {user.name} {user.lastname}
                                                                {idx < area.users!.length - 1 ? ', ' : ''}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(area.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEdit(area)}>
                                                    Edit Area
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => onDelete(area.id, area.name)} 
                                                    className="text-red-600"
                                                >
                                                    Delete Area
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Area</DialogTitle>
                        <DialogDescription>
                            Update area details.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(onUpdate)} className="space-y-4">
                            <FormField
                                control={editForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Area Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Sales, Engineering, Marketing" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="submit">Update Area</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            </div>
        </TooltipProvider>
    )
}