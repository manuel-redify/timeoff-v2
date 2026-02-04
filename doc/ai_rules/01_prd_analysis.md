## Scope

Transform a narrative Product Requirements Document (PRD) into a granular, dense technical analysis ready for task planning. Ensure source traceability, preservation of critical details, and dependency mapping.

## Rules

### 1. Rigorous Analysis & Granularity

- **No Summary Bias:** Do not aggregate distinct requirements. If the PRD lists 5 specific rules for a feature, the analysis must report all 5.
- **Technical Detail:** Translate vague descriptions into logic (e.g., "Secure Login" → "Auth via JWT, regex email validation, password hashing").
- **Edge Cases:** Actively extract corner cases and error handling mentioned or implied in the PRD.

### 2. Traceability & Context

- Always identify the source file in the header.
- Maintain original priorities (MoSCoW or P0/P1) if present.
- **User Roles:** Clearly identify the actor for each action (Admin, User, Guest, etc.).

### 3. Standard Output Format

The output must strictly follow this structure:

# PRD Analysis - [Feature Name]
**Version:** v[N]
**Date:** [ISO date]
**Source PRD:** `[path/to/original_prd.md]`

## 🎯 Objective
[Brief and dense context of the final goal]

## 📋 Feature & Logic Map
| ID | Role | Feature | Functional Logic & Requirements | Edge Cases & Error Handling |
|:---|:---|:---|:---|:---|
| F01 | [Role] | [Name] | [Granular details: inputs, actions, rules] | [Error handling and corner cases] |

## 🏗️ Data Entities (Domain Model)
- **[Entity Name]:** [Key attributes and brief relationships]

## 🔗 Dependencies & Blockers
- **Internal:** [e.g., F02 requires F01 to be completed]
- **External:** [e.g., Stripe API key required]

## 🔧 Technical Stack & Constraints
- **Stack:** [Specified technologies]
- **Non-Functional:** [Performance, Security, Accessibility]
- **Constraints:** [Technical limits, compatibility]

## 🚫 Scope Boundaries
- **In-Scope:** [Key points included]
- **Out-of-Scope:** [What must NOT be developed]

## ❓ Clarifications Needed
- [Ambiguous or missing points in the PRD blocking the planning phase]

### 4. Output Persistence & Workflow

**Path:** `doc/workflow/[feature-name]/01_prd_analysis_[feature-name]_v[N].md`

**Saving Procedure:**

1. **Slugify:** Feature name in lowercase with hyphens (e.g., "User Auth" → `user-auth`).
2. **File Naming:** Format must be `01_prd_analysis_[slug]_v[N].md`.
3. **Versioning:** Check existing files in the feature folder and increment `v[N]`.
4. **Pre-save Checklist:**
    - [ ]  Source PRD reference included?
    - [ ]  Feature table complete with Roles and Logic?
    - [ ]  Main data entities identified?
    - [ ]  Internal/External dependencies mapped?
    - [ ]  Edge cases extracted?

## Handoff

After saving, confirm with:
"✅ Technical analysis completed and saved to `[file_path]`. Proceeding with task planning."
