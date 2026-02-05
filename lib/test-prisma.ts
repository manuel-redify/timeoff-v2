// Test file to verify Prisma query works
import prisma from "@/lib/prisma"

export async function testProjectQuery() {
    try {
        const projects = await prisma.project.findMany({
            take: 1,
            include: {
                company: {
                    select: { id: true, name: true }
                },
                _count: {
                    select: { users: true }
                }
            }
        })
        console.log("✅ Query works! Found projects:", projects.length)
        return { success: true, count: projects.length }
    } catch (error: any) {
        console.error("❌ Query failed:", error.message)
        return { success: false, error: error.message }
    }
}
