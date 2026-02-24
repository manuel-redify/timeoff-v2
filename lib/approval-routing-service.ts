import prisma from '@/lib/prisma';
import { LeaveRequest, User, Project, ApprovalStep } from '@/lib/generated/prisma/client';
import { WorkflowFormValues } from '@/lib/validations/workflow';
import { ResolverType } from '@/lib/types/workflow';

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
            const approvalSteps = approvers.map(approver => ({
                approverId: approver.id,
                roleId: null,
                status: 0, // pending
                sequenceOrder: 1,
                projectId: null
            }));

            return {
                mode: 'basic',
                approvers,
                approvalSteps
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
            },
            orderBy: [
                { name: 'asc' },
                { lastname: 'asc' }
            ]
        });

        return admins;
    }

    private static async getApproversAdvancedMode(user: any, projectId?: string): Promise<any[]> {
        // 1. Resolve Project Context
        if (!projectId) {
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

        // 3. Find Matching Workflows
        const workflows = await prisma.workflow.findMany({
            where: {
                companyId: user.companyId,
                isActive: true,
            },
            select: {
                id: true,
                rules: true,
            },
        });

        const matchedSteps: any[] = [];

        for (const workflow of workflows) {
            const rules = workflow.rules as WorkflowFormValues;
            const steps = rules.steps || [];
            
            // Check if workflow matches request type
            const requestTypes = rules.requestTypes || [];
            const matchesRequestType = requestTypes.length === 0 ||
                requestTypes.some(rt => rt === 'LEAVE' || rt === 'LEAVE_REQUEST' || rt === 'ANY' || rt === 'ALL');
            if (!matchesRequestType) continue;

            // Check if workflow matches project type
            const projectTypes = rules.projectTypes || [];
            const matchesProjectType = projectTypes.length === 0 ||
                projectTypes.some(pt => pt === project.type || pt === 'ANY' || pt === 'ALL');
            if (!matchesProjectType) continue;

            // Check if workflow matches subject role
            const subjectRoles = rules.subjectRoles || [];
            const matchesSubjectRole = subjectRoles.length === 0 ||
                subjectRoles.includes(subjectRoleId) || subjectRoles.includes('ANY') || subjectRoles.includes('ALL');
            if (!matchesSubjectRole) continue;

            // Extract steps from workflow
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                let approverIds: string[] = [];

                switch (step.resolver) {
                    case 'SPECIFIC_USER':
                        if (step.resolverId) {
                            approverIds = [step.resolverId];
                        }
                        break;
                    case 'ROLE':
                        if (step.resolverId) {
                            const roleUsers = await prisma.user.findMany({
                                where: {
                                    companyId: user.companyId,
                                    activated: true,
                                    deletedAt: null,
                                    OR: [
                                        { defaultRoleId: step.resolverId },
                                        {
                                            projects: {
                                                some: {
                                                    roleId: step.resolverId,
                                                    project: { archived: false }
                                                }
                                            }
                                        }
                                    ]
                                },
                                select: { id: true }
                            });
                            approverIds = roleUsers.map(u => u.id);
                        }
                        break;
                    case 'DEPARTMENT_MANAGER':
                        if (user.departmentId) {
                            const dept = await prisma.department.findUnique({
                                where: { id: user.departmentId },
                                include: { supervisors: true }
                            });
                            approverIds = dept?.supervisors.map(s => s.userId) || [];
                        }
                        break;
                }

                for (const approverId of approverIds) {
                    if (approverId !== user.id) {
                        matchedSteps.push({
                            approverId,
                            roleId: step.resolverId || null,
                            status: 0,
                            sequenceOrder: i + 1,
                            projectId: project.id
                        });
                    }
                }
            }
        }

        if (matchedSteps.length === 0) {
            return this.createDepartmentManagerStep(user);
        }

        return matchedSteps;
    }

    private static async createDepartmentManagerStep(user: any): Promise<any[]> {
        const supervisors = await this.getApproversBasicMode(user);
        if (supervisors.length === 0) return [];

        return [{
            approverId: supervisors[0].id,
            roleId: null,
            status: 0, // pending
            sequenceOrder: 999, // Last in sequence or standalone
            projectId: null
        }];
    }
}
