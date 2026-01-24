import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isAdmin } from '@/lib/rbac';
import { successResponse } from '@/lib/api-helper';

export async function GET() {
    try {
        if (!await isAdmin()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            where: {
                deletedAt: null
            },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                defaultRole: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                lastname: 'asc'
            }
        });

        return successResponse(users);
    } catch (error) {
        console.error('Error listing users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
