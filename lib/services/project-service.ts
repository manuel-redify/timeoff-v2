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
    clientId: z.string().nullable(),
    isBillable: z.boolean().default(true),
    description: z.string().optional(),
    color: z.string().optional(),
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

        return await this.prisma.project.findMany({
            where,
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
            orderBy: [
                { createdAt: "desc" },
            ],
        })
    }

    async getProjectById(id: string, companyId?: string): Promise<ProjectWithRelations | null> {
        return await this.prisma.project.findUnique({
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
    }

    async createProject(
        data: z.infer<typeof createProjectSchema>,
        companyId: string
    ): Promise<ProjectWithRelations> {
        const validatedData = createProjectSchema.parse(data)

        // Handle client creation if needed
        let clientId = validatedData.clientId
        if (validatedData.clientId && validatedData.clientId.startsWith("new:")) {
            const newClient = await this.prisma.client.create({
                data: {
                    name: validatedData.clientId.replace("new:", ""),
                    companyId,
                },
            })
            clientId = newClient.id
        }

        const project = await this.prisma.project.create({
            data: {
                name: validatedData.name,
                description: validatedData.description,
                type: validatedData.type,
                client: validatedData.clientId && !validatedData.clientId.startsWith("new:") ? validatedData.clientId : null,
                clientId: validatedData.clientId && !validatedData.clientId.startsWith("new:") ? validatedData.clientId : null,
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

        return project
    }

    async updateProject(
        id: string,
        data: z.infer<typeof updateProjectSchema>,
        companyId: string
    ): Promise<ProjectWithRelations> {
        const validatedData = updateProjectSchema.parse(data)

        // Handle client creation if needed
        let clientId = validatedData.clientId
        if (validatedData.clientId && validatedData.clientId.startsWith("new:")) {
            const newClient = await this.prisma.client.create({
                data: {
                    name: validatedData.clientId.replace("new:", ""),
                    companyId,
                },
            })
            clientId = newClient.id
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

        return project
    }

    async deleteProject(id: string, companyId: string): Promise<void> {
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