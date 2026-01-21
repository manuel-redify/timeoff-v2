# Frontend Development

## Scope
React UI development using shadcn/ui for components and Tremor for charts. Tailwind CSS only.

## Rules

### 1. Component Library Priority

**Decision Tree:**
```
Need component → shadcn/ui exists? → Use it
               ↓ No
               → Customize existing? → Customize
               ↓ No
               → Build custom (document why)
```

**CRITICAL**: Always check https://ui.shadcn.com/docs/components BEFORE writing custom code.

**shadcn/ui includes:** Button, Dialog, Card, Form, Input, Select, Table, Tabs, Toast, Dropdown, Calendar, Checkbox, Switch, Badge, Alert, Accordion, Avatar, Popover, Sheet, Command, Navigation, Separator, Progress, Tooltip (50+ total).

**Installation:**
```bash
npx shadcn@latest add [component-name]
```

### 2. Charts: Tremor Only

Use Tremor for ALL data visualization. Never use Recharts, Chart.js, or custom SVG charts.

**Available:** AreaChart, BarChart, LineChart, DonutChart, ProgressBar, Metric cards, Sparklines.

```bash
npm install @tremor/react
```

### 3. File Structure

```
components/
├── ui/          # shadcn (auto-generated)
├── charts/      # Tremor wrappers
└── custom/      # Custom (rare, document reason)
```

### 4. Styling

**Required:**
- Tailwind CSS only (no custom CSS files)
- Dark mode support: `dark:` variant
- Mobile-first: `md:` then `lg:`
- Organize classes: layout → spacing → colors → effects

**Forbidden:**
- Inline styles (except dynamic values)
- CSS-in-JS libraries
- Custom CSS files

### 5. Customization Patterns

**Via Props:**
```tsx
<Button variant="destructive" size="lg">Delete</Button>
```

**Via Composition:**
```tsx
<Card>
  <CardHeader><CardTitle>Title</CardTitle></CardHeader>
  <CardContent><Button>Action</Button></CardContent>
</Card>
```

**Via className:**
```tsx
<Button className="w-full mt-4">Full Width</Button>
```

### 6. Forms

Use shadcn/ui Form + react-hook-form + zod:
```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const schema = z.object({ email: z.string().email() })
const form = useForm({ resolver: zodResolver(schema) })
```

### 7. Tremor + shadcn Integration

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart } from "@tremor/react"

<Card>
  <CardHeader><CardTitle>Revenue</CardTitle></CardHeader>
  <CardContent>
    <AreaChart data={data} index="date" categories={["value"]} />
  </CardContent>
</Card>
```

### 8. Accessibility

- shadcn/ui components are accessible by default
- Use semantic HTML
- Add ARIA labels only when needed
- Maintain WCAG AA contrast

### 9. State Management

**Priority:**
1. Local state: `useState`
2. Forms: `react-hook-form`
3. Global: React Context or Zustand
4. Server: TanStack Query

### 10. Performance

**Code splitting:**
```tsx
const HeavyChart = lazy(() => import("./charts/heavy"))
<Suspense fallback={<div>Loading...</div>}><HeavyChart /></Suspense>
```

Use `memo` and `useMemo` only for proven bottlenecks.

## Examples

### ✅ Modal with Form
```tsx
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

<Dialog>
  <DialogContent>
    <DialogHeader>Create User</DialogHeader>
    <Form {...form}>
      <FormField name="name" render={({ field }) => (
        <FormItem>
          <FormLabel>Name</FormLabel>
          <Input {...field} />
        </FormItem>
      )} />
    </Form>
  </DialogContent>
</Dialog>
```

### ✅ Dashboard with Charts
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, BarChart } from "@tremor/react"

<div className="grid gap-4 md:grid-cols-2">
  <Card>
    <CardHeader><CardTitle>Revenue</CardTitle></CardHeader>
    <CardContent>
      <AreaChart data={revenue} index="date" categories={["value"]} />
    </CardContent>
  </Card>
  <Card>
    <CardHeader><CardTitle>Sales</CardTitle></CardHeader>
    <CardContent>
      <BarChart data={sales} index="month" categories={["count"]} />
    </CardContent>
  </Card>
</div>
```

### ❌ Don't Build Custom
```tsx
// ❌ Wrong - custom modal
<div className="fixed inset-0 bg-black/50">
  <div className="bg-white rounded p-4">...</div>
</div>
// Use shadcn Dialog instead!

// ❌ Wrong - other chart library
import { LineChart } from "recharts"
// Use Tremor instead!
```

## Pre-Implementation Checklist

- [ ] Checked shadcn/ui docs
- [ ] Using Tremor for charts
- [ ] Tailwind CSS only
- [ ] Dark mode support
- [ ] Mobile responsive classes
- [ ] If custom component: documented justification

## Git Commits

```bash
git commit -m "feat: add user dialog using shadcn Dialog"
git commit -m "feat: implement revenue chart with Tremor AreaChart"
git commit -m "refactor: replace custom modal with shadcn Dialog"
```