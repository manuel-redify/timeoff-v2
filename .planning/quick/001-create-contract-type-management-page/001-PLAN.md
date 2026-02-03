---
phase: 001-create-contract-type-management-page
plan: 001
type: execute
wave: 1
depends_on: []
files_modified: 
  - "app/(dashboard)/settings/layout.tsx"
  - "app/(dashboard)/settings/contract-types/page.tsx"
autonomous: true
must_haves:
  truths:
    - "Admin users can navigate to contract types management from settings"
    - "Users can view list of existing contract types with employee count"
    - "Admins can create, edit, and delete contract types"
    - "Changes to contract types persist and reflect in user management"
  artifacts:
    - path: "app/(dashboard)/settings/contract-types/page.tsx"
      provides: "Contract type management interface"
      min_lines: 200
    - path: "app/api/contract-types/route.ts"
      provides: "CRUD API for contract types"
      exports: ["GET", "POST", "PUT", "DELETE"]
  key_links:
    - from: "app/(dashboard)/settings/layout.tsx"
      to: "/settings/contract-types"
      via: "sidebar navigation"
      pattern: "href.*contract-types"
    - from: "app/(dashboard)/settings/contract-types/page.tsx"
      to: "/api/contract-types"
      via: "fetch calls for CRUD operations"
      pattern: "fetch.*api/contract-types"
---

<objective>
Create a contract type management page in the settings area for administrators to manage employee contract types.

Purpose: Enable administrators to add, edit, and delete contract types (e.g., Full-time, Part-time, Contractor) that are used when managing users.
Output: Fully functional contract type management interface integrated into existing settings layout.
</objective>

<execution_context>
@~/.config/opencode/get-shit-done/workflows/execute-plan.md
@~/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

# Existing patterns from leave-types page for reference
@app/(dashboard)/settings/leave-types/page.tsx
@app/(dashboard)/settings/layout.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Contract Types to Settings Navigation</name>
  <files>app/(dashboard)/settings/layout.tsx</files>
  <action>
    Add "Contract Types" to the sidebarNavItems array in settings layout:
    - Add new object with title "Contract Types", href "/settings/contract-types", isAdmin: true
    - Position it logically (after "Leave Types" before "Roles")
    - This will make the page accessible to admin users
  </action>
  <verify>Navigation item appears in settings sidebar for admin users</verify>
  <done>Contract Types menu item is visible and clickable in settings navigation</done>
</task>

<task type="auto">
  <name>Task 2: Create Contract Types Management Page</name>
  <files>app/(dashboard)/settings/contract-types/page.tsx</files>
  <action>
    Create a complete contract types management page following the leave-types pattern:
    - Create page.tsx in app/(dashboard)/settings/contract-types/
    - Include table view showing contract types with columns: Name, Description, Employee Count, Created Date, Actions
    - Add create/edit dialog with form fields: name (required), description (optional), color (for visual distinction)
    - Include delete confirmation with employee count warning
    - Use shadcn/ui components (Table, Dialog, Form, Button, etc.)
    - Add employee count display by querying User model grouped by contractType
    - Implement CRUD operations using fetch to /api/contract-types endpoints
    - Include loading states, error handling, and success toasts
  </action>
  <verify>Page loads at /settings/contract-types, displays table, create/edit/delete functions work</verify>
  <done>Complete contract type management interface with full CRUD functionality</done>
</task>

<task type="auto">
  <name>Task 3: Create Contract Types API Endpoints</name>
  <files>app/api/contract-types/route.ts</files>
  <action>
    Create API route for contract types CRUD operations:
    - Create route.ts in app/api/contract-types/
    - GET: Return all contract types with employee counts
    - POST: Create new contract type with validation
    - PUT: Update existing contract type
    - DELETE: Delete contract type with safety check (prevent if in use)
    - Use proper error handling and success responses
    - Include admin permission checks using existing RBAC patterns
    - Return JSON responses consistent with other API routes
  </action>
  <verify>API endpoints respond correctly to CRUD requests with proper validation</verify>
  <done>Contract types API fully functional with proper permissions and error handling</done>
</task>

</tasks>

<verification>
Test the complete contract type management workflow:
1. Navigate to Settings → Contract Types as admin
2. View existing contract types (should show "Employee" default from User model)
3. Create new contract type "Contractor" with description and color
4. Edit the newly created contract type
5. Attempt to delete "Employee" (should warn about being in use)
6. Delete the newly created "Contractor" type
7. Verify all operations show appropriate success/error messages
</verification>

<success_criteria>
Contract type management is fully operational:
- Admin users can access contract types from settings
- Contract types can be created, viewed, edited, and deleted
- Employee counts are accurately displayed
- API handles all operations with proper validation and permissions
- UI follows existing design patterns and is responsive
- Error states and loading indicators work correctly
</success_criteria>

<output>
After completion, create `.planning/quick/001-create-contract-type-management-page/001-SUMMARY.md`
</output>