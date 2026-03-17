# Documentation Master
**Version:** v7 | **Date:** 2026-03-17

## Registry

| Doc | V | Status | Covers | Triggers |
|-----|---|--------|--------|----------|
| [01_architecture.md](01_architecture.md) | 4 | 🟢 | Tech Stack, Directory tree, Patterns, Macro flows | stack, technology, structure, pattern, folders, infra |
| [02_database_v1.md](02_database_v1.md) | 1 | 🟢 | Database schema, ER diagrams, relationships | database, schema, tables, models |
| [04_first_admin_setup_v1.md](04_first_admin_setup_v1.md) | 1 | 🟢 | First admin configuration, seeding | first admin, admin setup, seeding |
| [05_google_oauth_setup.md](05_google_oauth_setup.md) | 1 | 🟡 | Google OAuth configuration | oauth, google, authentication |
| [06_user_provisioning_workflow.md](06_user_provisioning_workflow.md) | 1 | 🟡 | User provisioning process | user provisioning, workflow |
| [11_project_management_feature_v1.md](11_project_management_feature_v1.md) | 1 | 🟢 | Project management, client management, resource allocation | projects, clients, allocation |
| [Roles Management](roles_management_feature.md) | 1 | 🟡 | Role management functionality | roles, permissions |
| [Share All Absences](share_all_absences_feature.md) | 1 | 🟡 | Absence sharing feature | absences, sharing |
| [Area Management](area_management_v1.md) | 1 | 🟢 | Area management functionality | areas, organizational structure |
| [Backend Map](backend-map.md) | 1 | 🟢 | Models, actions, and services inventory | backend, manifest, models, action, service |
| [Security Audit](be_security_audit.md) | 1 | 🟢 | Security & Tenant Isolation Audit (lib/actions) | security, audit, tenant, isolation, actions |
| [Navbar Restyling](12_navbar_restyling_v1.md) | 1 | ⚪ | Navigation bar restyling | navbar, navigation, header, style |
| [Calendar Mobile](13_calendar_mobile_v1.md) | 1 | ⚪ | Mobile-optimized calendar grid and layout | calendar, mobile, grid, touch |
| [Workflow Engine](14_workflow_engine_v1.md) | 1 | 🟢 | Admin Workflow Engine, Multi-role, Fallbacks | workflow, approval, roles, engine |
| [Admin On-Behalf](15_admin_on_behalf_v1.md) | 1 | 🟢 | Admin on-behalf creation, balance override, direct status | admin, on-behalf, override, bypass |

**Status:** 🟢 Complete | 🟡 Partial | ⚪ Planned | 🔴 Outdated

## Quick Links
- [Architecture](01_architecture.md)
- [Database Schema](02_database_v1.md)
- [First Admin Setup](04_first_admin_setup_v1.md)
- [Google OAuth Setup](05_google_oauth_setup.md)
- [User Provisioning Workflow](06_user_provisioning_workflow.md)
- [Project Management](11_project_management_feature_v1.md)
- [Roles Management](roles_management_feature.md)
- [Share All Absences](share_all_absences_feature.md)
- [Area Management](area_management_v1.md)
- [Backend Map](backend-map.md)
- [Navbar Restyling](12_navbar_restyling_v1.md)
- [Calendar Mobile](13_calendar_mobile_v1.md)
- [Admin On-Behalf](15_admin_on_behalf_v1.md)

## Documentation Categories

### Core Infrastructure
- **Architecture** - Tech Stack, Directory structure, and Core Patterns
- **Database Schema** - Complete ER diagrams and field definitions
- **Backend Map** - Models, Actions, and Services Inventory

### User Management
- **First Admin Setup** - Initial system configuration
- **User Provisioning** - User creation workflows
- **Roles Management** - Permission and role configuration

### Features
- **Project Management** - Project, client, and resource allocation management
- **Area Management** - Organizational structure management
- **Absence Sharing** - Leave visibility and sharing settings
- **Calendar Mobile** - Mobile-optimized layout for the calendar views
- **Admin On-Behalf** - Privileged leave creation and bypass flow

### Integrations
- **Google OAuth** - Authentication configuration

## Recent Changes (v5)

### Added
- **01_architecture.md** - New comprehensive architecture documentation

### Migrated
- Migrated legacy `00_doc_master_v4.md` to SSOT format `00_doc_master.md`.

### Added (v6)
- **Calendar Mobile** - Added planned documentation for mobile calendar features.

## Notes

- All documentation follows the versioning scheme defined in `doc/ai_rules/03_documentation.md`
- New documents should be added to the registry with appropriate status and triggers
- Update this master when adding new documentation files
- Document status should be reviewed quarterly
