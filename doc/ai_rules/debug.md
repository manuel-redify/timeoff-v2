# Debug

## Scope
Systematic approach to identify and fix bugs, regressions, and non-working features.

## Rules

### 1. Debug Workflow

```
Report issue → Reproduce → Isolate → Identify → Fix → Verify → Document
```

### 2. Information Gathering

**Ask user:**
- Expected behavior vs actual behavior
- Steps to reproduce
- When did it stop working? (regression check)
- Error messages (exact text/screenshots)
- Environment (browser, OS, device if relevant)

**Load context:**
- `doc/workflow/[feature]/` (if exists)
- `doc/documentation/` (if exists)
- Ask user for context location (if not found)
- Fallback: git log, code review

### 3. Reproduction Steps

**Must reproduce issue before fixing:**
1. Follow user's steps exactly
2. Check different scenarios (happy path, edge cases)
3. Verify issue exists consistently
4. Document reproduction in debug log

**If can't reproduce:**
- Ask for more details
- Check environment differences
- Request video/screenshots
- Test on different setups

### 4. Isolation Strategy

**Narrow down systematically:**

**Binary search approach:**
```
Full feature broken
  ↓
Which component? → Test components individually
  ↓
Which function? → Add console.logs/breakpoints
  ↓
Which line? → Step through
```

**Common checks:**
- Console errors (browser DevTools)
- Network requests (DevTools Network tab)
- State values (React DevTools, console.log)
- Props passed correctly
- API responses
- Database queries

### 5. Root Cause Categories

**Frontend:**
- Component not rendering → Check props, conditionals, imports
- Event not firing → Check event handlers, bindings
- Style issues → Check Tailwind classes, dark mode
- State not updating → Check setState calls, dependencies

**Backend:**
- Endpoint not responding → Check route registration, middleware
- Wrong data returned → Check query logic, transformations
- Authentication failing → Check token validation, permissions
- Database errors → Check schema, relationships, migrations

**Integration:**
- API calls failing → Check URL, headers, payload format
- CORS errors → Check backend CORS config
- Type mismatches → Check TypeScript interfaces, API contracts

**Regression:**
- Recent change broke it → Use `git bisect` or check recent commits
- Dependency update → Check package versions, breaking changes

### 6. Debug Tools by Domain

**Frontend (React):**
```tsx
// Temporary debug logs (remove after fix)
console.log('Component render:', { props, state })
console.log('API response:', response)

// React DevTools: inspect component state/props
// Browser DevTools: Console, Network, Elements
```

**Backend:**
```js
// Temporary logs
console.log('Request received:', req.body)
console.log('Database query:', query)
console.log('Response:', response)

// Check server logs
// Use debugger or breakpoints
```

**Database:**
```sql
-- Test queries directly
SELECT * FROM users WHERE id = ?;

-- Check recent migrations
-- Verify foreign keys
```

### 7. Fix Implementation

**Before fixing:**
- [ ] Root cause identified
- [ ] Understand why it broke
- [ ] Consider side effects of fix

**During fix:**
- Write minimal fix (don't refactor unnecessarily)
- Add/update tests to prevent regression
- Follow relevant skill rules (frontend.md, etc.)

**Commit message:**
```bash
git commit -m "fix: resolve [specific issue]

Root cause: [brief explanation]
Solution: [what was changed]

Task: X.Y (if part of task)
Fixes: #[issue number] (if applicable)"
```

### 8. Verification

**After fix:**
- [ ] Original reproduction steps now work
- [ ] Related functionality still works
- [ ] No new console errors
- [ ] Tests pass (if applicable)
- [ ] Tested in relevant environments

**Regression check:**
Test scenarios beyond the bug:
- Happy path
- Edge cases
- Related features

### 9. Documentation

**Update docs if:**
- Bug revealed missing documentation
- Implementation differs from docs
- Workaround needed

**Update:** `doc/documentation/04_feature_[name]_v[N+1].md`

**Add debug notes to task checklist:**
```markdown
## Debug Log - Task X.Y
**Issue:** [Description]
**Root cause:** [What was wrong]
**Fix:** [What was changed]
**Commit:** [hash]
```

### 10. Common Pitfalls

**Don't:**
- ❌ Fix without reproducing
- ❌ Change multiple things at once
- ❌ Ignore error messages
- ❌ Skip verification
- ❌ Leave debug logs in production

**Do:**
- ✅ Reproduce first
- ✅ One change at a time
- ✅ Read error messages carefully
- ✅ Verify fix thoroughly
- ✅ Clean up debug code

## Examples

### ✅ Systematic Debug

```
User: "Login button doesn't work"

AI:
1. Gather info:
   - Expected: Navigate to dashboard after login
   - Actual: Nothing happens on click
   - Error: None visible

2. Load context:
   - Read: .doc/workflow/auth/02_checklist_t1.2_v1.md
   - Check: Recent commits on auth feature

3. Reproduce:
   - Open login page
   - Enter credentials
   - Click button
   - Confirmed: No action

4. Isolate:
   - Check console: "TypeError: onSubmit is not a function"
   - Check component: onClick handler references undefined function
   - Root cause: Missing onSubmit prop in LoginForm component

5. Fix:
   - Add onSubmit prop to LoginForm
   - Pass handleLogin function from parent

6. Verify:
   - Login now works
   - Form validation still works
   - Error handling works

7. Commit:
   git commit -m "fix: resolve login button not working

   Root cause: Missing onSubmit prop in LoginForm component
   Solution: Added onSubmit prop and passed handleLogin handler

   Task: 1.2"

8. Document:
   - Updated checklist with debug notes
```

### ✅ Regression Debug

```
User: "Feature X broke after recent changes"

AI:
1. Identify when it broke:
   - Worked yesterday
   - Check commits: 5 commits since yesterday

2. Use git bisect:
   git bisect start
   git bisect bad HEAD
   git bisect good [yesterday's commit]
   [Test at each step]

3. Found culprit commit:
   - Commit abc123: "refactor: update API response format"
   - Changed response structure
   - Frontend expects old format

4. Fix:
   - Update frontend to handle new response format
   - Add fallback for old format (if needed for compatibility)

5. Prevent future:
   - Add integration test for API contract
```

### ❌ Don't

```
User: "Something is broken"

AI: [Makes random changes without reproducing]
(Wrong - must reproduce and isolate first)
```

## Debug Checklist

When bug reported:
- [ ] Gathered complete information
- [ ] Loaded relevant context (docs, checklists)
- [ ] Reproduced issue consistently
- [ ] Isolated to specific component/function/line
- [ ] Identified root cause
- [ ] Implemented minimal fix
- [ ] Verified fix works
- [ ] Verified no new issues
- [ ] Updated tests (if applicable)
- [ ] Committed with descriptive message
- [ ] Documented if needed

## Integration

**With 02_task_planning.md:**
Add debug session to checklist as completed item with notes.

**With 03_documentation.md:**
Update docs if bug revealed incorrect documentation.

**With 04_git_workflow.md:**
Use `fix:` commit type, reference task/issue in message.

**With domain skills:**
Follow frontend.md, backend.md rules when implementing fix.

## Output Persistence

**No dedicated file.** Debug notes added to:
- Task checklist: `doc/workflow/[feature]/02_checklist_t[X.Y]_v[N].md`
- Feature docs: `doc/documentation/04_feature_[name]_v[N].md` (if needed)

**Format in checklist:**
```markdown
## Debug Log
**Date:** [ISO date]
**Issue:** Login button unresponsive
**Root cause:** Missing onSubmit prop
**Fix:** Added prop and handler
**Commit:** abc123
**Verified:** ✅
```

## Handoff

After debug:
"Bug fixed and verified. Updated [relevant files]. Ready to continue with next task?"