# Git Workflow

## Scope
Conventions for branch naming, commit messages, and pull requests.

## Rules

### 1. Branch Naming

**Format:** `[type]/[feature-name]-[task-id]`

**Types:**
- `feature/` - New functionality
- `fix/` - Bug fixes
- `docs/` - Documentation only
- `refactor/` - Code restructuring
- `test/` - Tests
- `chore/` - Maintenance

**Guidelines:**
- Lowercase with hyphens (no spaces, underscores, camelCase)
- Max 50 chars
- Include task ID from task plan if available
- Base on `main` or `develop` (project-specific)

**Examples:**
```
✅ feature/user-auth-t1.2
✅ fix/login-validation-t2.5
✅ docs/api-endpoints
✅ refactor/db-queries-t3.1

❌ Feature/UserAuth (wrong case)
❌ user_authentication (underscores)
❌ fix-bug (too vague)
```

### 2. Commit Messages

**Format:**
```
[type]: [brief description]

[optional body]

[optional footer]
```

**Types:** `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`

**Guidelines:**
- Subject: Max 50 chars, imperative mood, lowercase after colon, no period
- Body: Wrap at 72 chars, explain what/why not how
- Footer: `Task: X.Y`, `Fixes #123`, `BREAKING CHANGE:`

**Examples:**
```
✅ feat: add email validation to login form

✅ fix: resolve session timeout on inactive users

Increased timeout from 15min to 30min per requirements.
Task: 2.5

✅ docs: update API authentication section

✅ refactor: simplify user data fetching

Consolidated three queries into single call. No behavior change.
Task: 3.1

❌ Added new feature (not imperative)
❌ Fix bug (too vague)
❌ updated stuff (no type, vague)
```

### 3. Commit Frequency

**When to commit:**
- After logical unit of work
- Before switching tasks
- At least once per session
- When checklist item done

**Atomic commits:** One logical change, independently revertable, tests passing.

### 4. Pull Requests

**When to create:**
- After milestone completion
- After significant task (5+ commits)
- Before switching to new major feature

**PR Title:** `[Type]: [Description] (Task X.Y)`

**PR Description:**
```markdown
## Summary
[What does this do?]

## Changes
- [Change 1]
- [Change 2]

## Related Tasks
- Task: X.Y from `doc/workflow/[feature]/02_task_plan_v[N].md`
- Checklist: `doc/workflow/[feature]/02_checklist_t[X.Y]_v[N].md`

## Testing
- [ ] Manual testing done
- [ ] Unit tests added/updated
- [ ] Integration tests passing

## Documentation
- [ ] Code comments added
- [ ] Docs updated (if applicable)

## Breaking Changes
[List or "None"]
```

### 5. Integration with Task System

**Branch from task:**
When working on Task X.Y:
1. Load `doc/workflow/[feature]/02_checklist_t[X.Y]_v[N].md`
2. Extract task ID
3. Create: `[type]/[feature-name]-t[X.Y]`

**Commit from checklist:**
Each checklist item = one commit:
```
Checklist:
- [ ] Create User model
- [ ] Add validation

Commits:
1. feat: create User model (Task 1.2)
2. feat: add User model validation (Task 1.2)
```

**PR from milestone/task:**
- One PR per task (preferred for small/medium)
- One PR per milestone (if tasks tightly coupled)
- Reference task plan in description

### 6. Lifecycle

**Creation:**
```bash
git checkout -b feature/user-auth-t1.2
```

**During work:**
```bash
git add [files]
git commit -m "feat: add login endpoint"
git push origin feature/user-auth-t1.2
```

**Before PR:**
```bash
git checkout main
git pull origin main
git checkout feature/user-auth-t1.2
git rebase main  # or merge, project-specific
```

**After merge:**
```bash
git branch -d feature/user-auth-t1.2
git push origin --delete feature/user-auth-t1.2  # if not auto-deleted
```

### 7. Special Cases

**Hotfix:** `fix/critical-[issue]`, base on `main`, expedited review
**Docs only:** `docs/[topic]`, can skip extensive testing
**Experimental:** `spike/[investigation]`, may not result in PR

## Example Workflow

**Task 1.2: Add User Authentication**

```bash
# Load context
# Read: .doc/workflow/auth/02_checklist_t1.2_v1.md

# Create branch
git checkout main
git pull origin main
git checkout -b feature/user-auth-t1.2

# Work + commit per checklist item
git add models/user.js
git commit -m "feat: create User model

Added basic User structure with validation.
Task: 1.2"

git add routes/auth.js
git commit -m "feat: add login/register endpoints

Implemented POST /auth/login and /auth/register.
Task: 1.2"

git add tests/auth.test.js
git commit -m "test: add auth endpoint tests

Covered success/error cases.
Task: 1.2"

# Push
git push origin feature/user-auth-t1.2

# Update docs (03_documentation.md handles this)
git add doc/documentation/04_feature_auth_v2.md
git commit -m "docs: update auth documentation

Reflected new endpoints.
Task: 1.2"

# Create PR
# Title: "Feature: User authentication system (Task 1.2)"
# Use template above

# After merge
git checkout main
git pull origin main
git branch -d feature/user-auth-t1.2
```

## Output Persistence

No dedicated files. Git workflow is operational:
- Branch names follow conventions
- Commit messages follow format
- PR descriptions reference task files

Completed commits noted in checklist:
```markdown
- [x] Create User model → Commit: abc123
- [x] Add validation → Commit: def456
```

## Handoff

**Before implementation:** "Creating branch per git workflow."
**During:** Commit regularly per guidelines.
**After task:** "Task complete. Ready to create PR?"