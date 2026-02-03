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
import { Textarea } from "@/components/ui/textarea"
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

interface ContractType {
    id: string
    name: string
    description: string | null
    color: string
    employeeCount: number
    createdAt: string
}

const contractTypeSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
})

type ContractTypeFormValues = z.infer<typeof contractTypeSchema>

export default function ContractTypesPage() {
    const [contractTypes, setContractTypes] = useState<ContractType[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingType, setEditingType] = useState<ContractType | null>(null)
    const [isMounted, setIsMounted] = useState(false)

    const form = useForm<ContractTypeFormValues>({
        resolver: zodResolver(contractTypeSchema) as any,
        defaultValues: {
            name: "",
            description: "",
            color: "#22AA66",
        }
    })

    async function loadContractTypes() {
        try {
            const res = await fetch('/api/contract-types', { cache: 'no-store' })
            if (res.ok) {
                const result = await res.json()
                if (result.success) {
                    setContractTypes(result.data)
                }
            }
        } catch (e: unknown) {
            console.error('Load contract types error:', e)
            const errorMessage = e instanceof Error ? e.message : "Failed to load contract types"
            toast({ title: "Error", description: errorMessage, variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        setIsMounted(true)
        loadContractTypes()
    }, [])

    useEffect(() => {
        if (editingType) {
            form.reset({
                name: editingType.name,
                description: editingType.description || "",
                color: editingType.color,
            })
        } else {
            form.reset({
                name: "",
                description: "",
                color: "#22AA66",
            })
        }
    }, [editingType, form])

    async function onSubmit(data: ContractTypeFormValues) {
        try {
            const url = editingType ? `/api/contract-types/${editingType.id}` : '/api/contract-types'
            const method = editingType ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!res.ok) {
                try {
                    const err = await res.json()
                    throw new Error(err.error?.message || 'Failed to save')
                } catch {
                    // If response is not JSON, handle gracefully
                    const text = await res.text()
                    throw new Error(`Server error: ${res.status} ${res.statusText}`)
                }
            }

            toast({ title: editingType ? "Contract type updated" : "Contract type created" })
            setIsCreateOpen(false)
            setEditingType(null)
            loadContractTypes()
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Failed to save contract type'
            toast({ title: "Error", description: errorMessage, variant: "destructive" })
        }
    }

    async function onDelete(id: string, employeeCount: number) {
        const message = employeeCount > 0 
            ? `Are you sure? This contract type is used by ${employeeCount} employee(s). Reassign them first.`
            : "Are you sure? This cannot be undone."
        
        if (!confirm(message)) return
        try {
            const res = await fetch(`/api/contract-types/${id}`, {
                method: 'DELETE'
            })
            if (!res.ok) {
                try {
                    const err = await res.json()
                    throw new Error(err.error?.message || 'Failed to delete')
                } catch {
                    // If response is not JSON, handle gracefully
                    const text = await res.text()
                    throw new Error(`Server error: ${res.status} ${res.statusText}`)
                }
            }
            toast({ title: "Contract type deleted" })
            loadContractTypes()
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Failed to delete contract type'
            toast({ title: "Error", description: errorMessage, variant: "destructive" })
        }
    }

    if (!isMounted) return null

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Contract Types</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage employee contract categories and their properties.
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={(open) => {
                    setIsCreateOpen(open)
                    if (!open) setEditingType(null)
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Contract Type
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingType ? 'Edit Contract Type' : 'Create Contract Type'}</DialogTitle>
                            <DialogDescription>
                                Define contract categories for employee classification.
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
                                                <Input placeholder="Full-time" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    placeholder="Optional description of this contract type"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>Optional: Add details about this contract type</FormDescription>
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
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Employees</TableHead>
                            <TableHead className="text-right">Created</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
                        ) : contractTypes.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-8">No contract types found. Please create one.</TableCell></TableRow>
                        ) : (
                            contractTypes.map((type) => (
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
                                        <span className="text-sm text-muted-foreground">
                                            {type.description || '—'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={type.employeeCount > 0 ? "default" : "secondary"}>
                                            {type.employeeCount}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="text-sm text-muted-foreground">
                                            {new Date(type.createdAt).toLocaleDateString()}
                                        </span>
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
                                                <DropdownMenuItem onClick={() => {
                                                    setEditingType(type)
                                                    setIsCreateOpen(true)
                                                }}>
                                                    Edit Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => onDelete(type.id, type.employeeCount)} 
                                                    className="text-red-600"
                                                    disabled={type.employeeCount > 0}
                                                >
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