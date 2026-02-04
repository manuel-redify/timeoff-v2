---
phase: 01-projects
plan: 03
type: execute
wave: 3
depends_on: ["02"]
files_modified: [src/components/project/ProjectCard.tsx, src/components/project/ProjectList.tsx, src/app/projects/route.ts, src/app/projects/page.tsx, src/app/projects/[id]/page.tsx]
autonomous: true
user_setup: []
must_haves:
  truths:
    - "UI has a Projects list with status indicators"
    - "Detail view presents project attributes and actions"
  artifacts:
    - "src/components/project/ProjectCard.tsx"
    - "src/components/project/ProjectList.tsx"
  key_links:
    - "UI components render data from API/service layer"
---

<objectives>
[UI scaffolding for Phase 1 Project CRUD]
Purpose: Provide a user-facing surface to list, view, and interact with projects.
Output: ProjectCard, ProjectList components and basic page routes for list/detail.
</objectives>

<execution_context>
@.planning/ROADMAP.md
@/gsd-discuss-phase
</execution_context>

<context>
UI layer mirrors shadcn/ui patterns; reuse Card, Avatar, Button, Input components; integrate with existing global design tokens
</context>

<tasks>

  <task type="auto">
    <name>01. Create reusable ProjectCard and ProjectList components</name>
    <files>src/components/project/ProjectCard.tsx, src/components/project/ProjectList.tsx</files>
    <action>
      Implement two components using shadcn/ui:
      - ProjectCard: shows project.name, project.description, status badge, and actions (Edit, Archive/Activate)
      - ProjectList: renders a list of projects using ProjectCard
      Include typing for Project type and fetch mechanism via props or via a simple fetch hook (assuming API exists)
    </action>
    <verify>
      - ProjectCard renders correctly with sample data in Storybook-like preview or unit test
      - ProjectList displays 3 sample projects in a list
    </verify>
    <done>
      UI components wired and ready for integration with pages
    </done>
  </task>

  <task type="auto">
    <name>02. Create Phase 1 list/detail pages using app router</name>
    <files>src/app/projects/route.tsx, src/app/projects/page.tsx, src/app/projects/[id]/page.tsx</files>
    <action>
      Create Next.js App Router pages to list projects and show a detail view with actions (Activate/Archive) wired to API endpoints.
      Use ProjectList to display items and ProjectCard for each item; detail view shows attributes and archives toggle.
    </action>
    <verify>
      - /projects route renders list view; clicking a project navigates to /projects/[id]
      - Detail view displays name, description, status, and archive/activate button
    </verify>
    <done>
      Phase 1 UI routes wired for project management section
    </done>
  </task>

</tasks>

<verification>
UI scaffolding integrated with API/service layer existing in Plan 02
</verification>

<output>
After completion, create `.planning/phases/01-projects/03-03-PLAN-SUMMARY.md`
</output>
