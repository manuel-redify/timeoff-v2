## Scope

Transform technical analysis (PRD) into a 3-tier actionable plan: Master Plan → Detailed Phase → Task Checklist. Manage progress in real-time to ensure persistence and facilitate recovery using a Single Source of Truth (SSOT) approach for all workflow documents.

## Rules

### 1. Load Context & Initialization

Before planning:

- Read the latest version of `doc/workflow/[feature-name]/01_prd_analysis_[feature-name].md`.
- Extract functional requirements, priorities, and dependencies.
- Load necessary skill files (e.g., `frontend.md`, `backend.md`) only when required for the specific task.

### 2. Three-Tier System (Progressive Disclosure)

**Tier 1: Master Plan** (Strategic Overview)

- Maintained in a single file. Updated whenever the strategy or scope changes.
- Contains 3-5 Milestones with a total of 15-25 high-level tasks.

**Tier 2: Detailed Phase** (Milestone Planning)

- Generated/Updated in a single file per milestone.
- Breaks milestone tasks into technical sub-tasks with effort estimation (S/M/L).
- **Mapping:** Must list the source files involved.

**Tier 3: Task Checklist** (Atomic Execution)

- Maintained in a single file per task.
- List of 5-10 concrete, testable steps.

## 🔄 State Management & Persistence (CRITICAL)

### 1. Single Source of Truth & Internal Versioning

- **No File Versioning:** Do NOT use `_v1`, `_v2`, etc., in filenames. Maintain one physical file per document.
- **Living Update (Overwrite):** Overwrite the same file to update task status (`[ ]` -> `[x]`).
- **Internal Change Log:** Every significant structural or strategic change must be recorded in a `## 📜 Change Log` section at the bottom of the file (Date, Version, Description).

### 2. Real-Time Synchronization & Atomic Commits

- **Tier 3 (Checklist):** Overwrite the file **after every single completed step**.
- **Tier 1 & 2 (Master/Detailed):** Update status to `[x]` as soon as a task or milestone is finished.
- **Git Sync:** Upon completion of each Task (Tier 2), perform a commit with the message: `feat([feature-name]): completed task X.Y`.

### 3. Autonomous Execution & Blocker Protocol

- Proceed autonomously along the checklist.
- Brief feedback in chat: "✅ Step 1.2 completed. Checklist updated."
- **Blocker Protocol:** If a step fails twice, mark as `[!]`, document logs in the checklist, and stop for user intervention.

### 4. Checklist Lifecycle (Context Cleaning)

- Once a Task (X.Y) is completed and checked off in the Master Plan, move the checklist file to `doc/workflow/[feature-name]/archive/`.

### 5. Embedded Process Instructions

- Every generated file (Tier 2 & 3) **must** include a "Next Steps" section to ensure the agent follows the propagation logic.

## Output Structure

### 📋 Master Plan (Tier 1)

`doc/workflow/[feature-name]/02_task_plan_[feature-name].md`

```
# Master Plan - [Feature]
**Status:** In Progress / Completed
**Source:** 01_prd_analysis_[feature-name].md

### Milestone 1: [Name]
- [ ] 1.1: [Task Name]
[...]

## 🔄 Next Steps
- Start Milestone [X] by updating/creating the Detailed Phase file.
- Once all tasks are marked [x], trigger `03_documentation.md`.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| YYYY-MM-DD | 1.0 | Initial Plan |

```

### 📝 Detailed Phase (Tier 2)

`doc/workflow/[feature-name]/02_detailed_m[X]_[feature-name].md`

```
# Detailed Phase - Milestone [X]
**Parent:** 02_task_plan_[feature-name].md
**Files Involved:** `path/to/file1`

### Task [X.Y]: [Name]
1. [ ] [Technical sub-task]

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Archive this checklist when task X.Y is finished.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| YYYY-MM-DD | 1.0 | Milestone breakdown |

```

### ✅ Task Checklist (Tier 3)

`doc/workflow/[feature-name]/02_checklist_[feature-name]_t[X.Y].md`

```
# Checklist - Task [X.Y]
**Parent:** 02_detailed_m[X]_[feature-name].md

### Steps
- [x] Step 1: [Done]
- [ ] Step 2: [Pending]

### Done When
- [ ] [Outcome]

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| YYYY-MM-DD | 1.0 | Checklist creation |

```

## Handoff & Flow

1. **Master Plan:** Created as the single source. "Master Plan ready. Start Milestone 1?"
2. **Execution:** Update the same Tier 3 file step-by-step.
3. **Internal Tracking:** Update the `Change Log` table only for major changes (e.g., re-planning).
4. **Completion:** Archive checklist, commit, and update parent SSOT files.