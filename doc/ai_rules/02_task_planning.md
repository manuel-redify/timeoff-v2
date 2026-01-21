# Task Planning

## Scope
Break PRD into 3-tier actionable tasks: Master Plan → Detailed Phase → Task Checklist.

## Rules

### 1. Load Context
Before planning:
- Read latest `.doc/workflow/[feature]/01_prd_analysis_v*.md`
- Extract functional requirements and priorities
- Identify dependencies

### 2. Three-Tier System

**Tier 1: Master Plan** (Always create first)
```markdown
## 📋 Master Plan

### Milestone 1: [Name] (Priority: High/Medium/Low)
- [ ] 1.1: [High-level task]
- [ ] 1.2: [High-level task]
[5-7 tasks total]

### Milestone 2: [Name]
- [ ] 2.1: [High-level task]
[...]

**Total:** 15-25 high-level tasks across 3-5 milestones
**Dependencies:** [List blocking relationships]
```

**Tier 2: Detailed Phase** (Generate when "Start Milestone X")
```markdown
## 📝 Detailed Phase - Milestone [N]

### Task [N.1]: [Name]
1. [ ] [Concrete action]
2. [ ] [Concrete action]
[3-5 subtasks]

**Effort:** S/M/L | **Skills:** [which .md files needed]
```

**Tier 3: Task Checklist** (Generate when "Work on Task X.Y")
```markdown
## ✅ Task Checklist - Task [X.Y]

### Steps
- [ ] [Concrete action]
[5-10 steps]

### Testing
- [ ] [Specific test]

### Done When
- [ ] [Measurable outcome]
```

### 3. Task Sizing
- **S (Small):** <2h, 1 file
- **M (Medium):** 2-4h, 2-3 files
- **L (Large):** >4h, multiple files (consider splitting)

### 4. Progressive Disclosure
**NEVER generate all tiers at once.** Token efficiency:
- Start: Master Plan only (~300 tokens)
- On demand: Detailed Phase (~200 tokens)
- On demand: Task Checklist (~150 tokens)

### 5. Dependencies
For each task:
- **Blocks:** What this enables
- **Blocked by:** What must be done first
- **Related skills:** Which `.doc/ai_rules/*.md` applies

## Examples

### ✅ Master Plan
```
Milestone 1: Core Backend (High)
- [ ] 1.1: Setup database schema
- [ ] 1.2: Implement auth API
- [ ] 1.3: Create CRUD endpoints
- [ ] 1.4: Add validation
- [ ] 1.5: Setup error handling

Dependencies: 1.2 blocked by 1.1
```

### ✅ Detailed Phase (when Milestone 1 starts)
```
Task 1.1: Setup database schema
1. [ ] Create User table (id, email, password_hash)
2. [ ] Create Task table (id, user_id, title, status)
3. [ ] Define foreign keys
4. [ ] Write migration scripts
Effort: M | Skills: backend.md
```

### ❌ Don't
```
Milestone 1: Backend
- [ ] Do all backend stuff
(Too vague, not actionable)
```

## Output Persistence

**Master Plan:** `doc/workflow/[feature]/02_task_plan_v[N].md`
**Detailed Phase:** `doc/workflow/[feature]/02_detailed_m[X]_v[N].md`
**Task Checklist:** `doc/workflow/[feature]/02_checklist_t[X.Y]_v[N].md`

**Process:**
1. Check existing versions, increment
2. Save with header:
```markdown
# [Title] - [Feature Name]
**Version:** v[N]
**Date:** [ISO date]
**Source:** 01_prd_analysis_v[X].md

[Content]
```

**Confirm:** "✅ Saved to `doc/workflow/[feature]/[filename]_v[N].md`"

## Handoff

**After Master Plan:**
"Master plan ready. Say 'start Milestone 1' for detailed breakdown."

**After Detailed Phase:**
"Milestone [N] detailed. Which task to tackle first?"

**After Checklist:**
"Task [X.Y] checklist ready. Proceeding with implementation."
Then load relevant skill files (frontend.md, backend.md, etc.).