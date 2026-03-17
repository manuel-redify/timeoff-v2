import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Trash2 } from "lucide-react"
import { UseFormSetValue, UseFormWatch } from "react-hook-form"

interface ProjectFieldRowProps {
    index: number
    form: any
    field: any
    activeProjects: any[]
    roles: any[]
    onRemove: () => void
    disabled: boolean
}

export function ProjectFieldRow({ 
    index, 
    form, 
    field, 
    activeProjects, 
    roles, 
    onRemove, 
    disabled 
}: ProjectFieldRowProps) {
    const selectedProject = activeProjects.find(p => p.id === field.value)
    const selectedRole = roles.find(r => r.id === field.value)

    return (
        <div key={field.id} className="space-y-4">
            {/* Project Select */}
            <FormField
                control={form.control}
                name={`assignments.${index}.projectId`}
                render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>Project *</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={disabled}
                        >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {activeProjects.map((project) => (
                                    <SelectItem key={project.id} value={project.id}>
                                        {project.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Role Select */}
            <FormField
                control={form.control}
                name={`assignments.${index}.roleId`}
                render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                            disabled={disabled}
                        >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Use default role" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="default">Use default role</SelectItem>
                                {roles.map((role) => (
                                    <SelectItem key={role.id} value={role.id}>
                                        {role.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Allocation Input */}
            <FormField
                control={form.control}
                name={`assignments.${index}.allocation`}
                render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>Allocation</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="100"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                    disabled={disabled}
                                />
                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                                    %
                                </span>
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Start Date */}
            <FormField
                control={form.control}
                name={`assignments.${index}.startDate`}
                render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>Start Date *</FormLabel>
                        <FormControl>
                            <Input
                                type="date"
                                {...field}
                                disabled={disabled}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* End Date */}
            <FormField
                control={form.control}
                name={`assignments.${index}.endDate`}
                render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                            <Input
                                type="date"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value || null)}
                                disabled={disabled}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Remove Button */}
            {!disabled && (
                <div className="flex justify-end">
                    <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onRemove()}
                            className="text-red-600 hover:text-red-700"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove Assignment
                    </Button>
                </div>
            )}
        </div>
    )
}