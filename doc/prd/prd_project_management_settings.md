# PRD | Project Management (Settings) - Light Version

**Status:** Ready for Dev
**Owner:** Product Team
**UI Technologies:** shadcn/ui, Tailwind CSS, Lucide React (Icons)

## 1. Objectives and Vision

The goal is to introduce **Project** management within the system settings. In this "light" phase, the module serves to register projects and associate them with users using specific roles. This foundation will later enable the development of the **Capacity Planning** module (resource allocation and forecasting).

### Key Principles

- **Flexibility:** A user can be assigned to multiple projects simultaneously.
- **Contextuality:** A user may have different roles depending on the project.
- **Temporality:** Every assignment must have a time horizon (essential for forecasting).
- **Future-proofing:** Prepared for "Client" entities and allocation percentages.

## 2. Data Model (Prisma Schema Update)

Based on the provided schema, we will integrate the `Client` entity and enhance `Project` and `UserProject`.

```
// New Client Model (Optional for now, but structural)
model Client {
  id        String    @id @default(uuid())
  name      String
  companyId String    @map("company_id")
  company   Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  projects  Project[]
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  @@unique([companyId, name])
  @@map("clients")
}

// Updated Project Model
model Project {
  id            String         @id @default(uuid())
  name          String
  description   String?
  status        ProjectStatus  @default(ACTIVE)
  isBillable    Boolean        @default(true) @map("is_billable")
  color         String?
  clientId      String?        @map("client_id")
  client        Client?        @relation(fields: [clientId], references: [id])
  companyId     String         @map("company_id")
  company       Company        @relation(fields: [companyId], references: [id], onDelete: Cascade)
  userProjects  UserProject[]
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")

  @@unique([companyId, name])
  @@index([companyId])
  @@map("projects")
}

// Updated UserProject Model (Join Table with Temporality)
model UserProject {
  id            String    @id @default(uuid())
  userId        String    @map("user_id")
  projectId     String    @map("project_id")
  roleId        String?   @map("role_id")
  allocation    Decimal   @default(100) @db.Decimal(5, 2)
  startDate     DateTime  @default(now()) @map("start_date")
  endDate       DateTime? @map("end_date")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  project       Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  role          Role?     @relation(fields: [roleId], references: [id])

  @@unique([userId, projectId, roleId])
  @@index([userId])
  @@index([projectId])
  @@map("user_project")
}

enum ProjectStatus {
  ACTIVE
  ARCHIVED
}

```

## 3. Functional Specifications

### 3.1 Settings > Projects Page (Admin Only)

**Features:**

- **Create Project:** Dialog with a form for Name, Client (Select with search and "Create New" option), Billable Toggle, Description, and Color Picker.
- **Edit Project:** Ability to modify all fields. If a project is moved to "Archived", it will no longer be selectable for new user assignments.
- **Delete Project:** Destructive action allowed **only** if there are no linked `UserProject` records. If records exist, the Delete button is disabled, and a tooltip suggests Archiving instead.
- **Search & Filter:** Search by project/client name and a toggle to show/hide archived projects.

### 3.2 User Management (Create/Edit User)

**Business Logic:**

- **Multiple Assignment:** A user can have N assignment rows.
- **Default Dates:** `startDate` defaults to today. `endDate` is optional.
- **Allocation Warning:** A visual indicator (alert or text color) signals if the sum of active allocations (no endDate or future endDate) exceeds 100%.
- **Role Resolution:** If `roleId` is null in the assignment row, the system applies the user's global `defaultRoleId`.

## 4. Out of Scope

1. **Approval Workflows:** Managed in a separate PRD (e.g., PMs approving leaves).
2. **Capacity Dashboard:** No graphical workload visualizations (timeline/Gantt).
3. **Automatic Balancing:** The system will not automatically adjust percentages when a new one is added.

## 5. UI/UX Design (Detailed Specifications)

### 5.1 Projects Page (Settings)

Use a shadcn `DataTable` layout.

- **Header:** Title "Projects", descriptive subtitle, search bar (`Input` with `Search` icon), and "New Project" `Button`.
- **Table Columns:**
    - **Name:** Bold text preceded by a color indicator (e.g., a small `h-3 w-3 rounded-full` circle).
    - **Client:** Secondary text. If absent, show "-" or "Internal".
    - **Info:** Badge for `Billable` (e.g., Dollar icon) and Badge for `Status` (Green for Active, Gray for Archived).
    - **Users:** Number of assigned users (e.g., "12 users").
    - **Actions:** `DropdownMenu` with Edit, Archive/Unarchive, and Delete options.

### 5.2 Create/Edit Project Modal

Use `Dialog` and `Form` with `zod` for validation.

- **Layout:** Single-column form for mobile, two-column for desktop.
- **Color Picker:** A set of 12 predefined colors (clickable circles) plus an optional hex input.
- **Client Select:** `Popover` with `Command` for search. If the client doesn't exist, show an "Add '[Name]'" option at the top of the list.

### 5.3 Project Assignment Section (User Profile)

This section should appear as a dedicated `Card` titled "Project Assignments".

- **Assignments List:** A simplified table or dynamic list of rows.
    - **Assignment Row:**
        1. **Project:** `Select` (shows only Active projects).
        2. **Role:** `Select` (list of company roles). Placeholder: "Use default role".
        3. **Allocation:** `Input` (type number) with a `%` suffix.
        4. **Period:** A `DateRangePicker` (shadcn) or two distinct `DatePicker` components for "Start" and "End".
        5. **Action:** `Button` (ghost variant, Trash icon) to remove the row.
- **Card Footer:** "Add Project" button to insert a new empty row.
- **Feedback:** Below the list, show a summary: "Total Allocation: **85%**". If > 100%, the text turns red and an `AlertTriangle` warning icon appears.

## 6. Critical Issues and Blind Spots

1. **Archived Projects:** If a user is assigned to a project that gets archived, the assignment must remain visible in the user profile (read-only) with an "Archived" badge next to the project name.
2. **Temporal Consistency:** User form validation: `endDate` must be `>= startDate`. If not, prevent saving.
3. **Performance:** The Projects `DataTable` must handle pagination if the number of projects exceeds 20-30.
4. **Audit Trail:** Every addition/modification/removal of a `UserProject` must generate a record in the existing `Audit` table, specifying the user and project involved.