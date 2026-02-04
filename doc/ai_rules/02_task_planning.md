## Scope

Transform technical analysis (PRD) into a 3-tier actionable plan: Master Plan → Detailed Phase → Task Checklist. Manage progress in real-time to ensure persistence, reduce token waste, and facilitate recovery in case of session interruptions.

## Rules

### 1. Load Context & Initialization

Before planning:

- Read the latest version of `doc/workflow/[feature-name]/01_prd_analysis_[feature-name]_v[N].md`.
- Extract functional requirements, priorities, and dependencies.
- Load necessary skill files (e.g., `frontend.md`, `backend.md`) only when required for the specific task.

### 2. Three-Tier System (Progressive Disclosure)

**Tier 1: Master Plan** (Strategic Overview)

- Generated once (v1) or updated only if the strategy changes significantly (v2).
- Contains 3-5 Milestones with a total of 15-25 high-level tasks.

**Tier 2: Detailed Phase** (Milestone Planning)

- Generated when the user says "Start Milestone [X]".
- Breaks milestone tasks into technical sub-tasks with effort estimation (S/M/L).
- **Mapping:** Must list the source files involved (e.g., `src/components/Auth.tsx`).

**Tier 3: Task Checklist** (Atomic Execution)

- Generated when starting "Task [X.Y]".
- List of 5-10 concrete, testable steps.

## 🔄 State Management & Persistence (CRITICAL)

### 1. Living Documents vs Versioning

- **Versioning (`_vN.md`):** Create a new file version ONLY if the structure or strategy changes radically.
- **Living Update (Overwrite):** Overwrite the *same* file to update task status (`[ ]` -> `[x]`). This prevents file clutter.

### 2. Real-Time Synchronization & Atomic Commits

- **Tier 3 (Checklist):** Overwrite the file **after every single completed step**.
- **Tier 1 & 2 (Master/Detailed):** Overwrite these files to mark task `X.Y` as complete only when the entire Tier 3 checklist is finished.
- **Git Sync:** Upon completion of each Task (Tier 2), perform a commit with the message: `feat([feature-name]): completed task X.Y`.

### 3. Autonomous Execution & Blocker Protocol

- Proceed autonomously along the checklist if there are no ambiguities.
- After updating the status file, provide brief feedback in chat:
    
    > "✅ Step 1.2 completed. Checklist updated. Proceeding with 1.3."
    > 
- **Blocker Protocol:** If a step fails for 2 consecutive attempts, the agent MUST:
    1. Mark the step as `[!]` (Blocked).
    2. Document the error/logs in the checklist file.
    3. Stop and notify the user for intervention.

### 4. Checklist Lifecycle (Context Cleaning)

- Once a Task (X.Y) is completed and checked off in the Master Plan, move the `02_checklist_[feature-name]_t[X.Y].md` file to `doc/workflow/[feature-name]/archive/` to keep the active context lean.

### 5. Final Completion & Documentation Trigger

- When all tasks in the Master Plan (Tier 1) are marked as `[x]`, the project is considered functionally complete.
- **Action:** The agent MUST automatically load and invoke the `doc/ai_rules/03_documentation.md` skill to generate/update the final documentation based on the completed work.

## Output Structure

### 📋 Master Plan (Tier 1)

`doc/workflow/[feature-name]/02_task_plan_[feature-name]_v[N].md`

```
# Master Plan - [Feature]
**Status:** In Progress / Completed
**Source:** 01_prd_analysis_[feature-name]_v[N].md

### Milestone 1: [Name]
- [ ] 1.1: [Task Name]
- [ ] 1.2: [Task Name]
[...]

```

### 📝 Detailed Phase (Tier 2)

`doc/workflow/[feature-name]/02_detailed_m[X]_[feature-name]_v[N].md`

```
# Detailed Phase - Milestone [X]
**Parent:** 02_task_plan_[feature-name]_v[N].md
**Files Involved:** `path/to/file1`, `path/to/file2`

### Task [X.Y]: [Name]
1. [ ] [Technical sub-task]
2. [ ] [Technical sub-task]

```

### ✅ Task Checklist (Tier 3)

`doc/workflow/[feature-name]/02_checklist_[feature-name]_t[X.Y].md` (Overwritten live)

```
# Checklist - Task [X.Y]
**Parent:** 02_detailed_m[X]_[feature-name]_v[N].md

### Steps
- [x] Step 1: [Done]
- [!] Step 2: [ERROR: Brief description]
- [ ] Step 3: [Pending]

### Done When
- [ ] [Measurable outcome]

```

## Handoff & Flow

1. **After Master Plan:** "Master Plan v1 ready. Say 'Start Milestone 1' for details."
2. **Start Task:** Generate Tier 3 Checklist + Load source files mapped in Tier 2.
3. **Execution:** Work autonomously, overwrite Checklist at each step, notify briefly.
4. **Task End:** Archive checklist, commit to Git, update Tier 1 & 2. Ask: "Task [X.Y] complete. Move to next task?"
5. **Project Completion:** Once all Milestone tasks in the Master Plan are [x], notify the user: "Project complete! Triggering 03_documentation.md to finalize technical docs."