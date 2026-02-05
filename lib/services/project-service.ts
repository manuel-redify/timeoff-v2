import prisma from '@/lib/prisma'
import { z } from "zod"

export interface ProjectWithRelations {
    id: string
    name: string
    description: string | null
    type: string
    client: string | null
    status: string
    isBillable: boolean
    archived: boolean
    color: string | null
    companyId: string
    createdAt: Date
    updatedAt: Date
    company: {
        id: string
        name: string
    }
    clientObj?: {
        id: string
        name: string
        companyId: string
    } | null
    _count: {
        users: number
    }
}

const createProjectSchema = z.object({
    name: z.string().min(2, "Project name must be at least 2 characters"),
    clientId: z.string().nullable().optional(),
    isBillable: z.boolean().default(true),
    description: z.string().optional(),
    color: z.string().min(1, "Color is required"),
    type: z.string().default("CLIENT_PROJECT"),
})

const updateProjectSchema = z.object({
    name: z.string().min(2, "Project name must be at least 2 characters").optional(),
    clientId: z.string().nullable().optional(),
    isBillable: z.boolean().optional(),
    description: z.string().optional(),
    color: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "COMPLETED"]).optional(),
    archived: z.boolean().optional(),
})

export class ProjectService {
    constructor(private prisma: any) {}

    async getProjects(
        userId?: string,
        search?: string,
        archived?: boolean,
        companyId?: string
    ): Promise<ProjectWithRelations[]> {
        const where: any = {}

        // Filter by company
        if (companyId) {
            where.companyId = companyId
        }

        // Filter by archived status
        if (archived !== undefined) {
            where.archived = archived
        }

        // Search functionality
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { clientObj: { name: { contains: search, mode: "insensitive" } } },
            ]
        }

        const projects = await this.prisma.project.findMany({
            where,
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
            orderBy: [
                { createdAt: "desc" },
            ],
        })

        // Fetch clients separately to avoid Prisma relation issues
        const clientIds = projects.map((p: { clientId: string | null }) => p.clientId).filter(Boolean) as string[]
        const clients = clientIds.length > 0 
            ? await this.prisma.client.findMany({
                where: { id: { in: clientIds } },
                select: { id: true, name: true, companyId: true }
            })
            : []
        
        const clientMap = new Map(clients.map((c: { id: string }) => [c.id, c]))
        
        return projects.map((project: { clientId: string | null }) => ({
            ...project,
            clientObj: project.clientId ? clientMap.get(project.clientId) || null : null
        }))
    }

    async getProjectById(id: string, companyId?: string): Promise<ProjectWithRelations | null> {
        const project = await this.prisma.project.findUnique({
            where: { 
                id,
                ...(companyId && { companyId })
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
        })

        if (!project) return null

        // Fetch client separately if needed
        let clientObj = null
        if (project.clientId) {
            clientObj = await this.prisma.client.findUnique({
                where: { id: project.clientId },
                select: { id: true, name: true, companyId: true }
            })
        }

        return {
            ...project,
            clientObj
        }
    }

    async createProject(
        data: z.infer<typeof createProjectSchema>,
        companyId: string,
        byUserId?: string
    ): Promise<ProjectWithRelations> {
        let validatedData: z.infer<typeof createProjectSchema>
        try {
            validatedData = createProjectSchema.parse(data)
        } catch (error) {
            if (error instanceof z.ZodError) {
                const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
                throw new Error(`Validation failed: ${issues}`)
            }
            throw error
        }

        // Handle client creation if needed
        let clientId = validatedData.clientId
        let clientName: string | null = null
        if (validatedData.clientId && validatedData.clientId.startsWith("new:")) {
            const newClient = await this.prisma.client.create({
                data: {
                    name: validatedData.clientId.replace("new:", ""),
                    companyId,
                },
            })
            clientId = newClient.id
            clientName = newClient.name
        } else if (validatedData.clientId) {
            const existingClient = await this.prisma.client.findUnique({
                where: { id: validatedData.clientId },
                select: { name: true }
            })
            clientName = existingClient?.name || null
        }

        const project = await this.prisma.project.create({
            data: {
                name: validatedData.name,
                description: validatedData.description,
                type: validatedData.type,
                client: clientId,
                clientId: clientId,
                status: "ACTIVE",
                isBillable: validatedData.isBillable,
                archived: false,
                color: validatedData.color,
                companyId,
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                clientObj: {
                    select: {
                        id: true,
                        name: true,
                        companyId: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
        })

        // Create audit log for project creation
        if (byUserId) {
            await this.prisma.audit.create({
                data: {
                    entityType: "Project",
                    entityId: project.id,
                    attribute: "creation",
                    oldValue: null,
                    newValue: JSON.stringify({
                        name: validatedData.name,
                        client: clientName,
                        clientId: clientId,
                        isBillable: validatedData.isBillable,
                        description: validatedData.description,
                        type: validatedData.type,
                        color: validatedData.color,
                        status: "ACTIVE",
                        archived: false,
                    }),
                    companyId,
                    byUserId,
                },
            })
        }

        return project
    }

    async updateProject(
        id: string,
        data: z.infer<typeof updateProjectSchema>,
        companyId: string,
        byUserId?: string
    ): Promise<ProjectWithRelations> {
        const validatedData = updateProjectSchema.parse(data)

        // Fetch existing project for audit diff
        const existingProject = await this.prisma.project.findUnique({
            where: { id, companyId },
            include: {
                clientObj: {
                    select: { name: true }
                }
            }
        })

        if (!existingProject) {
            throw new Error("Project not found")
        }

        // Handle client creation if needed
        let clientId = validatedData.clientId
        let clientName: string | null = existingProject.clientObj?.name || null
        if (validatedData.clientId && validatedData.clientId.startsWith("new:")) {
            const newClient = await this.prisma.client.create({
                data: {
                    name: validatedData.clientId.replace("new:", ""),
                    companyId,
                },
            })
            clientId = newClient.id
            clientName = newClient.name
        } else if (validatedData.clientId && !validatedData.clientId.startsWith("new:")) {
            const existingClient = await this.prisma.client.findUnique({
                where: { id: validatedData.clientId },
                select: { name: true }
            })
            clientName = existingClient?.name || null
        }

        const project = await this.prisma.project.update({
            where: { 
                id,
                companyId
            },
            data: {
                name: validatedData.name,
                description: validatedData.description,
                clientId: validatedData.clientId && !validatedData.clientId.startsWith("new:") ? validatedData.clientId : null,
                status: validatedData.status,
                isBillable: validatedData.isBillable,
                archived: validatedData.archived,
                color: validatedData.color,
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                clientObj: {
                    select: {
                        id: true,
                        name: true,
                        companyId: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
        })

        // Create audit log for project modification
        if (byUserId) {
            const changes: Record<string, { old: any; new: any }> = {}
            
            if (validatedData.name !== undefined && validatedData.name !== existingProject.name) {
                changes.name = { old: existingProject.name, new: validatedData.name }
            }
            if (validatedData.description !== undefined && validatedData.description !== existingProject.description) {
                changes.description = { old: existingProject.description, new: validatedData.description }
            }
            if (validatedData.clientId !== undefined && clientId !== existingProject.clientId) {
                changes.client = { old: existingProject.clientObj?.name || null, new: clientName }
                changes.clientId = { old: existingProject.clientId, new: clientId }
            }
            if (validatedData.status !== undefined && validatedData.status !== existingProject.status) {
                changes.status = { old: existingProject.status, new: validatedData.status }
            }
            if (validatedData.isBillable !== undefined && validatedData.isBillable !== existingProject.isBillable) {
                changes.isBillable = { old: existingProject.isBillable, new: validatedData.isBillable }
            }
            if (validatedData.archived !== undefined && validatedData.archived !== existingProject.archived) {
                changes.archived = { old: existingProject.archived, new: validatedData.archived }
            }
            if (validatedData.color !== undefined && validatedData.color !== existingProject.color) {
                changes.color = { old: existingProject.color, new: validatedData.color }
            }

            if (Object.keys(changes).length > 0) {
                await this.prisma.audit.create({
                    data: {
                        entityType: "Project",
                        entityId: id,
                        attribute: "modification",
                        oldValue: JSON.stringify(changes),
                        newValue: null,
                        companyId,
                        byUserId,
                    },
                })
            }
        }

        return project
    }

    async archiveProject(id: string, companyId: string, byUserId?: string): Promise<ProjectWithRelations> {
        const project = await this.prisma.project.update({
            where: { 
                id,
                companyId
            },
            data: {
                archived: true,
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                clientObj: {
                    select: {
                        id: true,
                        name: true,
                        companyId: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
        })

        // Create audit log for project archiving
        if (byUserId) {
            await this.prisma.audit.create({
                data: {
                    entityType: "Project",
                    entityId: id,
                    attribute: "archived",
                    oldValue: JSON.stringify({ archived: false }),
                    newValue: JSON.stringify({ archived: true }),
                    companyId,
                    byUserId,
                },
            })
        }

        return project
    }

    async unarchiveProject(id: string, companyId: string, byUserId?: string): Promise<ProjectWithRelations> {
        const project = await this.prisma.project.update({
            where: { 
                id,
                companyId
            },
            data: {
                archived: false,
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                clientObj: {
                    select: {
                        id: true,
                        name: true,
                        companyId: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
        })

        // Create audit log for project unarchiving
        if (byUserId) {
            await this.prisma.audit.create({
                data: {
                    entityType: "Project",
                    entityId: id,
                    attribute: "unarchived",
                    oldValue: JSON.stringify({ archived: true }),
                    newValue: JSON.stringify({ archived: false }),
                    companyId,
                    byUserId,
                },
            })
        }

        return project
    }

    async deleteProject(id: string, companyId: string, byUserId?: string): Promise<void> {
        // Fetch project details before deletion for audit log
        const projectToDelete = await this.prisma.project.findUnique({
            where: { id, companyId },
            include: {
                clientObj: {
                    select: { name: true }
                }
            }
        })

        if (!projectToDelete) {
            throw new Error("Project not found")
        }

        // Check if project has users assigned
        const userProjectsCount = await this.prisma.userProject.count({
            where: {
                projectId: id,
            },
        })

        if (userProjectsCount > 0) {
            throw new Error("Cannot delete project with assigned users. Please unassign users first.")
        }

        await this.prisma.project.delete({
            where: { 
                id,
                companyId
            },
        })

        // Create audit log for project deletion
        if (byUserId) {
            await this.prisma.audit.create({
                data: {
                    entityType: "Project",
                    entityId: id,
                    attribute: "deletion",
                    oldValue: JSON.stringify({
                        name: projectToDelete.name,
                        client: projectToDelete.clientObj?.name,
                        clientId: projectToDelete.clientId,
                        isBillable: projectToDelete.isBillable,
                        description: projectToDelete.description,
                        type: projectToDelete.type,
                        color: projectToDelete.color,
                        status: projectToDelete.status,
                        archived: projectToDelete.archived,
                    }),
                    newValue: null,
                    companyId,
                    byUserId,
                },
            })
        }
    }
}

// Singleton instance
let projectServiceInstance: ProjectService | null = null

export function getProjectService(prismaClient: typeof prisma): ProjectService {
    if (!projectServiceInstance) {
        projectServiceInstance = new ProjectService(prismaClient)
    }
    return projectServiceInstance
}