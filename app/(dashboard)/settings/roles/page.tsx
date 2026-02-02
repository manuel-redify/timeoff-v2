"use client"

import { useEffect, useState } from "react"
import { AdminGuard } from "@/components/auth/admin-guard"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { MoreHorizontal, Plus, User, Shield, Info } from "lucide-react"

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

interface Role {
    id: string
    name: string
    priorityWeight: number
    createdAt: string
    userRoleAreas?: Array<{
        id: string
        area: {
            name: string
        }
    }>
    usersDefault?: Array<{
        id: string
        name: string
        lastname: string
        email: string
    }>
    _count: {
        userRoleAreas: number
        usersDefault: number
    }
}

const createRoleSchema = z.object({
    name: z.string().min(1, "Role name is required"),
    priorityWeight: z.coerce.number().int().min(0, "Priority weight must be 0 or greater").default(0),
})

const editRoleSchema = createRoleSchema.extend({
    id: z.string().uuid(),
})

export default function RolesPage() {
    return (
        <AdminGuard>
            <RolesPageContent />
        </AdminGuard>
    )
}

function RolesPageContent() {
    const [roles, setRoles] = useState<Role[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingRole, setEditingRole] = useState<Role | null>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    const createForm = useForm<z.infer<typeof createRoleSchema>>({
        resolver: zodResolver(createRoleSchema) as any,
        defaultValues: {
            name: "",
            priorityWeight: 0
        }
    })

    const editForm = useForm<z.infer<typeof editRoleSchema>>({
        resolver: zodResolver(editRoleSchema) as any,
        defaultValues: {
            name: "",
            priorityWeight: 0
        }
    })

    async function loadRoles() {
        try {
            const res = await fetch('/api/roles', { cache: 'no-store' })
            if (res.ok) {
                const result = await res.json()
                if (result.success) {
                    setRoles(result.data)
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
        loadRoles()
    }, [])

    async function onCreate(data: z.infer<typeof createRoleSchema>) {
        try {
            const res = await fetch('/api/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error?.message || 'Failed to create role');
            }

            toast({ title: "Role created successfully" })
            setIsCreateOpen(false)
            createForm.reset()
            loadRoles()
        } catch (e: any) {
            toast({
                title: "Error",
                description: e.message,
                variant: "destructive"
            })
        }
    }

    async function onUpdate(data: z.infer<typeof editRoleSchema>) {
        if (!editingRole) return
        
        try {
            const res = await fetch(`/api/roles/${data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.name,
                    priorityWeight: data.priorityWeight
                })
            })

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error?.message || 'Failed to update role');
            }

            toast({ title: "Role updated successfully" })
            setIsEditOpen(false)
            setEditingRole(null)
            editForm.reset()
            loadRoles()
        } catch (e: any) {
            toast({
                title: "Error",
                description: e.message,
                variant: "destructive"
            })
        }
    }

    async function onDelete(id: string, name: string) {
        if (!confirm(`Are you sure you want to delete role "${name}"? This cannot be undone.`)) return;
        try {
            const res = await fetch(`/api/roles/${id}`, {
                method: 'DELETE'
            })
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error?.message || 'Failed to delete role');
            }
            toast({ title: "Role deleted successfully" })
            loadRoles()
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" })
        }
    }

    function handleEdit(role: Role) {
        setEditingRole(role)
        editForm.reset({
            id: role.id,
            name: role.name,
            priorityWeight: role.priorityWeight
        })
        setIsEditOpen(true)
    }

    return (
        <TooltipProvider>
            <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Roles</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage organizational roles and their priority levels.
                    </p>
                </div>
                {isMounted && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Role
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Role</DialogTitle>
                                <DialogDescription>
                                    Add a new role to define responsibilities and permissions.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...createForm}>
                                <form onSubmit={createForm.handleSubmit(onCreate)} className="space-y-4">
                                    <FormField
                                        control={createForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Role Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., Manager, Developer, HR" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={createForm.control}
                                        name="priorityWeight"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Priority Weight</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="number" 
                                                        placeholder="0" 
                                                        min="0"
                                                        {...field} 
                                                        value={field.value === 0 ? '' : field.value}
                                                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                                <p className="text-xs text-muted-foreground">
                                                    Higher numbers indicate higher priority (0-10+)
                                                </p>
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                        <Button type="submit">Create Role</Button>
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
                            <TableHead>Role Name</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead className="text-center">Areas Used</TableHead>
                            <TableHead className="text-center">Users w/ Role</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    Loading roles...
                                </TableCell>
                            </TableRow>
                        ) : roles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <div className="flex flex-col items-center space-y-2">
                                        <Shield className="h-8 w-8 text-muted-foreground" />
                                        <p className="text-muted-foreground">No roles found.</p>
                                        <p className="text-sm text-muted-foreground">
                                            Create your first role to get started.
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            roles.map((role) => (
                                <TableRow key={role.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            {role.name}
                                        </div>
                                    </TableCell>
                                     <TableCell>
                                         <span className="text-sm text-muted-foreground">
                                             {role.priorityWeight}
                                         </span>
                                     </TableCell>
                                     <TableCell className="text-center">
                                         <Tooltip>
                                             <TooltipTrigger>
                                                 <div className="space-y-1">
                                                     <span className="text-sm text-muted-foreground">
                                                         {role._count?.userRoleAreas || 0}
                                                     </span>
                                                      <p className="text-xs text-muted-foreground">
                                                          Areas used
                                                      </p>
                                                 </div>
                                             </TooltipTrigger>
                                             <TooltipContent>
                                                 <p>Number of business areas this role is assigned to</p>
                                                 {role.userRoleAreas && Array.isArray(role.userRoleAreas) && role.userRoleAreas.length > 0 && (
                                                     <div className="text-xs">
                                                         Areas: {role.userRoleAreas.map((area: any) => area.area?.name || 'Unknown').join(', ')}
                                                     </div>
                                                 )}
                                             </TooltipContent>
                                         </Tooltip>
                                     </TableCell>
                                     <TableCell className="text-center">
                                         <Tooltip>
                                             <TooltipTrigger>
                                                 <div className="space-y-1">
                                                     <span className="text-sm text-muted-foreground">
                                                         {role._count?.usersDefault || 0}
                                                     </span>
                                                     <p className="text-xs text-muted-foreground">
                                                         With role
                                                     </p>
                                                 </div>
                                             </TooltipTrigger>
                                             <TooltipContent>
                                                 <p>Number of users assigned to this role</p>
                                                 {role.usersDefault && Array.isArray(role.usersDefault) && role.usersDefault.length > 0 && (
                                                     <div className="text-xs">
                                                         Users: {role.usersDefault.map((user: any) => `${user.name} ${user.lastname}`).join(', ')}
                                                     </div>
                                                 )}
                                             </TooltipContent>
                                         </Tooltip>
                                     </TableCell>
                                    <TableCell>
                                        {new Date(role.createdAt).toLocaleDateString()}
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
                                                <DropdownMenuItem onClick={() => handleEdit(role)}>
                                                    Edit Role
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => onDelete(role.id, role.name)} 
                                                    className="text-red-600"
                                                >
                                                    Delete Role
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
                        <DialogTitle>Edit Role</DialogTitle>
                        <DialogDescription>
                            Update role details and permissions.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(onUpdate)} className="space-y-4">
                            <FormField
                                control={editForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Manager, Developer, HR" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={editForm.control}
                                name="priorityWeight"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Priority Weight</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                placeholder="0" 
                                                min="0"
                                                {...field} 
                                                value={field.value === 0 ? '' : field.value}
                                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                        <p className="text-xs text-muted-foreground">
                                            Higher numbers indicate higher priority (0-10+)
                                        </p>
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="submit">Update Role</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            </div>
        </TooltipProvider>
    )
}