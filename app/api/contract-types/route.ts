import { NextRequest, NextResponse } from "next/server"
import { isAdmin } from "@/lib/rbac"
import prisma from "@/lib/prisma"

// GET /api/contract-types - List all contract types with employee counts
export async function GET() {
    try {
        const adminCheck = await isAdmin()
        if (!adminCheck) {
            return NextResponse.json(
                { success: false, error: { message: "Access denied" } },
                { status: 403 }
            )
        }

        // Get all contract types from User table first
        const userContractTypes = await prisma.user.groupBy({
            by: ['contractTypeId'],
            where: {
                deletedAt: null,
                contractTypeId: { not: null }
            },
            _count: true
        })

        // Get managed contract types from ContractType table
        const managedContractTypes = await prisma.contractType.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                color: true,
                createdAt: true
            }
        })

        // Combine data
        const contractTypes: Array<{
            id: string | null
            name: string
            description: string | null
            color: string
            employeeCount: number
            createdAt: string
        }> = []

        // Add managed contract types
        for (const managed of managedContractTypes) {
            const userCount = userContractTypes.find(uct => uct.contractTypeId === managed.id)?._count || 0
            contractTypes.push({
                id: managed.id,
                name: managed.name,
                description: managed.description,
                color: managed.color,
                employeeCount: userCount,
                createdAt: managed.createdAt.toISOString()
            })
        }

        // Add unmanaged contract types (from User table but not in ContractType)
        const managedIds = new Set(managedContractTypes.map(ct => ct.id))
        for (const userContractType of userContractTypes) {
            if (userContractType.contractTypeId && !managedIds.has(userContractType.contractTypeId)) {
                // Find the contract type by ID to get the name
                const contractType = managedContractTypes.find(ct => ct.id === userContractType.contractTypeId)
                if (contractType) {
                    contractTypes.push({
                        id: contractType.id,
                        name: contractType.name,
                        description: contractType.description,
                        color: contractType.color,
                        employeeCount: userContractType._count,
                        createdAt: contractType.createdAt.toISOString()
                    })
                }
            }
        }

        // Sort by name
        contractTypes.sort((a, b) => a.name.localeCompare(b.name))

        return NextResponse.json({
            success: true,
            data: contractTypes
        })

    } catch (error) {
        console.error("Contract Types GET error:", error)
        return NextResponse.json(
            { success: false, error: { message: "Internal server error" } },
            { status: 500 }
        )
    }
}

// POST /api/contract-types - Create new contract type
export async function POST(request: NextRequest) {
    try {
        const adminCheck = await isAdmin()
        if (!adminCheck) {
            return NextResponse.json(
                { success: false, error: { message: "Access denied" } },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { name, description, color } = body

        if (!name || !color) {
            return NextResponse.json(
                { success: false, error: { message: "Name and color are required" } },
                { status: 400 }
            )
        }

        // Check if contract type already exists
        const existingType = await prisma.contractType.findUnique({
            where: { name }
        })

        if (existingType) {
            return NextResponse.json(
                { success: false, error: { message: "Contract type already exists" } },
                { status: 409 }
            )
        }

        const contractType = await prisma.contractType.create({
            data: {
                name,
                description: description || null,
                color,
            },
            select: {
                id: true,
                name: true,
                description: true,
                color: true,
                createdAt: true,
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                ...contractType,
                employeeCount: 0
            }
        })

    } catch (error) {
        console.error("Contract Types POST error:", error)
        return NextResponse.json(
            { success: false, error: { message: "Internal server error" } },
            { status: 500 }
        )
    }
}