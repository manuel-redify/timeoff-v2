import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { getUserProjectService } from "@/lib/services/user-project-service"
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

        const userId = params.id
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
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return ApiErrors.unauthorized()
        }

        const userId = params.id
        const body = await request.json()

        const userProjectService = getUserProjectService(prisma)
        
        await userProjectService.syncUserProjects(userId, body.assignments, session.user.companyId, session.user.id)

        return successResponse({ synced: true })
    } catch (error: any) {
        console.error("User projects PUT error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to sync user projects" },
            { status: 400 }
        )
    }
}