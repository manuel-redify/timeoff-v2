# Documentation

## Scope
Create/maintain modular, versioned documentation with master registry for efficient retrieval.

## Rules

### 1. Structure
```
doc/documentation/
├── 00_doc_master_v[N].md           # Registry + index
├── 01_architecture_v[N].md          # System design
├── 02_database_v[N].md              # Schema + models
├── 03_api_v[N].md                   # Endpoints
├── 04_feature_[name]_v[N].md        # Feature-specific
└── 05+_[topic]_v[N].md              # Other topics
```

**Naming:** 
- `00_doc_master` = always check first
- `01-09` = core docs
- `10+` or descriptive = feature/component specific
- All files use `_v[N].md` versioning

### 2. Master Registry

**Structure:**
```markdown
# Documentation Master
**Version:** v[N] | **Date:** [ISO date]

## Registry

| Doc | Status | Covers | Triggers |
|-----|--------|--------|----------|
| 01_architecture_v2.md | 🟢 | System design, stack | architecture, structure, stack |
| 02_database_v1.md | 🟡 | Schema (missing indexes) | database, schema, model |

**Status:** 🟢 Complete | 🟡 Partial | ⚪ Planned | 🔴 Outdated

## Quick Links
- [Architecture](doc/documentation/01_architecture_v2.md)
```

**Bootstrap:** If master doesn't exist:
1. Create `00_doc_master_v1.md` with empty registry
2. Proceed with first doc
3. Update master to v2

### 3. Specific Doc Template

```markdown
# [Title]
**Version:** v[N] | **Date:** [ISO date]
**Related Skills:** [which .md apply] | **Dependencies:** [other docs to read first]

## Overview
[1-2 sentence summary]

## [Sections...]

## Change Log
**v[N]:** [What changed]
```

### 4. Common Doc Types

**Architecture:** System overview, tech stack, design patterns, directory structure
**Database:** Schema diagrams, table definitions, relationships, migrations
**API:** Endpoint list, request/response formats, authentication, errors
**Feature:** Description, user flows, implementation details, testing

### 5. Auto-Update Triggers

**When code changes, auto-update docs:**
- DB schema modified → `02_database.md`
- New API endpoint → `03_api.md`
- Feature implementation → `04_feature_[name].md`
- Architecture changes → `01_architecture.md`

**Process:**
1. Detect code change context
2. Identify affected doc
3. Load latest version
4. Update relevant sections
5. Save new version
6. Update master registry (status/version)
7. Confirm: "📝 Updated [doc]_v[N].md (code sync)"

### 6. Versioning

**Increment when:**
- Major section added/removed
- Significant content changes
- Schema/API changes
- Architecture decisions

**Don't increment for:** Typos, minor formatting, small clarifications (overwrite current)

**Master version:** Increment when doc added/removed, not for doc content updates

### 7. Reading Workflow

When user asks about documented topic:
1. Load `00_doc_master_v*.md` (latest)
2. Match triggers to find relevant doc
3. Load specific doc (latest version)
4. Provide info, reference: "Per `01_architecture_v2.md`..."

## Examples

### ✅ Creating First Doc
```
User: "Document database schema"
AI:
1. No master exists → create 00_doc_master_v1.md
2. Create 02_database_v1.md
3. Update master to v2 (new doc added)
4. Add registry entry

📄 Created 00_doc_master_v1.md
📝 Created 02_database_v1.md
✅ Updated master to v2
```

### ✅ Auto-update on Code Change
```
[User modifies User table schema]
AI:
1. Detect: DB schema modified
2. Load 02_database_v2.md
3. Update User table section
4. Save as 02_database_v3.md
5. Update master registry entry

📝 Updated 02_database_v3.md (code sync)
```

### ❌ Don't
```
[Creates single massive doc with everything]
(Should create modular docs, update master)
```

## Output Persistence

**Files:** `doc/documentation/00_doc_master_v[N].md` and `doc/documentation/[NN]_[topic]_v[N].md`

**Process:**
1. Determine doc type
2. Check existing versions
3. Increment or create v1
4. Save doc
5. Update master registry
6. Confirm: "📝 Saved [name]_v[N].md + updated master"

## Handoff
After doc creation/update:
"Documentation updated. Ready to implement per these specs?"