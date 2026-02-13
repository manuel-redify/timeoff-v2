import { Role, Department, Project, ContractType, User } from '../generated/prisma/client';

export enum ResolverType {
  SPECIFIC_USER = 'SPECIFIC_USER',
  ROLE = 'ROLE',
  DEPARTMENT_MANAGER = 'DEPARTMENT_MANAGER',
  LINE_MANAGER = 'LINE_MANAGER',
}

export enum ContextScope {
  GLOBAL = 'GLOBAL',
  SAME_AREA = 'SAME_AREA',
  SAME_PROJECT = 'SAME_PROJECT',
  SAME_DEPARTMENT = 'SAME_DEPARTMENT',
}

export interface WorkflowStep {
  sequence: number;
  resolver: ResolverType;
  resolverId?: string; // User ID, Role ID, etc.
  scope: ContextScope;
  action: 'APPROVE' | 'REJECT' | 'NOTIFY';
}

export interface WorkflowWatcher {
  resolver: ResolverType;
  resolverId?: string; // User ID, Role ID, etc.
  scope: ContextScope;
  notificationOnly?: boolean;
  notifyByEmail?: boolean;
  notifyByPush?: boolean;
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
  request: {
    userId: string;
    requestType: string;
    contractType?: string;
    departmentId?: string;
    projectId?: string;
    areaId?: string;
  };
  user: User;
  company: {
    id: string;
    roles: Role[];
    departments: Department[];
    projects: Project[];
    contractTypes: ContractType[];
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
