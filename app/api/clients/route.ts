import { auth } from "@/auth"
import { ApiErrors, successResponse } from "@/lib/api-helper"
import prisma from "@/lib/prisma"

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return ApiErrors.unauthorized()
        }

        if (!session.user.companyId) {
            return ApiErrors.unauthorized("User not associated with a company")
        }

        const clients = await prisma.client.findMany({
            where: {
                companyId: session.user.companyId,
            },
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: "asc",
            },
        })

        return successResponse(clients)
    } catch (error) {
        console.error("Clients GET error:", error)
        return ApiErrors.internalError("Failed to fetch clients")
    }
}
