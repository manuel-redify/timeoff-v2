import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const requester = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!requester || !requester.isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
        }

        const body = await request.json();
        const { userId, year, adjustment, reason } = body;

        if (!userId || !year || adjustment === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const yearInt = parseInt(year);
        const adjustmentValue = parseFloat(adjustment);

        // Update or create adjustment
        const result = await prisma.userAllowanceAdjustment.upsert({
            where: {
                userId_year: {
                    userId,
                    year: yearInt
                }
            },
            update: {
                adjustment: {
                    increment: adjustmentValue
                }
            },
            create: {
                userId,
                year: yearInt,
                adjustment: adjustmentValue,
                carriedOverAllowance: 0
            }
        });

        // Audit log (manual)
        await prisma.audit.create({
            data: {
                entityType: 'UserAllowanceAdjustment',
                entityId: result.id,
                attribute: 'adjustment',
                oldValue: 'N/A',
                newValue: adjustmentValue.toString(),
                companyId: requester.companyId,
                byUserId: requester.id
            }
        });

        // Add a comment if reason is provided
        if (reason) {
            await prisma.comment.create({
                data: {
                    entityType: 'UserAllowanceAdjustment',
                    entityId: result.id,
                    comment: reason,
                    companyId: requester.companyId,
                    byUserId: requester.id
                }
            });
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Failed to create adjustment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
