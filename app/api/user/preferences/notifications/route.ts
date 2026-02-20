import { getCurrentUser } from '@/lib/rbac';
import { ApiErrors, successResponse } from '@/lib/api-helper';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const preferenceSchema = z.object({
    type: z.enum(['LEAVE_SUBMITTED', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'WELCOME']),
    channel: z.enum(['EMAIL', 'IN_APP', 'BOTH', 'NONE']),
});

const updatePreferencesSchema = z.object({
    preferences: z.array(preferenceSchema),
});

export async function PUT(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return ApiErrors.unauthorized();
        }

        const body = await request.json();
        const validation = updatePreferencesSchema.safeParse(body);

        if (!validation.success) {
            const validationErrors = validation.error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            }));
            return ApiErrors.badRequest(
                'Invalid preferences data',
                validationErrors
            );
        }

        const { preferences } = validation.data;

        // Use transaction to update all preferences atomically
        const updatedPreferences = await prisma.$transaction(
            preferences.map((pref) =>
                prisma.notificationPreference.upsert({
                    where: {
                        userId_type: {
                            userId: user.id,
                            type: pref.type,
                        },
                    },
                    update: {
                        channel: pref.channel,
                    },
                    create: {
                        userId: user.id,
                        type: pref.type,
                        channel: pref.channel,
                    },
                    select: {
                        id: true,
                        type: true,
                        channel: true,
                    },
                })
            )
        );

        return successResponse(
            updatedPreferences,
            'Notification preferences updated successfully'
        );
    } catch (error) {
        console.error('Failed to update notification preferences:', error);
        return ApiErrors.internalError('Failed to update notification preferences');
    }
}

// GET endpoint to retrieve current preferences
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return ApiErrors.unauthorized();
        }

        const preferences = await prisma.notificationPreference.findMany({
            where: { userId: user.id },
            select: {
                id: true,
                type: true,
                channel: true,
            },
            orderBy: { type: 'asc' },
        });

        // If no preferences exist, return defaults
        if (preferences.length === 0) {
            const defaultPreferences = [
                { type: 'LEAVE_SUBMITTED', channel: 'BOTH' as const },
                { type: 'LEAVE_APPROVED', channel: 'BOTH' as const },
                { type: 'LEAVE_REJECTED', channel: 'BOTH' as const },
                { type: 'WELCOME', channel: 'EMAIL' as const },
            ].map((pref) => ({ ...pref, id: '' }));

            return successResponse(defaultPreferences, 'Default preferences returned');
        }

        return successResponse(preferences, 'Preferences retrieved successfully');
    } catch (error) {
        console.error('Failed to retrieve notification preferences:', error);
        return ApiErrors.internalError('Failed to retrieve notification preferences');
    }
}
