import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { ConflictDetectionService } from '@/lib/services/conflict-detection.service';

type RouteContext = {
    params: Promise<{ id: string }>;
};

// GET /api/approvals/[id]/conflicts - Get conflicts for a specific leave request
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true, companyId: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { id } = await context.params;

        // Verify the leave request exists and user has access
        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { id },
            select: {
                id: true,
                user: {
                    select: {
                        companyId: true,
                    },
                },
            },
        });

        if (!leaveRequest) {
            return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
        }

        if (leaveRequest.user.companyId !== user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Get conflicts
        const conflicts = await ConflictDetectionService.getConflictsForRequest(id);

        return NextResponse.json(conflicts);
    } catch (error) {
        console.error('Get conflicts error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve conflicts' },
            { status: 500 }
        );
    }
}
