import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const createDelegationSchema = z.object({
    delegateId: z.string().uuid(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
});

// GET /api/approvals/delegations - Get all delegations for the current user
export async function GET() {
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

        // Admins can see all delegations, supervisors see only their own
        const delegations = await prisma.approvalDelegation.findMany({
            where: user.isAdmin ? {} : { supervisorId: user.id },
            include: {
                supervisor: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        email: true,
                    },
                },
                delegate: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                startDate: 'desc',
            },
        });

        return NextResponse.json({ delegations });
    } catch (error) {
        console.error('Get delegations error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve delegations' },
            { status: 500 }
        );
    }
}

// POST /api/approvals/delegations - Create a new delegation
export async function POST(request: NextRequest) {
    try {
const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, companyId: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();
        const validatedData = createDelegationSchema.parse(body);

        const { delegateId, startDate, endDate } = validatedData;

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start >= end) {
            return NextResponse.json(
                { error: 'End date must be after start date' },
                { status: 400 }
            );
        }

        // Verify delegate exists and is in the same company
        const delegate = await prisma.user.findUnique({
            where: { id: delegateId },
            select: { id: true, companyId: true },
        });

        if (!delegate) {
            return NextResponse.json({ error: 'Delegate not found' }, { status: 404 });
        }

        if (delegate.companyId !== user.companyId) {
            return NextResponse.json(
                { error: 'Delegate must be in the same company' },
                { status: 400 }
            );
        }

        if (delegate.id === user.id) {
            return NextResponse.json(
                { error: 'Cannot delegate to yourself' },
                { status: 400 }
            );
        }

        // Deactivate any overlapping delegations
        await prisma.approvalDelegation.updateMany({
            where: {
                supervisorId: user.id,
                isActive: true,
                OR: [
                    {
                        startDate: { lte: end },
                        endDate: { gte: start },
                    },
                ],
            },
            data: {
                isActive: false,
            },
        });

        // Create new delegation
        const delegation = await prisma.approvalDelegation.create({
            data: {
                supervisorId: user.id,
                delegateId,
                startDate: start,
                endDate: end,
                isActive: true,
            },
            include: {
                delegate: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({ delegation }, { status: 201 });
    } catch (error) {
        console.error('Create delegation error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create delegation' },
            { status: 500 }
        );
    }
}
