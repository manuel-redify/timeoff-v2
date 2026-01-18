"use client"

import { useEffect, useState } from "react"
import { MoreHorizontal, Plus, Palette } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

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
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

const COLORS = [
    { name: 'Green', hex: '#22AA66' },
    { name: 'Blue', hex: '#459FF3' },
    { name: 'Purple', hex: '#9b59b6' },
    { name: 'Orange', hex: '#e67e22' },
    { name: 'Red', hex: '#e74c3c' },
    { name: 'Yellow', hex: '#f1c40f' },
    { name: 'Pink', hex: '#e91e63' },
    { name: 'Teal', hex: '#1abc9c' },
    { name: 'Brown', hex: '#795548' },
    { name: 'Gray', hex: '#95a5a6' },
]

interface LeaveType {
    id: string
    name: string
    color: string
    useAllowance: boolean
    limit: number | null
    sortOrder: number
    autoApprove: boolean
}

const leaveTypeSchema = z.object({
    name: z.string().min(1, "Name is required"),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
    useAllowance: z.boolean(),
    limit: z.coerce.number().int().min(0).max(365),
    sortOrder: z.coerce.number().int(),
    autoApprove: z.boolean(),
})

type LeaveTypeFormValues = z.infer<typeof leaveTypeSchema>

export default function LeaveTypesPage() {
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingType, setEditingType] = useState<LeaveType | null>(null)
    const [isMounted, setIsMounted] = useState(false)

    const form = useForm<LeaveTypeFormValues>({
        resolver: zodResolver(leaveTypeSchema) as any,
        defaultValues: {
            name: "",
            color: "#22AA66",
            useAllowance: true,
            limit: 0,
            sortOrder: 0,
            autoApprove: false
        }
    })

    async function loadLeaveTypes() {
        try {
            const res = await fetch('/api/leave-types', { cache: 'no-store' })
            if (res.ok) {
                const result = await res.json()
                if (result.success) {
                    setLeaveTypes(result.data)
                }
            }
        } catch (e) {
            console.error(e)
            toast({ title: "Error", description: "Failed to load leave types", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        setIsMounted(true)
        loadLeaveTypes()
    }, [])

    useEffect(() => {
        if (editingType) {
            form.reset({
                name: editingType.name,
                color: editingType.color,
                useAllowance: editingType.useAllowance,
                limit: editingType.limit ?? 0,
                sortOrder: editingType.sortOrder,
                autoApprove: editingType.autoApprove
            })
        } else {
            form.reset({
                name: "",
                color: "#22AA66",
                useAllowance: true,
                limit: 0,
                sortOrder: 0,
                autoApprove: false
            })
        }
    }, [editingType, form])

    async function onSubmit(data: LeaveTypeFormValues) {
        try {
            const url = editingType ? `/api/leave-types/${editingType.id}` : '/api/leave-types'
            const method = editingType ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error?.message || 'Failed to save')
            }

            toast({ title: editingType ? "Leave type updated" : "Leave type created" })
            setIsCreateOpen(false)
            setEditingType(null)
            loadLeaveTypes()
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" })
        }
    }

    async function onDelete(id: string) {
        if (!confirm("Are you sure? This cannot be undone.")) return
        try {
            const res = await fetch(`/api/leave-types/${id}`, {
                method: 'DELETE'
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error?.message || 'Failed to delete')
            }
            toast({ title: "Leave type deleted" })
            loadLeaveTypes()
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" })
        }
    }

    if (!isMounted) return null

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Leave Types</h3>
                    <p className="text-sm text-muted-foreground">
                        Configure existence categories and their associated rules.
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={(open) => {
                    setIsCreateOpen(open)
                    if (!open) setEditingType(null)
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Leave Type
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingType ? 'Edit Leave Type' : 'Create Leave Type'}</DialogTitle>
                            <DialogDescription>
                                Set colors and rules for this absence category.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...(form as any)}>
                            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
                                <FormField
                                    control={form.control as any}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Holiday" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="color"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Color</FormLabel>
                                            <FormControl>
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    {COLORS.map((c) => (
                                                        <button
                                                            key={c.hex}
                                                            type="button"
                                                            className={`h-8 w-8 rounded-full border-2 transition-all ${field.value === c.hex ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent'}`}
                                                            style={{ backgroundColor: c.hex }}
                                                            onClick={() => field.onChange(c.hex)}
                                                            title={c.name}
                                                        />
                                                    ))}
                                                    <div className="flex items-center ml-2 border rounded-md px-2 bg-muted/30">
                                                        <Palette className="h-4 w-4 mr-2 text-muted-foreground" />
                                                        <Input
                                                            {...field}
                                                            className="h-7 w-20 border-none bg-transparent p-0 text-xs uppercase"
                                                            maxLength={7}
                                                        />
                                                    </div>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control as any}
                                        name="limit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Annual Limit (Days)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                                <FormDescription>0 = Unlimited</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control as any}
                                        name="sortOrder"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Sort Order</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                                <FormDescription>Lower shows first</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FormField
                                        control={form.control as any}
                                        name="useAllowance"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Deducts from Allowance</FormLabel>
                                                    <FormDescription>Does this count toward the annual limit?</FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control as any}
                                        name="autoApprove"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Auto-Approve</FormLabel>
                                                    <FormDescription>Approve requests immediately?</FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => {
                                        setIsCreateOpen(false)
                                        setEditingType(null)
                                    }}>Cancel</Button>
                                    <Button type="submit">{editingType ? 'Save Changes' : 'Create'}</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
            <Separator />

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Color</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Allowance</TableHead>
                            <TableHead>Auto-Approve</TableHead>
                            <TableHead className="text-right">Limit</TableHead>
                            <TableHead className="text-right">Order</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
                        ) : leaveTypes.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-8">No leave types found. Please refresh or create one.</TableCell></TableRow>
                        ) : (
                            leaveTypes.map((type) => (
                                <TableRow key={type.id}>
                                    <TableCell>
                                        <div
                                            className="h-6 w-12 rounded border"
                                            style={{ backgroundColor: type.color }}
                                            title={type.color}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {type.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={type.useAllowance ? "default" : "secondary"}>
                                            {type.useAllowance ? "Deducts" : "Separate"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={type.autoApprove ? "outline" : "secondary"} className={type.autoApprove ? "border-green-500 text-green-500" : ""}>
                                            {type.autoApprove ? "Yes" : "No"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {type.limit ? `${type.limit} days` : 'Unlimited'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {type.sortOrder}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    < MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => {
                                                    setEditingType(type)
                                                    setIsCreateOpen(true)
                                                }}>
                                                    Edit Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onDelete(type.id)} className="text-red-600">
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
