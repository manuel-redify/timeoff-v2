import { getCurrentUser } from '@/lib/rbac';
import { ApiErrors, successResponse } from '@/lib/api-helper';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return ApiErrors.unauthorized();
        }

        const { id } = await params;

        // Find the notification and verify ownership
        const notification = await prisma.notification.findUnique({
            where: { id },
            select: { id: true, userId: true, isRead: true },
        });

        if (!notification) {
            return ApiErrors.notFound('Notification not found');
        }

        if (notification.userId !== user.id) {
            return ApiErrors.forbidden('You can only access your own notifications');
        }

        // Update notification as read
        const updatedNotification = await prisma.notification.update({
            where: { id },
            data: { isRead: true },
            select: {
                id: true,
                type: true,
                title: true,
                message: true,
                link: true,
                isRead: true,
                createdAt: true,
            },
        });

        return successResponse(
            updatedNotification,
            'Notification marked as read'
        );
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
        return ApiErrors.internalError('Failed to mark notification as read');
    }
}