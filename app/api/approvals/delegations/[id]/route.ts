import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

type RouteContext = {
    params: Promise<{ id: string }>;
};

// DELETE /api/approvals/delegations/[id] - Cancel a delegation
export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, isAdmin: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { id } = await context.params;

        // Verify delegation exists
        const delegation = await prisma.approvalDelegation.findUnique({
            where: { id },
            select: { supervisorId: true },
        });

        if (!delegation) {
            return NextResponse.json({ error: 'Delegation not found' }, { status: 404 });
        }

        // Only the supervisor or an admin can cancel
        if (!user.isAdmin && delegation.supervisorId !== user.id) {
            return NextResponse.json(
                { error: 'Not authorized to cancel this delegation' },
                { status: 403 }
            );
        }

        // Deactivate the delegation
        await prisma.approvalDelegation.update({
            where: { id },
            data: { isActive: false },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Cancel delegation error:', error);
        return NextResponse.json(
            { error: 'Failed to cancel delegation' },
            { status: 500 }
        );
    }
}
