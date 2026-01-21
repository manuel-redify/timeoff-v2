# AI Agent Orchestrator

## Workflow
```
User Request → Identify Context → Load Skill(s) → Execute
```

## Skill Registry

| File | Triggers | Domain |
|------|----------|--------|
| `01_prd_analysis.md` | PRD, requisiti, scope, analisi | Requirements |
| `02_task_planning.md` | task, planning, breakdown, sprint | Planning |
| `03_documentation.md` | docs, README, commenti, guide | Documentation |
| `04_git_workflow.md` | git, branch, commit, PR, merge | Version Control |
| *(Add domain skills below)* | | |
| `frontend.md` | UI, component, style, React, CSS | Frontend |
| `debug.md` | debug, fix, error, bug | Debugging |

## Execution Rules

### 1. Match & Load
- Scan triggers in user request
- Read matching skill file(s) from `doc/ai_rules/`
- If multiple match → load all relevant

### 2. Apply Strictly
- Follow skill file rules exactly
- Quote rule when applying (e.g. "Per `01_prd_analysis.md` §2...")
- Never mix incompatible rules

### 3. Fallback (No Skill Found)
```
→ Notify user: "Nessuna skill per [domain]. Uso best practice generali."
→ Apply general best practices
→ Suggest: "Vuoi creare `[domain].md` in `doc/ai_rules/`?"
```

## Output Persistence

### File Naming
```
doc/workflow/[feature-name]/[skill-number]_[skill-name]_v[N].md
```

### Versioning Rules
1. **Feature name**: Extract from PRD or use user-provided name
2. **First run**: Create `_v1.md`
3. **Re-execution**: Check existing files, increment to next version (`_v2`, `_v3`...)
4. **Active version**: Always the highest number

### Save Protocol
After executing a core skill (01-04):
1. Determine feature name
2. Check `doc/workflow/[feature-name]/` for existing versions
3. Save output to new version file
4. Confirm to user: "✅ Salvato in `doc/workflow/[feature]/[file]_v[N].md`"

### Cross-Reference
When loading context:
- Check `doc/workflow/[feature-name]/` for previous outputs
- Load latest version of relevant files
- Example: Before task planning, load `01_prd_analysis_v2.md` if exists

## Response Format
```
🎯 [Context] | 📖 [Skill(s)] | ✅ [Action]
[Implementation]
```

## Priority Order
1. User explicit override
2. Skill file rules
3. General best practices (fallback only)

## New Skill Template
```markdown
# [Name]
## Scope
[What this covers]
## Rules
1. [Specific constraint]
2. [Specific constraint]
## Examples
✅ Do: [example]
❌ Don't: [example]
```

---

**Rule**: Read skill files every time. Never assume from memory.