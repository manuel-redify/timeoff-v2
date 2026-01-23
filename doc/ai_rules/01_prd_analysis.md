# PRD Analysis

## Scope
Extract requirements, objectives, and constraints from Product Requirements Document.

## Rules

### 1. Read Complete PRD
- Read entire document before responding
- Identify: objectives, scope, functional requirements, technical constraints
- Never assume unspecified requirements

### 2. Standard Output
```markdown
## 🎯 Objective
[What product/feature must do in 1-2 sentences]

## 📋 Functional Requirements
1. [What user must be able to do]
2. [...]

## 🔧 Technical Requirements
- Stack: [Technologies specified]
- Constraints: [Limits, performance, compatibility]
- Integrations: [APIs, external services]

## 🚫 Out of Scope
- [What is NOT included]

## ❓ Clarifications Needed
- [Ambiguous or missing points]
```

### 3. Priority Handling
- If PRD has priorities (MoSCoW, High/Medium/Low) → keep explicit in analysis
- If no priorities → ask user to define before proceeding

### 4. Dependencies
Highlight:
- Features depending on other features
- Blocking requirements (e.g., DB setup before API)
- Required skills (e.g., "Needs `frontend.md`")

### 5. Completeness Check
Before moving forward, verify:
- [ ] Clear objective
- [ ] Measurable requirements (avoid vague terms like "user-friendly")
- [ ] Defined stack
- [ ] No critical ambiguities

If missing → ask, don't invent.

## Examples

### ✅ Do
```
Input: "Login form with email and password"

Output:
🎯 Basic authentication form
📋 Functional:
1. Email input (format validation)
2. Password input (min 8 chars)
3. Submit button
🔧 Technical: React, form validation
❓ Clarifications: Backend exists or needs creation?
```

### ❌ Don't
```
Input: "Login form"
Output: "Creating form with email, password, remember me, 2FA..."
(Don't add unrequested features)
```

## Output Persistence

**Save to:** `doc/workflow/[feature-name]/01_prd_analysis_v[N].md`

**Process:**
1. Determine feature name: user-specified OR extract from PRD title
2. Sanitize: lowercase, hyphens (e.g., "Todo App" → "todo-app")
3. Check existing: find highest v[N], increment
4. Save with header:
```markdown
# PRD Analysis - [Feature Name]
**Version:** v[N]
**Date:** [ISO date]

[Standard output from §2]
```

**Confirm:** "✅ Saved to `doc/workflow/[feature]/01_prd_analysis_[feature]_v[N].md`"

## Handoff
After saving: "Analysis complete. Proceeding with task planning."