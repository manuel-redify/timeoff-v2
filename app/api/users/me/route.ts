import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate, unauthorizedResponse, handleAuthError } from '@/lib/api-auth';

export async function GET() {
    try {
        const currentUser = await authenticate();

        if (!currentUser) {
            return unauthorizedResponse();
        }

        const user = await prisma.user.findUnique({
            where: { id: currentUser.id },
            include: {
                department: true,
                company: true,
                defaultRole: true,
                supervisedDepartments: {
                    select: {
                        department: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                managedDepartments: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (!user) {
            // This might happen if the webhook hasn't processed the user creation yet
            // or if the user record was deleted but the session is still active.
            return NextResponse.json({ error: 'User not synced' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        return handleAuthError(error);
    }
}
