export enum ResolverType {
    ROLE = 'ROLE',
    DEPARTMENT_MANAGER = 'DEPARTMENT_MANAGER',
    LINE_MANAGER = 'LINE_MANAGER',
    SPECIFIC_USER = 'SPECIFIC_USER'
}

export enum ContextScope {
    GLOBAL = 'GLOBAL',
    SAME_AREA = 'SAME_AREA',
    SAME_DEPARTMENT = 'SAME_DEPARTMENT',
    SAME_PROJECT = 'SAME_PROJECT'
}

export interface WorkflowStep {
    sequence: number;
    resolver: ResolverType;
    resolverId?: string | null;
    scope: ContextScope[];
    action: 'APPROVE' | 'REJECT';
    parallelGroupId?: string;
}

export interface WorkflowWatcher {
    resolver: ResolverType;
    resolverId?: string | null;
    scope: ContextScope[];
}

export interface WorkflowTrigger {
    requestType: string;
    contractType?: string;
    role?: string;
    department?: string;
    projectType?: string;
}

export interface WorkflowPolicy {
    id: string;
    name: string;
    trigger: WorkflowTrigger;
    steps: WorkflowStep[];
    watchers: WorkflowWatcher[];
    isActive: boolean;
    companyId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface WorkflowExecutionContext {
    company: {
        id: string;
    };
    request: {
        userId: string;
        requestType: string;
        projectId: string | null;
        areaId?: string | null;
        departmentId?: string | null;
    };
}

export interface WorkflowResolution {
    resolvers: Array<{
        userId: string;
        type: ResolverType;
        step?: number;
    }>;
    watchers: Array<{
        userId: string;
        type: ResolverType;
    }>;
}
