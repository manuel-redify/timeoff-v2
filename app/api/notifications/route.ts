import { getCurrentUser } from '@/lib/rbac';
import { ApiErrors, successResponse } from '@/lib/api-helper';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return ApiErrors.unauthorized();
        }

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
        const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
        const unreadOnly = searchParams.get('unreadOnly') === 'true';

        const where = {
            userId: user.id,
            ...(unreadOnly && { isRead: false }),
        };

        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
                select: {
                    id: true,
                    type: true,
                    title: true,
                    message: true,
                    link: true,
                    isRead: true,
                    createdAt: true,
                },
            }),
            prisma.notification.count({ where }),
        ]);

        return successResponse(
            {
                notifications,
                pagination: {
                    total,
                    limit,
                    offset,
                    hasMore: offset + limit < total,
                },
            },
            'Notifications retrieved successfully'
        );
    } catch (error) {
        console.error('Failed to fetch notifications:', error);
        return ApiErrors.internalError('Failed to fetch notifications');
    }
}