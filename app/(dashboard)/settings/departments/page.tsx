"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { MoreHorizontal, Plus } from "lucide-react"

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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"

interface Department {
    id: string
    name: string
    allowance: number | null
    includePublicHolidays: boolean
    isAccruedAllowance: boolean
    boss?: {
        name: string
        lastname: string
    }
    _count: {
        users: number
    }
}

const createDepartmentSchema = z.object({
    name: z.string().min(2),
    allowance: z.coerce.number().optional(),
    includePublicHolidays: z.boolean().default(true),
    isAccruedAllowance: z.boolean().default(false),
    bossId: z.string().optional(),
})

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([])
    const [users, setUsers] = useState<Array<{ id: string, name: string, lastname: string }>>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    const form = useForm<z.infer<typeof createDepartmentSchema>>({
        resolver: zodResolver(createDepartmentSchema) as any,
        defaultValues: {
            name: "",
            includePublicHolidays: true,
            isAccruedAllowance: false
        }
    })

    async function loadDepartments() {
        try {
            const res = await fetch('/api/departments', { cache: 'no-store' })
            if (res.ok) {
                const result = await res.json()
                if (result.success) {
                    setDepartments(result.data)
                }
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }

    async function loadUsers() {
        try {
            const res = await fetch('/api/users', { cache: 'no-store' })
            if (res.ok) {
                const json = await res.json()
                setUsers(json.data || json)
            }
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        setIsMounted(true)
        loadDepartments()
        loadUsers()
    }, [])

    async function onCreate(data: z.infer<typeof createDepartmentSchema>) {
        try {
            const res = await fetch('/api/departments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error?.message || 'Failed to create');
            }

            toast({ title: "Department created" })
            setIsCreateOpen(false)
            form.reset()
            loadDepartments()
        } catch (e: any) {
            toast({
                title: "Error",
                description: e.message,
                variant: "destructive"
            })
        }
    }

    async function onDelete(id: string) {
        if (!confirm("Are you sure? This cannot be undone.")) return;
        try {
            const res = await fetch(`/api/departments/${id}`, {
                method: 'DELETE'
            })
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error?.message || 'Failed to delete');
            }
            toast({ title: "Department deleted" })
            loadDepartments()
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Departments</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage departments and their supervisors.
                    </p>
                </div>
                {isMounted && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Department
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Department</DialogTitle>
                                <DialogDescription>
                                    Add a new department to your organization.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Engineering" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="bossId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Head of Department (Optional)</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a user" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {users.map((user) => (
                                                            <SelectItem key={user.id} value={user.id}>
                                                                {user.name} {user.lastname}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="allowance"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Default Allowance (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="20" {...field} value={field.value ?? ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex items-center space-x-2">
                                        <FormField
                                            control={form.control}
                                            name="includePublicHolidays"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center space-x-2">
                                                    <FormControl>
                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="!mt-0">Include Public Holidays</FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <FormField
                                            control={form.control}
                                            name="isAccruedAllowance"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center space-x-2">
                                                    <FormControl>
                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="!mt-0">Accrued Allowance</FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit">Create</Button>
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
                            <TableHead>Name</TableHead>
                            <TableHead>Supervisor</TableHead>
                            <TableHead className="text-right">Employees</TableHead>
                            <TableHead className="text-right">Allowance</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
                        ) : departments.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center">No departments found.</TableCell></TableRow>
                        ) : (
                            departments.map((dept) => (
                                <TableRow key={dept.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/settings/departments/${dept.id}`} className="hover:underline">
                                            {dept.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        {dept.boss ? `${dept.boss.name} ${dept.boss.lastname}` : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">{dept._count.users}</TableCell>
                                    <TableCell className="text-right">{dept.allowance ?? 'Default'}</TableCell>
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
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/settings/departments/${dept.id}`}>Edit Details</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onDelete(dept.id)} className="text-red-600">
                                                    Delete
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
        </div>
    )
}
