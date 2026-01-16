"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Plus, Trash2, Calendar } from "lucide-react"

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"

interface BankHoliday {
    id: string
    name: string
    date: string
    country: string
}

const createHolidaySchema = z.object({
    name: z.string().min(2),
    date: z.string().min(1), // Input type=date gives YYYY-MM-DD
    country: z.string().length(2),
})

const importSchema = z.object({
    country: z.string().length(2)
})

export default function BankHolidaysPage() {
    const [holidays, setHolidays] = useState<BankHoliday[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isImportOpen, setIsImportOpen] = useState(false)
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
    const [selectedCountry, setSelectedCountry] = useState<string>("")
    const [availableCountries, setAvailableCountries] = useState<string[]>([])

    const createForm = useForm<z.infer<typeof createHolidaySchema>>({
        resolver: zodResolver(createHolidaySchema),
        defaultValues: { name: "", date: "", country: selectedCountry || "" }
    })

    const importForm = useForm<z.infer<typeof importSchema>>({
        resolver: zodResolver(importSchema),
        defaultValues: { country: selectedCountry || "UK" }
    })

    // Load available countries
    async function loadCountries() {
        try {
            const res = await fetch('/api/holidays/countries')
            if (res.ok) {
                const result = await res.json()
                if (result.success && result.data.length > 0) {
                    setAvailableCountries(result.data)
                    if (!selectedCountry) {
                        setSelectedCountry(result.data[0]) // Default to first country
                    }
                }
            }
        } catch (e) {
            console.error(e)
        }
    }

    async function loadHolidays() {
        if (!selectedCountry) return

        try {
            const res = await fetch(`/api/holidays?year=${currentYear}&country=${selectedCountry}`)
            if (res.ok) {
                const result = await res.json()
                if (result.success) {
                    setHolidays(result.data)
                }
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadCountries()
    }, [])

    useEffect(() => {
        if (selectedCountry) {
            loadHolidays()
        }
    }, [currentYear, selectedCountry])

    async function onCreate(data: z.infer<typeof createHolidaySchema>) {
        try {
            const res = await fetch('/api/holidays', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!res.ok) throw new Error('Failed to create')

            toast({ title: "Holiday created" })
            setIsCreateOpen(false)
            createForm.reset()
            loadHolidays()
        } catch (e) {
            toast({ title: "Error", variant: "destructive" })
        }
    }

    async function onImport(data: z.infer<typeof importSchema>) {
        try {
            const res = await fetch('/api/holidays/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!res.ok) throw new Error('Failed to import')

            toast({ title: "Holidays imported" })
            setIsImportOpen(false)
            loadHolidays()
        } catch (e) {
            toast({ title: "Error", variant: "destructive" })
        }
    }

    async function onDelete(id: string) {
        if (!confirm("Delete holiday?")) return
        try {
            const res = await fetch(`/api/holidays/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete')
            toast({ title: "Holiday deleted" })
            loadHolidays()
        } catch (e) {
            toast({ title: "Error", variant: "destructive" })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Bank Holidays</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage public holidays for your organization.
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">Import</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Import Holidays</DialogTitle>
                                <DialogDescription>Import standard holidays for a country.</DialogDescription>
                            </DialogHeader>
                            <Form {...importForm}>
                                <form onSubmit={importForm.handleSubmit(onImport)} className="space-y-4">
                                    <FormField
                                        control={importForm.control}
                                        name="country"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Country</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select country" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {availableCountries.map((country) => (
                                                            <SelectItem key={country} value={country}>
                                                                {country}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                        <Button type="submit">Import</Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Holiday
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add custom holiday</DialogTitle>
                            </DialogHeader>
                            <Form {...createForm}>
                                <form onSubmit={createForm.handleSubmit(onCreate)} className="space-y-4">
                                    <FormField
                                        control={createForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Founder's Day" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={createForm.control}
                                        name="date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Date</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={createForm.control}
                                        name="country"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Country</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || selectedCountry}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select country" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {availableCountries.map((country) => (
                                                            <SelectItem key={country} value={country}>
                                                                {country}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                        <Button type="submit">Add</Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <Separator />

            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium">Country:</label>
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableCountries.map((country) => (
                                <SelectItem key={country} value={country}>
                                    {country}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentYear(currentYear - 1)}>&lt;</Button>
                    <span className="text-lg font-bold">{currentYear}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentYear(currentYear + 1)}>&gt;</Button>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead className="w-[100px]">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
                        ) : holidays.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center">No holidays found for {currentYear}.</TableCell></TableRow>
                        ) : (
                            holidays.map((h) => (
                                <TableRow key={h.id}>
                                    <TableCell>{format(new Date(h.date), 'dd MMM yyyy')}</TableCell>
                                    <TableCell>{h.name}</TableCell>
                                    <TableCell>{h.country}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => onDelete(h.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
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
