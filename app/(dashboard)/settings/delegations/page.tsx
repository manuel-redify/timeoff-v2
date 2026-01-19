import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { ApprovalService } from '@/lib/services/approval.service';
import { DelegationForm } from './delegation-form';
import { DelegationList } from './delegation-list';

export default async function DelegationsPage() {
    const { userId } = await auth();
    if (!userId) {
        redirect('/sign-in');
    }

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: {
            id: true,
            name: true,
            lastname: true,
            companyId: true,
            isAdmin: true,
        },
    });

    if (!user) {
        redirect('/sign-in');
    }

    // Get all delegations for this user
    const delegations = await ApprovalService.getDelegations(user.id);

    // Get all users in the same company for the delegate selector
    const companyUsers = await prisma.user.findMany({
        where: {
            companyId: user.companyId,
            id: { not: user.id },
            activated: true,
            deletedAt: null,
        },
        select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
            department: {
                select: {
                    name: true,
                },
            },
        },
        orderBy: [{ name: 'asc' }, { lastname: 'asc' }],
    });

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Approval Delegations</h1>
                <p className="text-muted-foreground mt-2">
                    Delegate your approval authority to another user during your absence
                </p>
            </div>

            <div className="grid gap-8">
                <DelegationForm
                    userId={user.id}
                    companyUsers={companyUsers}
                />

                <DelegationList
                    delegations={delegations}
                    userId={user.id}
                />
            </div>
        </div>
    );
}
