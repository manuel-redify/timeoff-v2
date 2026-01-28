---
trigger: always_on
---

## AI Agent System Prompt

You are operating under a modular skill system for this project. Follow these rules for every interaction:

### Core Behavior

1. **Load orchestrator first**: Read `doc/ai_rules/orchestrator.md` at the start of each task
2. **Retrieve before execute**: Always load relevant skill files from `doc/ai_rules/` before taking action
3. **Follow the workflow**: Use the 3-step process (Identify Context → Retrieve Rules → Execute Strictly)
4. **Save all outputs**: Core skill outputs must be saved to `doc/workflow/[feature-name]/` with versioning

### Project Structure

```
doc/
├── ai_rules/              # Skill system (READ)
│   ├── 00_orchestrator.md    # How to operate
│   ├── 01_prd_analysis.md
│   ├── 02_task_planning.md
│   ├── 03_documentation.md
│   └── 04_git_workflow.md
├── workflow/              # Session outputs (WRITE)
│   └── [feature-name]/
│       ├── 01_prd_analysis_v[N].md
│       ├── 02_task_plan_v[N].md
│       ├── 02_detailed_m[N]_v[N].md
│       └── 02_checklist_t[N.X]_v[N].md
└── documentation/         # Project docs (WRITE)
    ├── 00_doc_master_v[N].md
    └── [NN]_[topic]_v[N].md
```

### Skill Registry Quick Reference

| Skill | Triggers | Output Location |
|-------|----------|-----------------|
| 01_prd_analysis.md | PRD, requirements, analysis | doc/workflow/[feature]/01_prd_analysis_v[N].md |
| 02_task_planning.md | task, plan, milestone, breakdown | doc/workflow/[feature]/02_task_plan_v[N].md |
| 03_documentation.md | document, docs, README | doc/documentation/[NN]_[topic]_v[N].md |
| 04_git_workflow.md | git, commit, branch, PR | (commit messages, branch names) |

### Operational Rules

**Versioning:**
- Check existing files before saving
- Increment version number for new saves (v1 → v2 → v3)
- Never overwrite existing versions

**Context Loading:**
- When resuming work on a feature, load latest versions from `doc/workflow/[feature-name]/`
- When referencing documentation, load `00_doc_master` first, then specific docs

**Auto-updates:**
- Code changes to schema → update `doc/documentation/02_database_v[N].md`
- New API endpoint → update `doc/documentation/03_api_v[N].md`
- Feature implementation → update `doc/documentation/04_feature_[name]_v[N].md`
- Always update `00_doc_master` when docs change

**Response Format:**
```
🎯 [Context identified] | 📖 [Skill(s) loaded] | ✅ [Action taken]
[Implementation]
✅ Saved to [file path]
```

**Fallback Behavior:**
- If no skill file exists for a domain, notify user and use general best practices
- Suggest creating new skill file for future consistency
- Quote which rule you're following: "Per `01_prd_analysis.md` §2..."

### Progressive Workflow

Follow this natural progression:
1. PRD Analysis → saves to `01_prd_analysis_v[N].md`
2. Master Plan → saves to `02_task_plan_v[N].md`
3. Milestone Detail → saves to `02_detailed_m[N]_v[N].md` (on demand)
4. Task Checklist → saves to `02_checklist_t[N.X]_v[N].md` (on demand)
5. Implementation → follows relevant skill + updates docs
6. Git Workflow → follows `04_git_workflow.md`

### Priority Hierarchy

1. User explicit override ("ignore the rules")
2. Skill file rules from `.doc/ai_rules/`
3. General best practices (fallback only)

### Self-Check Protocol

Before delivering output, verify:
- [ ] Did I read the relevant skill file(s)?
- [ ] Am I following written rules exactly?
- [ ] Did I save output with correct versioning?
- [ ] Did I update master files if needed (00_doc_master)?

---

**Remember:** Never assume. Always retrieve. Execute strictly. Save with versioning.

---