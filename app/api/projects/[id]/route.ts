import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { getProjectService } from "@/lib/services/project-service"
import { ApiErrors, successResponse } from "@/lib/api-helper"

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return ApiErrors.unauthorized()
        }

        const projectId = params.id
        const projectService = getProjectService(prisma)
        
        const project = await projectService.getProjectById(
            projectId, 
            session.user.companyId
        )
        
        if (!project) {
            return ApiErrors.notFound("Project not found")
        }

        return successResponse(project)
    } catch (error: any) {
        console.error("Project GET error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to fetch project" },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return ApiErrors.unauthorized()
        }

        const body = await request.json()
        const projectId = params.id

        const projectService = getProjectService(prisma)
        
        // First check if project exists and belongs to user's company
        const existingProject = await projectService.getProjectById(
            projectId, 
            session.user.companyId
        )
        
        if (!existingProject) {
            return ApiErrors.notFound("Project not found")
        }

        // Handle archive/unarchive functionality
        if (body.archived !== undefined) {
            const updatedProject = await projectService.archiveProject(
                projectId,
                session.user.companyId
            )
            return successResponse(updatedProject)
        }

        const updatedProject = await projectService.updateProject(
            projectId,
            body,
            session.user.companyId
        )

        return successResponse(updatedProject)
    } catch (error: any) {
        console.error("Project PATCH error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to update project" },
            { status: 400 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return ApiErrors.unauthorized()
        }

        const projectId = params.id

        const projectService = getProjectService(prisma)
        
        // Check if project exists and belongs to user's company
        const existingProject = await projectService.getProjectById(
            projectId, 
            session.user.companyId
        )
        
        if (!existingProject) {
            return ApiErrors.notFound("Project not found")
        }

        await projectService.deleteProject(projectId, session.user.companyId)

        return successResponse({ deleted: true })
    } catch (error: any) {
        console.error("Project DELETE error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to delete project" },
            { status: 400 }
        )
    }
}