"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import * as z from "zod"
import { ArrowLeft, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

const departmentFormSchema = z.object({
    name: z.string().min(2),
    allowance: z.coerce.number().nullable(),
    includePublicHolidays: z.boolean(),
    isAccruedAllowance: z.boolean(),
    isUnlimitedAllowance: z.boolean(),
    bossId: z.string().optional().nullable()
})

interface User {
    id: string
    name: string
    lastname: string
}

interface Supervisor {
    user: User
}

export default function DepartmentDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [isLoading, setIsLoading] = useState(true)
    const [supervisors, setSupervisors] = useState<Supervisor[]>([])
    const [users, setUsers] = useState<User[]>([]) // For boss selection
    const [potentialSupervisors, setPotentialSupervisors] = useState<User[]>([]) // For adding supervisors
    const [selectedNewSupervisor, setSelectedNewSupervisor] = useState("")

    const form = useForm<z.infer<typeof departmentFormSchema>>({
        resolver: zodResolver(departmentFormSchema) as any,
        defaultValues: {
            name: "",
            includePublicHolidays: true,
            isAccruedAllowance: false,
            isUnlimitedAllowance: false
        }
    })

    const [isUnlimitedAllowance] = useWatch({
        control: form.control,
        name: ['isUnlimitedAllowance']
    })

    async function loadData() {
        try {
            // Load department
            const resDept = await fetch(`/api/departments/${id}`)
            if (!resDept.ok) throw new Error('Failed to load department')
            const dataDept = await resDept.json()

            if (dataDept.success) {
                const dept = dataDept.data;
                form.reset({
                    name: dept.name,
                    allowance: dept.allowance,
                    includePublicHolidays: dept.includePublicHolidays,
                    isAccruedAllowance: dept.isAccruedAllowance,
                    isUnlimitedAllowance: dept.isUnlimitedAllowance || false,
                    bossId: dept.bossId
                });
                setSupervisors(dept.supervisors || []);
            }

            // Load all users for dropdowns
            const resUsers = await fetch('/api/users', { cache: 'no-store' })
            if (resUsers.ok) {
                const json = await resUsers.json()
                const dataUsers = json.data || json
                setUsers(dataUsers)
                // Filter out users who are already supervisors for potential supervisors list
                const supervisorIds = supervisors.map(s => s.user.id)
                setPotentialSupervisors(dataUsers.filter((u: User) => !supervisorIds.includes(u.id)))
            }
        } catch (e) {
            console.error(e)
            toast({ title: "Error loading data", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [id])

    async function onSubmit(data: z.infer<typeof departmentFormSchema>) {
        try {
            const res = await fetch(`/api/departments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!res.ok) throw new Error('Failed to update')

            toast({ title: "Department updated" })
        } catch (e) {
            toast({ title: "Error", description: "Failed to update settings.", variant: "destructive" })
        }
    }

    async function addSupervisor() {
        if (!selectedNewSupervisor) return;
        try {
            const res = await fetch(`/api/departments/${id}/supervisors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selectedNewSupervisor })
            })
            if (!res.ok) throw new Error('Failed to add supervisor')
            toast({ title: "Supervisor added" })
            loadData() // Refresh list
            setSelectedNewSupervisor("")
        } catch (e) {
            toast({ title: "Error", variant: "destructive" })
        }
    }

    async function removeSupervisor(userId: string) {
        if (!confirm("Remove supervisor?")) return;
        try {
            const res = await fetch(`/api/departments/${id}/supervisors/${userId}`, {
                method: 'DELETE'
            })
            if (!res.ok) throw new Error('Failed to remove supervisor')
            toast({ title: "Supervisor removed" })
            loadData()
        } catch (e) {
            toast({ title: "Error", variant: "destructive" })
        }
    }

    if (isLoading) return <div>Loading...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h3 className="text-lg font-medium">Edit Department</h3>
                    <p className="text-sm text-muted-foreground">
                        Configure general settings and supervisors.
                    </p>
                </div>
            </div>
            <Separator />

            <Tabs defaultValue="general" className="w-full">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="supervisors">Supervisors</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="space-y-4 pt-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="allowance"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Allowance Override</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    {...field} 
                                                    value={field.value ?? ''} 
                                                    onChange={e => field.onChange(e.target.valueAsNumber || null)} 
                                                    placeholder="Use Company Default"
                                                    disabled={isUnlimitedAllowance}
                                                />
                                            </FormControl>
                                            <FormDescription>Leave empty to use company default</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bossId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Head of Department</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a user" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="__none__">None</SelectItem>
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
                            </div>
                            <div className="flex flex-col space-y-4">
                                <FormField
                                    control={form.control}
                                    name="isUnlimitedAllowance"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Unlimited Allowance</FormLabel>
                                                <FormDescription>No limit on leave days for this department</FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="includePublicHolidays"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Include Public Holidays</FormLabel>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="isAccruedAllowance"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Accrued Allowance</FormLabel>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <Button type="submit">Save Changes</Button>
                        </form>
                    </Form>
                </TabsContent>
                <TabsContent value="supervisors" className="space-y-4 pt-4">
                    <div className="flex items-end gap-2 max-w-md">
                        <div className="grid w-full items-center gap-1.5">
                            <Select value={selectedNewSupervisor} onValueChange={setSelectedNewSupervisor}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a user to add as supervisor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {potentialSupervisors.map((user) => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {user.name} {user.lastname}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={addSupervisor} disabled={!selectedNewSupervisor}>Add</Button>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="w-[100px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {supervisors.length === 0 ? (
                                    <TableRow><TableCell colSpan={2} className="text-center">No secondary supervisors.</TableCell></TableRow>
                                ) : (
                                    supervisors.map((s) => (
                                        <TableRow key={s.user.id}>
                                            <TableCell>{s.user.name} {s.user.lastname}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => removeSupervisor(s.user.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
