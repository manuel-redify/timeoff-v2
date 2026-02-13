import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { getUserProjectService } from "@/lib/services/user-project-service"
import { ApiErrors, successResponse, errorResponse } from "@/lib/api-helper"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return ApiErrors.unauthorized()
        }

        const { id: userId } = await params
        const userProjectService = getUserProjectService(prisma)

        const projects = await userProjectService.getUserProjects(userId)

        return successResponse(projects)
    } catch (error: any) {
        console.error("User projects GET error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to fetch user projects" },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return ApiErrors.unauthorized()
        }

        const { id: userId } = await params
        const body = await request.json()

        const userProjectService = getUserProjectService(prisma)

        await userProjectService.syncUserProjects(userId, body.assignments, session.user.companyId, session.user.id)

        return successResponse({ synced: true })
    } catch (error: any) {
        console.error("User projects PUT error:", error)
        return errorResponse(
            error.message || "Failed to sync user projects",
            "SYNC_ERROR",
            400,
            error.errors || error.validationErrors
        )
    }
}