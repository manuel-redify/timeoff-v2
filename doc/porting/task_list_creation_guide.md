# Task List Generation Guide

This guide provides instructions and a template for creating detailed development task lists for each phase of the TimeOff Management v2 porting project.

## Purpose
The purpose of this guide is to maintain consistency and clarity across the implementation process. Each phase defined in the [Master Plan](file:///implementation_plan/porting/porting_master_plan.md) requires a granular breakdown into small, actionable development tasks.

## File Naming Convention
All task list files must follow this naming pattern:
`development_task_list_<phase_name>.md`
(e.g., `development_task_list_user_management.md`)

## Task Writing Guidelines
- **Granularity**: Each task should take between 15 minutes and 4 hours to complete. If a task is larger, break it down further.
- **Action-Oriented**: Use verbs like "Create", "Implement", "Configure", "Write", "Verify".
- **Clarity**: Write for a developer audience but maintain business outcomes (e.g., "Implement login button" vs "Create AuthButton component").
- **Verification**: Include a specific "Done" criteria or verification step for each task.
- **Order**: Sequence tasks logically (Backend -> Frontend -> Integration -> Testing).

---

## Task List Template

Use the following structure for all new task lists:

```markdown
# Phase [Number]: [Phase Name] - Task List

## Overview
Briefly describe what we are building in this phase and the intended business outcome.

## Prerequisites
- [ ] List any phases or specific tasks that must be completed first.
- [ ] List any specific PRDs that must be read and understood.

## Detailed Task Breakdown

### 1. Database & Backend
- [ ] **[Task Title]**: [Description].
  - **Done looks like**: [Verification step].
- [ ] **[Task Title]**: [Description].
  - **Done looks like**: [Verification step].

### 2. UI & Frontend
- [ ] **[Task Title]**: [Description].
  - **Done looks like**: [Verification step].
- [ ] **[Task Title]**: [Description].
  - **Done looks like**: [Verification step].

### 3. Integration & Glue Code
- [ ] **[Task Title]**: [Description].
  - **Done looks like**: [Verification step].

## Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

## Testing & Validation Checklist
- [ ] Automated tests for [Component/Logic]
- [ ] Manual verification of [User Flow]
- [ ] Performance check (load times <2s)
- [ ] Mobile responsiveness check
```

---

## Creation Process
1. Identify the next phase in the [Master Plan](file:///implementation_plan/porting/porting_master_plan.md).
2. Read the referenced PRDs thoroughly.
3. Apply the template above to create the phase-specific task list.
4. Request review of the task list before starting execution.
