import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function getCurrentUser() {
    const { userId } = await auth();
    if (!userId) return null;

    return await prisma.user.findUnique({
        where: { clerkId: userId },
        include: {
            department: true,
            company: true,
            defaultRole: true,
        }
    });
}

export async function isAdmin() {
    const user = await getCurrentUser();
    return user?.isAdmin ?? false;
}

export async function isSupervisor(departmentId?: string) {
    const user = await getCurrentUser();
    if (!user) return false;

    // Head of department (Boss)
    const isBoss = await prisma.department.findFirst({
        where: {
            id: departmentId,
            bossId: user.id
        }
    });

    if (isBoss) return true;

    // Secondary supervisor
    const isSecondary = await prisma.department.findFirst({
        where: {
            id: departmentId,
            supervisors: {
                some: {
                    id: user.id
                }
            }
        }
    });

    return !!isSecondary;
}

export async function canManageUser(targetUserId: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser) return false;

    // Admins can manage anyone
    if (currentUser.isAdmin) return true;

    // Users can manage themselves
    if (currentUser.id === targetUserId) return true;

    return false;
}
