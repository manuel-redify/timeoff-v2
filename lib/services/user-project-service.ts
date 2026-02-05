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
    assignments: z.array(z.object({
        projectId: z.string().min(1, "Project is required"),
        roleId: z.string().nullable().optional(),
        allocation: z.number().min(0, "Allocation must be at least 0").max(100, "Allocation cannot exceed 100%"),
        startDate: z.string().min(1, "Start date is required"),
        endDate: z.string().nullable().optional(),
    })),
})

function formatDateForPrisma(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null
    // Ensure date is in ISO-8601 format (YYYY-MM-DD -> YYYY-MM-DDTHH:mm:ss.sssZ)
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return null
    return date.toISOString()
}

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
        incomingAssignments: z.infer<typeof syncUserProjectsSchema>["assignments"],
        companyId?: string,
        byUserId?: string
    ): Promise<UserProjectWithDetails[]> {
        const existingProjects = await this.getUserProjects(userId)
        
        // Create a map of existing projects for easy lookup
        const existingProjectsMap = new Map(
            existingProjects.map(p => [p.projectId, p])
        )

        // Track which existing projects are being kept
        const processedProjectIds = new Set<string>()

        const toCreate: UserProjectWithDetails[] = []
        const toUpdate: UserProjectWithDetails[] = []
        const toDelete: UserProjectWithDetails[] = []

        // Process each incoming assignment
        for (const incoming of incomingAssignments) {
            const existing = existingProjectsMap.get(incoming.projectId)
            processedProjectIds.add(incoming.projectId)
            
            if (!existing) {
                // Create new project assignment
                toCreate.push({
                    id: crypto.randomUUID(),
                    userId,
                    projectId: incoming.projectId,
                    roleId: incoming.roleId ?? null,
                    allocation: incoming.allocation,
                    startDate: formatDateForPrisma(incoming.startDate)!,
                    endDate: formatDateForPrisma(incoming.endDate),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
            } else {
                // Update existing assignment
                const updatedData: Partial<UserProjectWithDetails> = {
                    roleId: incoming.roleId ?? null,
                    allocation: incoming.allocation,
                    startDate: formatDateForPrisma(incoming.startDate)!,
                    endDate: formatDateForPrisma(incoming.endDate),
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

        // Find assignments to delete (existing ones not in incoming)
        for (const existing of existingProjects) {
            if (!processedProjectIds.has(existing.projectId)) {
                toDelete.push(existing)
            }
        }

        // Fetch project and user details for audit logs
        const projectNames: Map<string, string> = new Map()
        let userEmail: string | null = null
        const roleNames: Map<string | null, string | null> = new Map()

        if (byUserId && companyId) {
            // Get user email
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { email: true }
            })
            userEmail = user?.email || null

            // Get project names
            const projectIds = [...toCreate.map(p => p.projectId), ...toUpdate.map(p => p.projectId), ...toDelete.map(p => p.projectId)]
            if (projectIds.length > 0) {
                const projects = await this.prisma.project.findMany({
                    where: { id: { in: projectIds } },
                    select: { id: true, name: true }
                })
                projects.forEach((p: { id: string; name: string }) => projectNames.set(p.id, p.name))
            }

            // Get role names
            const roleIds = [...toCreate.map(p => p.roleId), ...toUpdate.map(p => p.roleId), ...toDelete.map(p => p.roleId)].filter(Boolean) as string[]
            if (roleIds.length > 0) {
                const roles = await this.prisma.role.findMany({
                    where: { id: { in: roleIds } },
                    select: { id: true, name: true }
                })
                roles.forEach((r: { id: string; name: string }) => roleNames.set(r.id, r.name))
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

        // Create audit logs
        if (byUserId && companyId) {
            const auditLogs = []

            // Log new assignments
            for (const created of toCreate) {
                auditLogs.push({
                    entityType: 'UserProject',
                    entityId: created.id,
                    attribute: 'assignment_created',
                    oldValue: null,
                    newValue: JSON.stringify({
                        userId,
                        userEmail,
                        projectId: created.projectId,
                        projectName: projectNames.get(created.projectId),
                        roleId: created.roleId,
                        roleName: roleNames.get(created.roleId) || null,
                        allocation: created.allocation,
                        startDate: created.startDate,
                        endDate: created.endDate,
                    }),
                    companyId,
                    byUserId,
                })
            }

            // Log assignment modifications
            for (const updated of toUpdate) {
                const existing = existingProjectsMap.get(updated.projectId)
                if (existing && (
                    existing.roleId !== updated.roleId ||
                    existing.allocation !== updated.allocation ||
                    existing.startDate !== updated.startDate ||
                    existing.endDate !== updated.endDate
                )) {
                    const changes: Record<string, { old: any; new: any }> = {}
                    
                    if (existing.roleId !== updated.roleId) {
                        changes.role = {
                            old: roleNames.get(existing.roleId) || null,
                            new: roleNames.get(updated.roleId) || null
                        }
                        changes.roleId = { old: existing.roleId, new: updated.roleId }
                    }
                    if (existing.allocation !== updated.allocation) {
                        changes.allocation = { old: existing.allocation, new: updated.allocation }
                    }
                    if (existing.startDate !== updated.startDate) {
                        changes.startDate = { old: existing.startDate, new: updated.startDate }
                    }
                    if (existing.endDate !== updated.endDate) {
                        changes.endDate = { old: existing.endDate, new: updated.endDate }
                    }

                    auditLogs.push({
                        entityType: 'UserProject',
                        entityId: updated.id,
                        attribute: 'assignment_modified',
                        oldValue: JSON.stringify({
                            userId,
                            userEmail,
                            projectId: updated.projectId,
                            projectName: projectNames.get(updated.projectId),
                            ...changes
                        }),
                        newValue: null,
                        companyId,
                        byUserId,
                    })
                }
            }

            // Log assignment removals
            for (const deleted of toDelete) {
                auditLogs.push({
                    entityType: 'UserProject',
                    entityId: deleted.id,
                    attribute: 'assignment_removed',
                    oldValue: JSON.stringify({
                        userId,
                        userEmail,
                        projectId: deleted.projectId,
                        projectName: projectNames.get(deleted.projectId),
                        roleId: deleted.roleId,
                        roleName: roleNames.get(deleted.roleId) || null,
                        allocation: deleted.allocation,
                        startDate: deleted.startDate,
                        endDate: deleted.endDate,
                    }),
                    newValue: null,
                    companyId,
                    byUserId,
                })
            }

            // Bulk create audit logs
            if (auditLogs.length > 0) {
                await this.prisma.audit.createMany({ data: auditLogs })
            }
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