import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { getProjectService } from "@/lib/services/project-service"
import { ApiErrors, successResponse } from "@/lib/api-helper"

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return ApiErrors.unauthorized()
        }

        const { searchParams } = new URL(request.url)
        const search = searchParams.get("search") || undefined
        const archived = searchParams.get("archived") === "true"

        const projectService = getProjectService(prisma)
        const projects = await projectService.getProjects(
            session.user.id,
            search,
            archived,
            session.user.companyId
        )

        return successResponse(projects)
    } catch (error: any) {
        console.error("Projects GET error:", error)
        return NextResponse.json(
            { error: "Failed to fetch projects" },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return ApiErrors.unauthorized()
        }

        const body = await request.json()

        const projectService = getProjectService(prisma)
        const project = await projectService.createProject(body, session.user.companyId, session.user.id)

        return successResponse(project)
    } catch (error: any) {
        console.error("Project POST error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to create project" },
            { status: 400 }
        )
    }
}