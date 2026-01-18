import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-helper';
import { z } from 'zod';

const scheduleSchema = z.object({
    monday: z.number().int().min(1).max(4).default(1),
    tuesday: z.number().int().min(1).max(4).default(1),
    wednesday: z.number().int().min(1).max(4).default(1),
    thursday: z.number().int().min(1).max(4).default(1),
    friday: z.number().int().min(1).max(4).default(1),
    saturday: z.number().int().min(1).max(4).default(2),
    sunday: z.number().int().min(1).max(4).default(2),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return ApiErrors.unauthorized();

        const reqUser = await prisma.user.findUnique({
            where: { clerkId },
            select: { companyId: true, isAdmin: true, id: true }
        });

        if (!reqUser || !reqUser.companyId) return ApiErrors.unauthorized();

        const { userId: targetUserId } = await params;

        // Check access: Admin or Self
        if (reqUser.id !== targetUserId && !reqUser.isAdmin) {
            // Optionally allow supervisors?
            // For now, strict: Self or Admin
            return ApiErrors.forbidden();
        }

        // Verify target user is in same company
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { companyId: true }
        });

        if (!targetUser || targetUser.companyId !== reqUser.companyId) {
            return ApiErrors.notFound('User not found');
        }

        const schedule = await prisma.schedule.findFirst({
            where: {
                userId: targetUserId
            }
        });

        return successResponse(schedule); // Might be null, which means "use default"

    } catch (error) {
        console.error('Error fetching user schedule:', error);
        return ApiErrors.internalError();
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return ApiErrors.unauthorized();

        const reqUser = await prisma.user.findUnique({
            where: { clerkId },
            select: { companyId: true, isAdmin: true }
        });

        if (!reqUser || !reqUser.companyId) return ApiErrors.unauthorized();
        if (!reqUser.isAdmin) return ApiErrors.forbidden('Only admins can update user schedules');

        const { userId: targetUserId } = await params;

        // Verify target user is in same company
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { companyId: true }
        });

        if (!targetUser || targetUser.companyId !== reqUser.companyId) {
            return ApiErrors.notFound('User not found');
        }

        const body = await req.json();
        const validation = scheduleSchema.safeParse(body);

        if (!validation.success) {
            return ApiErrors.badRequest('Invalid schedule',
                (validation.error as any).errors.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
            );
        }

        // Upsert
        const existing = await prisma.schedule.findFirst({
            where: { userId: targetUserId }
        });

        let result;
        if (existing) {
            result = await prisma.schedule.update({
                where: { id: existing.id },
                data: validation.data
            });
        } else {
            result = await prisma.schedule.create({
                data: {
                    userId: targetUserId,
                    companyId: null, // User specific
                    ...validation.data
                }
            });
        }

        return successResponse(result);

    } catch (error) {
        console.error('Error updating user schedule:', error);
        return ApiErrors.internalError();
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return ApiErrors.unauthorized();

        const reqUser = await prisma.user.findUnique({
            where: { clerkId },
            select: { companyId: true, isAdmin: true }
        });

        if (!reqUser || !reqUser.companyId) return ApiErrors.unauthorized();
        if (!reqUser.isAdmin) return ApiErrors.forbidden();

        const { userId: targetUserId } = await params;

        // Verify target user
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { companyId: true }
        });

        if (!targetUser || targetUser.companyId !== reqUser.companyId) {
            return ApiErrors.notFound('User not found');
        }

        await prisma.schedule.deleteMany({
            where: {
                userId: targetUserId
            }
        });

        return successResponse({ deleted: true });

    } catch (error) {
        console.error('Error deletin schedule:', error);
        return ApiErrors.internalError();
    }
}
