"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command"
import { toast } from "@/components/ui/use-toast"

// Color presets for projects
const COLOR_PRESETS = [
    { name: "Blue", hex: "#3B82F6" },
    { name: "Green", hex: "#10B981" },
    { name: "Purple", hex: "#8B5CF6" },
    { name: "Pink", hex: "#EC4899" },
    { name: "Orange", hex: "#F97316" },
    { name: "Red", hex: "#EF4444" },
    { name: "Yellow", hex: "#EAB308" },
    { name: "Teal", hex: "#14B8A6" },
    { name: "Indigo", hex: "#6366F1" },
    { name: "Gray", hex: "#6B7280" },
    { name: "Black", hex: "#000000" },
    { name: "White", hex: "#FFFFFF" },
]

export interface ProjectFormValues {
    name: string
    clientId: string | null
    isBillable: boolean
    description: string
    color: string
}

const projectSchema = z.object({
    name: z.string().min(2, "Project name must be at least 2 characters"),
    clientId: z.string().nullable(),
    isBillable: z.boolean().default(true),
    description: z.string().optional(),
    color: z.string().min(1, "Color is required"),
})

interface Client {
    id: string
    name: string
}

interface ProjectDialogProps {
    trigger?: React.ReactNode
    defaultValues?: Partial<ProjectFormValues>
    onSubmit?: (values: ProjectFormValues) => Promise<void>
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function ProjectDialog({ 
    trigger, 
    defaultValues, 
    onSubmit, 
    open: controlledOpen, 
    onOpenChange: controlledOnOpenChange 
}: ProjectDialogProps) {
    const [open, setOpen] = useState(false)
    const [clients, setClients] = useState<Client[]>([])
    const [isCreatingClient, setIsCreatingClient] = useState(false)
    const [newClientName, setNewClientName] = useState("")
    const [clientSearchQuery, setClientSearchQuery] = useState("")
    
    const [selectedColor, setSelectedColor] = useState<string>(
        defaultValues?.color || COLOR_PRESETS[0].hex
    )

    // Handle controlled/uncontrolled state
    const isControlled = controlledOpen !== undefined
    const isOpen = isControlled ? controlledOpen : open
    const setIsOpen = isControlled ? controlledOnOpenChange! : setOpen

    const form = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema) as any,
        defaultValues: {
            name: defaultValues?.name || "",
            clientId: defaultValues?.clientId || null,
            isBillable: defaultValues?.isBillable ?? true,
            description: defaultValues?.description || "",
            color: defaultValues?.color || COLOR_PRESETS[0].hex,
        },
    })

    // Load clients when dialog opens
    useEffect(() => {
        if (isOpen) {
            loadClients()
        }
    }, [isOpen])

    async function loadClients() {
        // Mock data for now - replace with API call
        const mockClients: Client[] = [
            { id: "1", name: "Acme Corp" },
            { id: "2", name: "TechStart Inc" },
            { id: "3", name: "Global Solutions" },
        ]
        setClients(mockClients)
    }

    async function handleSubmit(data: ProjectFormValues) {
        try {
            await onSubmit?.(data)
            setIsOpen(false)
            form.reset()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to save project",
                variant: "destructive",
            })
        }
    }

    async function handleCreateClient() {
        if (!newClientName.trim()) return

        setIsCreatingClient(true)
        try {
            // Mock client creation - replace with API call
            const newClient: Client = {
                id: Date.now().toString(),
                name: newClientName.trim(),
            }
            
            setClients(prev => [...prev, newClient])
            setNewClientName("")
            form.setValue("clientId", newClient.id)
            
            toast({
                title: "Success",
                description: `Client "${newClientName}" created successfully`,
            })
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create client",
                variant: "destructive",
            })
        } finally {
            setIsCreatingClient(false)
        }
    }

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(clientSearchQuery.toLowerCase())
    )

    const selectedClient = clients.find(client => client.id === form.watch("clientId"))

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {trigger ? (
                <DialogTrigger asChild>{trigger}</DialogTrigger>
            ) : (
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Project
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {defaultValues ? "Edit Project" : "Create New Project"}
                    </DialogTitle>
                    <DialogDescription>
                        {defaultValues 
                            ? "Update the project details below."
                            : "Create a new project and assign team members."
                        }
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Project Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Website Redesign" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="clientId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Client</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between"
                                                    >
                                                        {selectedClient ? selectedClient.name : "Select a client..."}
                                                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0" align="start">
                                                <Command>
                                                    <CommandInput
                                                        placeholder="Search clients..."
                                                        value={clientSearchQuery}
                                                        onValueChange={setClientSearchQuery}
                                                    />
                                                    <CommandEmpty>
                                                        <div className="py-2 px-4">
                                                            <Input
                                                                placeholder="Client name..."
                                                                value={newClientName}
                                                                onChange={(e) => setNewClientName(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault()
                                                                        handleCreateClient()
                                                                    }
                                                                }}
                                                            />
                                                            <Button
                                                                onClick={handleCreateClient}
                                                                disabled={!newClientName.trim() || isCreatingClient}
                                                                size="sm"
                                                                className="mt-2 w-full"
                                                            >
                                                                {isCreatingClient ? "Creating..." : `Add "${newClientName.trim()}"`}
                                                            </Button>
                                                        </div>
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {filteredClients.map((client) => (
                                                            <CommandItem
                                                                value={client.id}
                                                                key={client.id}
                                                                onSelect={() => {
                                                                    field.onChange(client.id)
                                                                }}
                                                            >
                                                                {client.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Project description, goals, timeline..."
                                            className="resize-none"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex items-center space-x-4">
                            <FormField
                                control={form.control}
                                name="isBillable"
                                render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2">
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel className="!mt-0">Billable Project</FormLabel>
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-2">
                                <FormLabel>Color</FormLabel>
                                <div className="flex items-center space-x-2">
                                    {COLOR_PRESETS.map((preset) => (
                                        <Button
                                            key={preset.hex}
                                            type="button"
                                            variant={selectedColor === preset.hex ? "default" : "outline"}
                                            size="sm"
                                            className="w-8 h-8 p-0"
                                            onClick={() => {
                                                setSelectedColor(preset.hex)
                                                form.setValue("color", preset.hex)
                                            }}
                                            style={{ backgroundColor: preset.hex }}
                                            title={preset.name}
                                        />
                                    ))}
                                    <Input
                                        type="color"
                                        value={selectedColor}
                                        onChange={(e) => {
                                            setSelectedColor(e.target.value)
                                            form.setValue("color", e.target.value)
                                        }}
                                        className="w-8 h-8 p-0 border-0 cursor-pointer"
                                        title="Custom color"
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="color"
                                    render={({ field }) => (
                                        <FormControl>
                                            <Input type="hidden" {...field} />
                                        </FormControl>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting 
                                    ? "Saving..." 
                                    : defaultValues 
                                        ? "Update Project" 
                                        : "Create Project"
                                }
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}