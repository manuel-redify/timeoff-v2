import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from '@/lib/prisma';

export async function getCurrentUser() {
    const { userId } = await auth();
    if (!userId) return null;

    let user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: {
            company: true,
            department: true,
            defaultRole: true, // Kept defaultRole include
        }
    });

    // Lazy sync: if authenticated user is not in DB, create them (or link if email exists)
    if (!user) {
        console.log(`Auto-syncing user: ${userId}`);
        const clerkUser = await currentUser();
        if (!clerkUser) return null;

        const email = clerkUser.emailAddresses[0]?.emailAddress;
        if (!email) return null;

        // Check if user exists by email (to avoid unique constraint error)
        const existingUserByEmail = await prisma.user.findUnique({
            where: { email },
            include: {
                company: true,
                department: true,
                defaultRole: true
            }
        });

        if (existingUserByEmail) {
            console.log(`Found existing user by email ${email}, linking Clerk ID.`);
            user = await prisma.user.update({
                where: { id: existingUserByEmail.id },
                data: {
                    clerkId: userId,
                    name: existingUserByEmail.name === 'Unknown' ? (clerkUser.firstName ?? 'Unknown') : existingUserByEmail.name,
                    lastname: existingUserByEmail.lastname === 'Unknown' ? (clerkUser.lastName ?? 'Unknown') : existingUserByEmail.lastname,
                },
                include: {
                    company: true,
                    department: true,
                    defaultRole: true,
                }
            });
        } else {
            // Find default company and department
            let company = await prisma.company.findFirst({
                where: { name: { not: 'Default Company' }, deletedAt: null },
                orderBy: { createdAt: 'asc' }
            });

            if (!company) {
                const defaultCompany = await prisma.company.findFirst({ where: { name: 'Default Company' } });
                if (defaultCompany) company = defaultCompany;
            }

            if (company) {
                let department = await prisma.department.findFirst({
                    where: { companyId: company.id, name: 'General' }
                });

                if (!department) {
                    // console.log('General department not found, falling back to any available department');
                    const anyDept = await prisma.department.findFirst({
                        where: { companyId: company.id }
                    });
                    if (anyDept) department = anyDept;
                }

                if (department) {
                    try {
                        user = await prisma.user.create({
                            data: {
                                clerkId: userId,
                                email: email,
                                name: clerkUser.firstName ?? 'Unknown',
                                lastname: clerkUser.lastName ?? 'Unknown',
                                companyId: company.id,
                                departmentId: department.id,
                                defaultRoleId: company.defaultRoleId,
                                activated: true,
                                isAdmin: false,
                            },
                            include: {
                                company: true,
                                department: true,
                                defaultRole: true,
                            }
                        });
                        console.log(`Auto-sync create successful for: ${email}`);
                    } catch (error) {
                        // Fallback in case of race condition
                        console.error("Failed to create user during auto-sync:", error);
                        // Try to fetch again just in case
                        user = await prisma.user.findUnique({ where: { email }, include: { company: true, department: true, defaultRole: true } });
                    }
                }
            }
        }
    }

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
