# FRONTEND SYSTEM PROMPT (v3.0)

> **GATEKEEPER:** Activate these rules ONLY if the user request involves UI, styling, React components, or charts. If the task is purely Backend logic, DB schema, or Documentation, DISREGARD this file.
> 

## 1. Core Stack & Constraints

- **Framework:** Next.js (App Router)
- **UI/Charts:** shadcn/ui (Radix) + Tremor (Raw/React)
- **Icons:** Lucide React
- **Styling:** Tailwind CSS (No custom/inline CSS)
- **Data/State:** TanStack Query + Server Actions + Zustand
- **Forms:** Zod + React Hook Form

## 2. AI Operational Rules (Token Efficiency & Automation)

- **Context Check:** Verify `doc/documentation/01_architecture.md` (paths) and `design_system.md` (style).
- **No Fluff:** Skip intros/outros. Respond directly with code or commands.
- **Commands First:** `npx shadcn@latest add [component]` before code.
- **Diff-Style:** Use `// ... existing code` for large files.
- **Strict Typing:** No `any`. Use `z.infer<typeof schema>`.
- **Automatic Git Commit:** Upon completing any development task, **automatically execute/provide** a Git commit command using Conventional Commits (e.g., `git commit -m "feat(ui): implement sidebar navigation"`). This is the final and mandatory step of every implementation.

## 3. Server vs Client Components (Next.js Hybrid)

- **Server First:** Default to Server Components. Fetch data in `page.tsx` or Server Components.
- **Isolate Client Logic:** Use `'use client'` only for Leaf Components (buttons, forms, interactive charts).
- **Standard Action Response:** All Server Actions MUST return: `{ success: boolean, data?: T, error?: string }`.
- **Cache Invalidation:** Always use `revalidatePath` or `revalidateTag` inside Actions after mutations.

## 4. Next.js, SEO & A11y

- **File Conventions:** Use `error.tsx`, `loading.tsx` (streaming), and `not-found.tsx`.
- **Metadata:** Implement `export const metadata` or `generateMetadata`.
- **Semantic HTML:** Use `<main>`, `<section>`, `<article>`, `<nav>` correttamente.
- **A11y:** Descriptive `aria-label` on icon-only buttons; high contrast.

## 5. Testing & Testability (Playwright Ready)

- **Locators Priority:** Use semantic roles (`getByRole`) first.
- **Data-TestID:** Add `data-testid` only when semantic roles are insufficient.
- **Stable Selectors:** Avoid targeting Tailwind utility classes in tests.

## 6. Web Vitals & Performance

- **CLS:** Set aspect-ratio/min-height for dynamic slots.
- **LCP:** `priority` attribute on `next/image` for hero assets.
- **Lazy Loading:** `React.lazy` for heavy Tremor components.

## 7. Implementation Workflow

### Decision Tree

1. shadcn exists? -> `npx shadcn@latest add`
2. Interaction needed? -> `'use client'` on smallest component.
3. Data mutation? -> Server Action with `revalidatePath`.
4. Logic placement? -> `01_architecture.md`.
5. **Final Step:** Generate and execute the `git commit` command.

### UX Standards

- **Loading:** `<Skeleton />` matching final UI layout.
- **Feedback:** Use `Toast` (actions) or `Alert` (errors).
- **Empty States:** Visual fallback + CTA.

## 8. Implementation Examples (Dense)

### Standard Action & Response

```
// Action
export async function updateData(data: Schema) {
  try {
    revalidatePath('/dashboard');
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: "Failed to update" };
  }
}
```

## 9. Pre-Flight Checklist

- [ ]  **Automatic Git commit generated as final action?**
- [ ]  Server Action returns standard `{ success, data, error }` object?
- [ ]  `revalidatePath/Tag` called after mutations?
- [ ]  `'use client'` used only where necessary?
- [ ]  `data-testid` added where needed?
- [ ]  `npx shadcn` commands included?