# Workflow Engine Research & Mapping Analysis

## Current Implementation Analysis

### 1. ApprovalRoutingService.getApproversAdvancedMode Flow

**Current Logic Flow:**
1. **Project Context**: Requires projectId, falls back to department manager
2. **Role Resolution**: Uses project role (UserProject.roleId) or user default role
3. **Area Matching**: Uses user.areaId for subject area constraint
4. **Rule Matching**: Queries ApprovalRule by:
   - companyId
   - requestType: 'LEAVE' (hardcoded)
   - projectType: project.type
   - subjectRoleId: resolved role
   - subjectAreaId: null OR user.areaId
5. **Resolver Lookup**: findApproversForRule() finds users with approverRoleId on the project

### 2. Current Database Field Mapping

#### ApprovalRule Fields:
- **requestType** → WorkflowTrigger.requestType
- **projectType** → WorkflowTrigger.projectType  
- **subjectRoleId** → WorkflowTrigger.role
- **subjectAreaId** → WorkflowTrigger.area (implied)
- **approverRoleId** → WorkflowStep.resolverId + ResolverType.ROLE
- **approverAreaConstraint** → WorkflowStep.scope
- **sequenceOrder** → WorkflowStep.sequence
- **companyId** → WorkflowPolicy.companyId
- **teamScopeRequired** → WorkflowStep.scope constraint

#### WatcherRule Fields:
- **requestType** → WorkflowTrigger.requestType
- **projectType** → WorkflowTrigger.projectType
- **roleId** → WorkflowWatcher.resolverId + ResolverType.ROLE
- **teamId** → WorkflowWatcher.resolverId + ResolverType.ROLE (team-based)
- **projectId** → WorkflowWatcher.resolverId + ResolverType.ROLE (project-based)
- **teamScopeRequired** → WorkflowWatcher.scope constraint
- **contractTypeId** → WorkflowTrigger.contractType

### 3. Area Constraint Analysis

**Current Implementation:**
- **subjectAreaId**: Used in rule matching (null OR user.areaId)
- **approverAreaConstraint**: Only supports 'SAME_AS_SUBJECT' string value
- **User Areas**: Users now have single areaId field

**Mapping to New System:**
```typescript
// Current: subjectAreaId matching
{ subjectAreaId: null } OR { subjectAreaId: user.areaId }

// New: ContextScope enum
ContextScope.SAME_AREA // Equivalent to 'SAME_AS_SUBJECT'
ContextScope.GLOBAL    // Equivalent to null subjectAreaId
```

### 4. Limitations of Current Implementation

#### **ApprovalRule Limitations:**
1. **Hardcoded requestType**: Only supports 'LEAVE'
2. **No contract type filtering**: Missing from ApprovalRule schema
3. **Limited area constraints**: Only 'SAME_AS_SUBJECT' or global
4. **No project scope constraint**: Missing from ApprovalRule schema
5. **No department scope constraint**: Not supported
6. **Single resolver type**: Only supports Role-based resolvers
7. **Sequence only**: No support for parallel approval steps

#### **WatcherRule Limitations:**
1. **No sequence/order**: All watchers are notified simultaneously
2. **Limited resolver types**: Only Role, Team, or Project-based
3. **No area constraints**: WatcherRule has no area constraint field
4. **No department scope**: Not supported

#### **General Limitations:**
1. **No self-approval prevention**: Must be handled manually
2. **No fallback logic**: Limited to department manager fallback
3. **No line manager support**: Current "department manager" concept
4. **No dynamic policy grouping**: Rules are flat, not logically grouped
5. **Mixed terminology**: "department manager" vs "line manager"

### 5. Strategy for Grouping Rules into Policies

#### **Policy Grouping Strategy:**

**Primary Key:** `(companyId, requestType, projectType, subjectRoleId, subjectAreaId)`

**Policy Definition:**
```typescript
interface PolicyGroup {
  trigger: {
    companyId: string;
    requestType: string;
    projectType?: string;
    subjectRoleId?: string;
    subjectAreaId?: string;
  };
  approvalRules: ApprovalRule[]; // Sorted by sequenceOrder
  watcherRules: WatcherRule[];
}
```

**Aggregation Rules:**
1. **Same Trigger = Same Policy**: Rules with identical trigger fields belong to same policy
2. **Sequence Ordering**: ApprovalRules ordered by sequenceOrder within policy
3. **Watcher Collection**: All matching WatcherRules collected as watchers
4. **Policy Name Generation**: 
   - `"{requestType} for {subjectRole.name} in {projectType}"`
   - Fallback: `"Custom Policy {triggerHash}"`

#### **UI Representation Strategy:**

**Policy List View:**
- Group rules by trigger combination
- Show summary: "3 steps, 2 watchers" 
- Enable/disable entire policy
- Expand to see individual steps

**Step Management:**
- Drag-and-drop reordering (updates sequenceOrder)
- Add/remove steps within policy
- Edit step resolver and scope

**Watcher Management:**
- Add/remove watchers within policy
- Different notification types (submit, approve, reject)

### 6. Integration Points with ApprovalRoutingService

#### **Current Integration Points:**
1. **getApprovers()** → PolicyEngine.getApprovalSteps()
2. **getApproversAdvancedMode()** → PolicyEngine.resolveWorkflow()
3. **findApproversForRule()** → WorkflowResolverService.resolveStep()
4. **createDepartmentManagerStep()** → FallbackResolverService

#### **Migration Strategy:**
1. **Phase 1**: New engine runs alongside existing service
2. **Phase 2**: Feature flag to switch between old/new
3. **Phase 3**: Deprecate ApprovalRoutingService methods
4. **Phase 4**: Remove old implementation

### 7. Required Database Changes

#### **ApprovalRule Enhancements:**
```sql
-- Add missing fields to support new workflow features
ALTER TABLE approval_rules 
ADD COLUMN contract_type_id VARCHAR(255),
ADD COLUMN project_scope_required BOOLEAN DEFAULT FALSE,
ADD COLUMN department_scope_required BOOLEAN DEFAULT FALSE,
ADD COLUMN approver_type VARCHAR(50) DEFAULT 'ROLE'; -- ROLE, USER, DEPARTMENT_MANAGER, LINE_MANAGER
```

#### **New WorkflowPolicy Table:**
```sql
CREATE TABLE workflow_policies (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company_id VARCHAR(255) NOT NULL,
  request_type VARCHAR(255) NOT NULL,
  project_type VARCHAR(255),
  subject_role_id VARCHAR(255),
  subject_area_id VARCHAR(255),
  contract_type_id VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);
```

## Recommendations

1. **Maintain backward compatibility** during migration
2. **Implement comprehensive testing** before deprecating existing service
3. **Add database migration scripts** for new fields and tables
4. **Create admin UI** for policy management
5. **Implement audit logging** for workflow changes
6. **Add performance monitoring** for workflow resolution