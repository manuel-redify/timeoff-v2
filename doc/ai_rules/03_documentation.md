## Goal

Provide rules for maintaining a modular, up-to-date, and token-efficient documentation ecosystem. This skill defines the structure and protocols for reading/writing technical documents using a Single Source of Truth (SSOT) approach.

## 1. Structure and "Must-Have" Documents

Documentation resides in `doc/documentation/`. Each topic has a single physical file (SSOT).

| ID | Doc | Required | Critical Content |
| --- | --- | --- | --- |
| **00** | `00_doc_master.md` | **YES** | Index, routing triggers, and version status. |
| **01** | `01_architecture.md` | **YES** | Tech Stack, Directory tree, Patterns, Macro flows. |
| **02** | `02_database.md` | **YES** | ER Schema, Data dictionary, Relationships, Critical indexes. |
| **03** | `03_api.md` | **YES*** | Endpoint contracts, Auth, Request/Response formats. |
| **05** | `05_setup_env.md` | **YES** | Environment variables, prerequisites, start scripts. |
| **06** | `06_business_rules.md` | NO | Domain policies and logical constraints. |
| **--** | `README.md` (root) | **YES** | Quick start and direct link to `00_doc_master.md`. |
- *Required if communication interfaces (REST, GraphQL, etc.) are present.*

## 2. Master Registry (Token-Optimized)

The `00_doc_master.md` file acts as the router. The AI only reads the rows pertinent to the current task's triggers.

| Doc | V | Triggers |
| --- | --- | --- |
| `01_architecture.md` | 3 | stack, technology, structure, pattern, folders, infra |
| `02_database.md` | 5 | schema, tables, migration, sql, models, db |
| `03_api.md` | 2 | endpoint, payload, request, auth, api, rest |
| `05_setup_env.md` | 1 | .env, installation, build, setup, environment, variables |
| `06_business_rules.md` | 1 | policy, business logic, constraints, domain rules |

## 3. Quality Standards

- **Rationale:** Always explain the *why* behind technical choices.
- **Scannability:** Mandatory use of tables for parameters and Mermaid for diagrams.
- **Examples:** Practical snippets (JSON, SQL, CLI) must be included in every document.
- **TL;DR:** Every document starts with a 3-line checkpoint for the AI.

## 4. Internal Document Template

```
# [Document Title]
**Latest Version:** v[N] | **Date:** [ISO Date]
**Parent:** [00_doc_master.md](00_doc_master.md) | **Dependencies:** [Related links]

## TL;DR (3 lines max)
> **AI Instruction:** Read ONLY this TL;DR. If NOT relevant to the current task, stop reading the file immediately to save tokens.
[Executive summary for the AI]

## Content...
[Technical details according to quality standards]

## Change Log
- **v[N]:** [Description of changes] - [Date]

```

## 5. Management Protocols (Lifecycle)

### Initialization (Audit)

When invoked for an initial check, the AI verifies the existence of Core Docs and the Master. If missing, it generates them by analyzing the current codebase.

### Reading (Efficiency)

1. Identify target files via Master Registry Triggers.
2. Execute the TL;DR Checkpoint.
3. Extract only the information strictly necessary for the task.

### Synchronization (Update)

After a system change is implemented, this skill is invoked to:

1. Identify impacted documents.
2. Update content and Change Log.
3. Increment versions in both the file and the Master Registry.

## 6. Legacy Migration

Proactively transform versioned files (e.g., `_v1.md`) or obsolete Masters into the SSOT format upon discovery.

## Handoff

"Documentation synchronization completed (SSOT). [Core docs status]. Files are updated and ready for future reference."