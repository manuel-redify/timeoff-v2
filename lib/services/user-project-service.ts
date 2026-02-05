import { z } from "zod"
import prisma from "@/lib/prisma"

export interface UserProjectWithDetails {
    id: string
    userId: string
    projectId: string
    roleId: string | null
    allocation: number
    startDate: string
    endDate: string | null
    createdAt: Date
    updatedAt: Date
    project?: {
        id: string
        name: string
        status: string
        archived: boolean
    }
    role?: {
        id: string
        name: string
    }
}

const syncUserProjectsSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    assignments: z.array(z.object({
        projectId: z.string().min(1, "Project is required"),
        roleId: z.string().nullable(),
        allocation: z.number().min(0, "Allocation must be at least 0").max(100, "Allocation cannot exceed 100%"),
        startDate: z.string().min(1, "Start date is required"),
        endDate: z.string().nullable(),
    })),
})

export class UserProjectService {
    constructor(private prisma: any) {}

    async getUserProjects(userId: string): Promise<UserProjectWithDetails[]> {
        return await this.prisma.userProject.findMany({
            where: {
                userId,
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        archived: true,
                    },
                },
                role: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: [
                { createdAt: "desc" },
            ],
        })
    }

    async syncUserProjects(
        userId: string,
        incomingAssignments: z.infer<typeof syncUserProjectsSchema>["assignments"]
    ): Promise<UserProjectWithDetails[]> {
        const existingProjects = await this.getUserProjects(userId)
        
        // Create a map of existing projects for easy lookup
        const existingProjectsMap = new Map(
            existingProjects.map(p => [p.projectId, p])
        )

        const toCreate: UserProjectWithDetails[] = []
        const toUpdate: UserProjectWithDetails[] = []
        const toDelete: UserProjectWithDetails[] = []

        // Process each incoming assignment
        for (const incoming of incomingAssignments) {
            const existing = existingProjectsMap.get(incoming.projectId)
            
            if (!existing) {
                // Create new project assignment
                toCreate.push({
                    id: crypto.randomUUID(),
                    userId,
                    projectId: incoming.projectId,
                    roleId: incoming.roleId,
                    allocation: incoming.allocation,
                    startDate: incoming.startDate,
                    endDate: incoming.endDate,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
            } else {
                // Update existing assignment
                const updatedData: Partial<UserProjectWithDetails> = {
                    roleId: incoming.roleId,
                    allocation: incoming.allocation,
                    startDate: incoming.startDate,
                    endDate: incoming.endDate,
                    updatedAt: new Date(),
                }

                // Check if any actual changes were made
                const hasChanges = (
                    existing.roleId !== incoming.roleId ||
                    existing.allocation !== incoming.allocation ||
                    existing.startDate !== incoming.startDate ||
                    existing.endDate !== incoming.endDate
                )

                if (hasChanges) {
                    toUpdate.push({
                        ...existing,
                        ...updatedData,
                    })
                } else {
                    // No changes, but still include in toUpdate to ensure it stays
                    toUpdate.push(existing)
                }
            }
        }

        // Perform database operations
        await this.prisma.userProject.createMany({
            data: toCreate,
        })

        for (const update of toUpdate) {
            await this.prisma.userProject.update({
                where: { id: update.id },
                data: {
                    roleId: update.roleId,
                    allocation: update.allocation,
                    startDate: update.startDate,
                    endDate: update.endDate,
                },
            })
        }

        if (toDelete.length > 0) {
            await this.prisma.userProject.deleteMany({
                where: {
                    id: {
                        in: toDelete.map(d => d.id),
                    },
                },
            })
        }

        // Return updated list
        return await this.getUserProjects(userId)
    }
}

// Singleton instance
let userProjectServiceInstance: UserProjectService | null = null

export function getUserProjectService(prismaInstance: any): UserProjectService {
    if (!userProjectServiceInstance) {
        userProjectServiceInstance = new UserProjectService(prismaInstance)
    }
    return userProjectServiceInstance
}