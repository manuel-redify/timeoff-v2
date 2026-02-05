"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface ProjectDetailDialogProps {
    project: {
        id: string
        name: string
        description?: string | null
        clientObj?: {
            id: string
            name: string
            companyId: string
        } | null
        status: string
        isBillable: boolean
        archived: boolean
        color?: string | null
        _count: {
            userProjects: number
        }
    } | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onEdit?: () => void
}

export function ProjectDetailDialog({
    project,
    open,
    onOpenChange,
    onEdit,
}: ProjectDetailDialogProps) {
    if (!project) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: project.color || "#3B82F6" }}
                        />
                        {project.name}
                    </DialogTitle>
                    <DialogDescription>
                        Project details and information
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    {project.description && (
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                            <p className="mt-1 text-sm">{project.description}</p>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                            <Badge 
                                variant={project.archived ? "secondary" : project.status === "ACTIVE" ? "default" : "outline"}
                                className="mt-1"
                            >
                                {project.archived ? "Archived" : project.status}
                            </Badge>
                        </div>
                        
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Billable</h4>
                            <Badge 
                                variant={project.isBillable ? "default" : "outline"}
                                className="mt-1"
                            >
                                {project.isBillable ? "Billable" : "Non-billable"}
                            </Badge>
                        </div>
                        
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Client</h4>
                            <p className="mt-1 text-sm">
                                {project.clientObj?.name || "No client"}
                            </p>
                        </div>
                        
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Team Members</h4>
                            <p className="mt-1 text-sm">{project._count.userProjects} members</p>
                        </div>
                    </div>
                </div>
                
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    {onEdit && (
                        <Button onClick={onEdit}>
                            Edit Project
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
