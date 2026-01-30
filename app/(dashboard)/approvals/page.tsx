import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { ApprovalService } from '@/lib/services/approval.service';
import { ApprovalsDashboard } from './approvals-dashboard';

export default async function ApprovalsPage() {
const session = await auth();
    if (!session?.user?.id) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            lastname: true,
            companyId: true,
            isAdmin: true,
            department: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    if (!user) {
        redirect('/login');
    }

    // Get pending approvals
    const pendingApprovals = await ApprovalService.getPendingApprovals(
        user.id,
        user.companyId
    );

    // Get active delegation
    const activeDelegation = await ApprovalService.getActiveDelegation(user.id);

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Approval Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                    Review and process pending leave requests
                </p>
            </div>

            {activeDelegation && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Active Delegation
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Your approval authority is delegated to{' '}
                        <strong>
                            {activeDelegation.delegate.name} {activeDelegation.delegate.lastname}
                        </strong>{' '}
                        from {new Date(activeDelegation.startDate).toLocaleDateString()} to{' '}
                        {new Date(activeDelegation.endDate).toLocaleDateString()}
                    </p>
                </div>
            )}

            <ApprovalsDashboard
                initialApprovals={pendingApprovals}
                user={user}
            />
        </div>
    );
}
