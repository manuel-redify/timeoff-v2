import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
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
        console.error('Error fetching current user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
