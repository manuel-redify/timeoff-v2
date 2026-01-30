import { auth } from "@/auth";
import prisma from '@/lib/prisma';

export async function getCurrentUser() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            company: true,
            department: true,
            defaultRole: true,
        }
    });

    return user;
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
                    userId: user.id
                }
            }
        }
    });

    return !!isSecondary;
}

export async function isAnySupervisor() {
    const user = await getCurrentUser();
    if (!user) return false;

    // Check if boss of any department
    const isBoss = await prisma.department.findFirst({
        where: { bossId: user.id }
    });
    if (isBoss) return true;

    // Check if secondary supervisor of any department
    const isSecondary = await prisma.departmentSupervisor.findFirst({
        where: { userId: user.id }
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
