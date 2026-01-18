import prisma from '@/lib/prisma';
import { LeaveRequest, User, ApprovalRule, Project, ApprovalStep } from '@/lib/generated/prisma/client';

export interface ApproverResult {
    mode: 'basic' | 'advanced';
    approvers: User[]; // For basic mode (any can approve)
    approvalSteps: any[]; // For advanced mode (sequenced)
}

export class ApprovalRoutingService {
    /**
     * Determines the approvers for a leave request based on company mode.
     */
    static async getApprovers(
        userId: string,
        projectId?: string
    ): Promise<ApproverResult> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                company: true,
                department: {
                    include: {
                        supervisors: {
                            include: { user: true }
                        }
                    }
                }
            }
        });

        if (!user) throw new Error('User not found');

        if (user.company.mode === 1) {
            // Basic Mode
            const approvers = await this.getApproversBasicMode(user);
            return {
                mode: 'basic',
                approvers,
                approvalSteps: []
            };
        } else {
            // Advanced Mode
            const steps = await this.getApproversAdvancedMode(user, projectId);
            return {
                mode: 'advanced',
                approvers: [],
                approvalSteps: steps
            };
        }
    }

    private static async getApproversBasicMode(user: any): Promise<User[]> {
        let approvers: User[] = [];

        // 1. Try department supervisors from the junction table
        if (user.department) {
            const supervisors = user.department.supervisors
                .map((ds: any) => ds.user)
                .filter((u: User) => u.id !== user.id && u.activated && !u.deletedAt);

            if (supervisors.length > 0) {
                return supervisors;
            }

            // 2. Fallback to boss_id (Primary Supervisor)
            if (user.department.bossId && user.department.bossId !== user.id) {
                const boss = await prisma.user.findUnique({
                    where: { id: user.department.bossId }
                });
                if (boss && boss.activated && !boss.deletedAt) {
                    return [boss];
                }
            }
        }

        // 3. Final Fallback: Company Admins
        const admins = await prisma.user.findMany({
            where: {
                companyId: user.companyId,
                isAdmin: true,
                activated: true,
                deletedAt: null,
                id: { not: user.id }
            }
        });

        return admins;
    }

    private static async getApproversAdvancedMode(user: any, projectId?: string): Promise<any[]> {
        // 1. Resolve Project Context
        if (!projectId) {
            // No project selected: fallback to department manager
            return this.createDepartmentManagerStep(user);
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            return this.createDepartmentManagerStep(user);
        }

        // 2. Get User's Role and Area in the project (or default)
        const userProject = await prisma.userProject.findFirst({
            where: { userId: user.id, projectId: project.id }
        });

        // Use project role if exists, else user's default role
        const subjectRoleId = userProject?.roleId || user.defaultRoleId;
        if (!subjectRoleId) {
            return this.createDepartmentManagerStep(user);
        }

        // Get user's area (optional)
        const userArea = await prisma.userRoleArea.findFirst({
            where: { userId: user.id, roleId: subjectRoleId }
        });

        // 3. Find Matching Approval Rules
        const rules = await prisma.approvalRule.findMany({
            where: {
                companyId: user.companyId,
                requestType: 'LEAVE',
                projectType: project.type,
                subjectRoleId: subjectRoleId,
                OR: [
                    { subjectAreaId: null },
                    { subjectAreaId: userArea?.areaId }
                ]
            },
            orderBy: { sequenceOrder: 'asc' }
        });

        if (rules.length === 0) {
            return this.createDepartmentManagerStep(user);
        }

        const approvalSteps = [];
        for (const rule of rules) {
            const approvers = await this.findApproversForRule(rule, project.id, user.id);

            for (const approver of approvers) {
                approvalSteps.push({
                    approverId: approver.id,
                    roleId: rule.approverRoleId,
                    status: 1, // pending
                    sequenceOrder: rule.sequenceOrder,
                    projectId: project.id
                });
            }
        }

        if (approvalSteps.length === 0) {
            return this.createDepartmentManagerStep(user);
        }

        return approvalSteps;
    }

    private static async findApproversForRule(rule: ApprovalRule, projectId: string, requesterId: string): Promise<User[]> {
        // Find users who have the required role on this project
        const approvers = await prisma.user.findMany({
            where: {
                activated: true,
                deletedAt: null,
                id: { not: requesterId },
                projects: {
                    some: {
                        projectId: projectId,
                        roleId: rule.approverRoleId
                    }
                }
            }
        });

        // Apply "SAME_AS_SUBJECT" area constraint
        if (rule.approverAreaConstraint === 'SAME_AS_SUBJECT') {
            // This requires more complex logic to check areas.
            // For now, let's filter the results by checking area intersection.
            const subjectAreas = await prisma.userRoleArea.findMany({
                where: { userId: requesterId }
            });
            const subjectAreaIds = subjectAreas.map(a => a.areaId).filter(id => id !== null);

            if (subjectAreaIds.length === 0) return [];

            const filteredApprovers = [];
            for (const approver of approvers) {
                const approverAreas = await prisma.userRoleArea.findMany({
                    where: { userId: approver.id, roleId: rule.approverRoleId }
                });
                const approverAreaIds = approverAreas.map(a => a.areaId).filter((id): id is string => id !== null);

                if (approverAreaIds.some(id => subjectAreaIds.includes(id))) {
                    filteredApprovers.push(approver);
                }
            }
            return filteredApprovers;
        }

        return approvers;
    }

    private static async createDepartmentManagerStep(user: any): Promise<any[]> {
        const supervisors = await this.getApproversBasicMode(user);
        if (supervisors.length === 0) return [];

        return [{
            approverId: supervisors[0].id,
            roleId: null,
            status: 1,
            sequenceOrder: 999, // Last in sequence or standalone
            projectId: null
        }];
    }
}
