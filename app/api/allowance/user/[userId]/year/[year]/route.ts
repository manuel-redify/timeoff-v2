import { NextRequest, NextResponse } from 'next/server';
import { AllowanceService } from '@/lib/allowance-service';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string; year: string } }
) {
    try {
        const { userId: requesterId } = await auth();
        if (!requesterId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { userId, year } = params;
        const yearInt = parseInt(year);

        if (isNaN(yearInt)) {
            return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
        }

        // Logic check: only admin or self can see allowance
        const requester = await prisma.user.findUnique({
            where: { clerkId: requesterId }
        });

        if (!requester) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        if (!requester.isAdmin && requester.id !== userId) {
            // Check if supervisor
            const isSupervisor = await prisma.departmentSupervisor.findUnique({
                where: {
                    departmentId_userId: {
                        userId: requester.id,
                        departmentId: (await prisma.user.findUnique({ where: { id: userId } }))?.departmentId || ''
                    }
                }
            });

            if (!isSupervisor) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        const breakdown = await AllowanceService.getAllowanceBreakdown(userId, yearInt);
        return NextResponse.json(breakdown);

    } catch (error) {
        console.error('Failed to fetch allowance:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
