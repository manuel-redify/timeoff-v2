import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { canManageUser, getCurrentUser, isAdmin } from '@/lib/rbac';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!await canManageUser(id)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                department: true,
                company: true,
                defaultRole: true,
            }
        });

        if (!user || user.deletedAt) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        if (!await canManageUser(id)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const updateData: any = {};

        if (currentUser.isAdmin) {
            if (body.name !== undefined) updateData.name = body.name;
            if (body.lastname !== undefined) updateData.lastname = body.lastname;
            if (body.departmentId !== undefined) updateData.departmentId = body.departmentId;
            if (body.defaultRoleId !== undefined) updateData.defaultRoleId = body.defaultRoleId || null;
            if (body.isAdmin !== undefined) updateData.isAdmin = body.isAdmin;
            if (body.isAutoApprove !== undefined) updateData.isAutoApprove = body.isAutoApprove;
            if (body.activated !== undefined) updateData.activated = body.activated;
            if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
            if (body.contractType !== undefined) updateData.contractType = body.contractType;
            if (body.country !== undefined) updateData.country = body.country;
        } else {
            // Non-admin can only update their own name/lastname/country
            if (body.name !== undefined) updateData.name = body.name;
            if (body.lastname !== undefined) updateData.lastname = body.lastname;
            if (body.country !== undefined) updateData.country = body.country;
        }

        if (currentUser.isAdmin && body.areaId !== undefined) {
            updateData.areaId = body.areaId || null;
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Only admins can delete users
        if (!await isAdmin()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const currentUser = await getCurrentUser();
        if (currentUser?.id === id) {
            return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
        }

        await prisma.user.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                activated: false
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
