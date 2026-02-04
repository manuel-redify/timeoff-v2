import { NextRequest, NextResponse } from "next/server"
import { isAdmin } from "@/lib/rbac"
import prisma from "@/lib/prisma"

// PUT /api/contract-types/[id] - Update contract type
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminCheck = await isAdmin()
        if (!adminCheck) {
            return NextResponse.json(
                { success: false, error: { message: "Access denied" } },
                { status: 403 }
            )
        }

        const { id } = await params
        const body = await request.json()
        const { name, description, color } = body

        if (!name || !color) {
            return NextResponse.json(
                { success: false, error: { message: "Name and color are required" } },
                { status: 400 }
            )
        }

        // Check if contract type exists
        const existingType = await prisma.contractType.findUnique({
            where: { id }
        })

        if (!existingType) {
            return NextResponse.json(
                { success: false, error: { message: "Contract type not found" } },
                { status: 404 }
            )
        }

        // Check if new name conflicts with existing type
        if (name !== existingType.name) {
            const nameConflict = await prisma.contractType.findUnique({
                where: { name }
            })

            if (nameConflict) {
                return NextResponse.json(
                    { success: false, error: { message: "Contract type with this name already exists" } },
                    { status: 409 }
                )
            }
        }

        const contractType = await prisma.contractType.update({
            where: { id },
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

        // Get employee count for the updated type
        const employeeCount = await prisma.user.count({
            where: {
                contractTypeId: contractType.id,
                deletedAt: null
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                ...contractType,
                employeeCount
            }
        })

    } catch (error) {
        console.error("Contract Types PUT error:", error)
        return NextResponse.json(
            { success: false, error: { message: "Internal server error" } },
            { status: 500 }
        )
    }
}

// DELETE /api/contract-types/[id] - Delete contract type
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminCheck = await isAdmin()
        if (!adminCheck) {
            return NextResponse.json(
                { success: false, error: { message: "Access denied" } },
                { status: 403 }
            )
        }

        const { id } = await params

        // Check if contract type exists and get employee count
        const contractType = await prisma.contractType.findUnique({
            where: { id }
        })

        if (!contractType) {
            return NextResponse.json(
                { success: false, error: { message: "Contract type not found" } },
                { status: 404 }
            )
        }

        // Check if contract type is in use by employees
        const employeeCount = await prisma.user.count({
            where: {
                contractTypeId: contractType.id,
                deletedAt: null
            }
        })

        if (employeeCount > 0) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: { 
                        message: `Cannot delete contract type. It is currently assigned to ${employeeCount} employee(s). Reassign them first.` 
                    } 
                },
                { status: 400 }
            )
        }

        await prisma.contractType.delete({
            where: { id }
        })

        return NextResponse.json({
            success: true,
            data: {
                id,
                message: "Contract type deleted successfully"
            }
        })

    } catch (error) {
        console.error("Contract Types DELETE error:", error)
        return NextResponse.json(
            { success: false, error: { message: "Internal server error" } },
            { status: 500 }
        )
    }
}