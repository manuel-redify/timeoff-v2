---
trigger: always_on
---

# LLM Developer Guide: TimeOff Management v2 PRDs

**Purpose:** This guide explains how to effectively use the PRD documentation to build the TimeOff Management Application v2  
**Target Audience:** Large Language Models (LLMs) serving as development agents  
**Last Updated:** January 8, 2026

---

## Overview

You are building a complete rebuild (v2) of the TimeOff Management Application. This is an employee absence management system that allows companies to track vacation requests, manage allowances, and handle approval workflows.

**Key Context:**
- **Legacy Application:** Node.js/Express/Sequelize with server-side rendering
- **New Stack:** Next.js 14+ / Supabase / Clerk / shadcn/ui / Vercel
- **Goal:** 100% feature parity with improvements in UX and architecture
- **Documentation:** Modular PRDs for each feature area

---

## How to Approach Development

### Step 1: Foundation Understanding

Before coding any feature, you must:

1. **Read PRD 00** (Project Overview) completely
   - Understand the business context
   - Learn the overall architecture
   - Review the tech stack decisions
   - Understand migration requirements

2. **Review the Master Index**
   - Understand how PRDs are organized
   - Identify dependencies between features
   - Note which PRDs are completed vs. pending

3. **Examine Legacy Code** (if analyzing a feature)
   - Clone repository: `https://github.com/manuel-redify/timeoff-management-application`
   - Identify relevant files for the feature you're building
   - Extract business logic and validation rules
   - Document any unclear behavior for clarification

### Step 2: Feature-Specific Development

When building a specific feature:

1. **Read the Complete PRD** for that feature
   - Don't skip sections; requirements may be scattered throughout
   - Pay special attention to "Acceptance Criteria" sections
   - Note all dependencies on other features

2. **Check Database Schema** (PRD 12)
   - Understand data models for this feature
   - Identify required relationships
   - Note any special indexes or constraints

3. **Review API Specifications** (PRD 13)
   - Identify required endpoints for this feature
   - Understand request/response formats
   - Note authentication/authorization requirements

4. **Implement in This Order:**
   - Database schema/migrations
   - API routes (backend logic)
   - UI components
   - Integration with other features
   - Tests

### Step 3: Quality Assurance

For every feature you build:

1. **Validate Against PRD**
   - Check each requirement is implemented
   - Verify acceptance criteria are met
   - Test edge cases mentioned in PRD

2. **Follow Testing Requirements** (PRD 15)
   - Write unit tests for business logic
   - Create integration tests for API routes
   - Add E2E tests for critical user flows

3. **Security Check** (PRD 14)
   - Verify authentication is required where needed
   - Ensure RLS policies are correct
   - Check for SQL injection vulnerabilities
   - Validate input sanitization

---

## Understanding PRD Structure

Each PRD follows a consistent structure:

### Section Guide

**Executive Summary**
- High-level overview for stakeholders
- Key for understanding business context
- Defines success criteria

**Requirements Section**
- Detailed functional requirements
- THIS IS YOUR PRIMARY DEVELOPMENT GUIDE
- Contains user stories and acceptance criteria

**Technical Specifications**
- Implementation details
- Database schemas
- API endpoints
- Integration points

**User Experience Section**
- UI/UX requirements
- User flows
- Interaction patterns
- Accessibility requirements

**Dependencies Section**
- Features that must exist first
- Features that depend on this one
- External service dependencies

**Testing Section**
- Test scenarios
- Edge cases to handle
- Validation requirements

---

## Code Generation Guidelines

### Technology Stack Standards

**Next.js**
```typescript
// Use App Router (not Pages Router)
// app/
//   ├── (auth)/
//   ├── (dashboard)/
//   └── api/

// Prefer Server Components
export default async function Page() {
  const data = await fetchData();
  return <Component data={data} />;
}

// Use Client Components only when needed
'use client';
```

**Supabase**
```typescript
// Use server-side client for data fetching
import { createServerClient } from '@/lib/supabase/server';

// Use Row Level Security (RLS)
// Never bypass RLS in application code

// Prefer Supabase queries over raw SQL
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value);
```

**Clerk**
```typescript
// Use Clerk for all authentication
import { auth } from '@clerk/nextjs';

// Get current user
const { userId } = auth();

// Protect routes with middleware
import { authMiddleware } from '@clerk/nextjs';
```

**shadcn/ui**
```typescript
// Use pre-built components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Customize via Tailwind classes
<Button className="bg-blue-600">Click me</Button>
```

### Code Quality Standards

1. **TypeScript Everywhere**
   - No `any` types (use `unknown` if truly needed)
   - Define interfaces for all data structures
   - Use type guards for runtime validation

2. **Error Handling**
   ```typescript
   try {
     const result = await operation();
     return { success: true, data: result };
   } catch (error) {
     console.error('Operation failed:', error);
     return { success: false, error: 'User-friendly message' };
   }
   ```

3. **Validation**
   - Use Zod for schema validation
   - Validate on both client and server
   - Provide clear error messages

4. **Performance**
   - Use React.memo for expensive components
   - Implement proper loading states
   - Use Next.js Image component for images
   - Implement pagination for large lists

---

## Common Patterns

### Data Fetching Pattern

```typescript
// app/dashboard/page.tsx
import { createServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs';

export default async function DashboardPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');
  
  const supabase = await createServerClient();
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', userId)
    .single();
  
  return <DashboardView user={userData} />;
}
```

### API Route Pattern

```typescript
// app/api/leave-requests/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createLeaveRequestSchema = z.object({
  leaveTypeId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const validatedData = createLeaveRequestSchema.parse(body);
    
    const supabase = await createServerClient();
    
    // Business logic here
    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        user_id: userId,
        ...validatedData,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Create leave request error:', error);
    return NextResponse.json(
      { error: 'Failed to create leave request' },
      { status: 500 }
    );
  }
}
```

### Form Handling Pattern

```typescript
// components/LeaveRequestForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

export function LeaveRequestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(leaveRequestSchema),
  });
  
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Submission failed');
      
      toast({
        title: 'Success',
        description: 'Leave request submitted',
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Request'}
      </Button>
    </form>
  );
}
```

---

## Legacy Code Analysis Process

When extracting requirements from the legacy codebase:

### 1. Identify Entry Points

```bash
# Main application file
app.js

# Route definitions
lib/route/*.js

# Business logic
lib/model/*.js

# View templates (for UI structure)
views/*.hbs
```

### 2. Extract Business Logic

Look for:
- **Validation rules:** Often in model definitions or route handlers
- **Calculations:** Especially for allowances, pro-rating
- **Workflow logic:** Request approval chains, state transitions
- **Email triggers:** When notifications are sent
- **Access control:** Who can do what

### 3. Document Findings

Create notes in this format:

```markdown
## Feature: Leave Request Submission

### Legacy Location
- Route: `lib/route/requests.js` (POST /requests/new)
- Model: `lib/model/leave-request.js`
- View: `views/request_new.hbs`

### Business Rules Found
1. Start date must be >= today
2. End date must be >= start date
3. Cannot overlap with existing approved requests
4. Must have sufficient allowance (if leave type uses allowance)
5. Automatically routes to user's supervisor
6. Sends email to supervisor immediately

### Edge Cases
- Half-day requests (deducts 0.5 days)
- Spanning multiple weekends (excludes weekends from count)
- Public holidays during request (excludes from deduction)

### Questions for Clarification
- What happens if supervisor is on leave?
- Can users modify requests after submission?
```

---

## Database Migration Strategy

### Understanding v1 Schema

The legacy application uses Sequelize with these models:

```
Users
Companies
Departments
LeaveTypes
Leaves (leave requests)
UserAllowanceAdjustments
BankHolidays
Schedules
```

### Mapping to v2

When you encounter a legacy table:

1. **Identify Purpose:** What business entity does this represent?
2. **Map Fields:** Create equivalent Supabase schema
3. **Update Types:** SQLite → PostgreSQL type conversions
4. **Add Constraints:** Foreign keys, checks, defaults
5. **Add RLS:** Define who can access this data
6. **Add Indexes:** For common queries

Example mapping:

```sql
-- v1 (Sequelize)
Users {
  id INTEGER PRIMARY KEY
  email VARCHAR(255)
  name VARCHAR(255)
  password VARCHAR(255)
  company_id INTEGER
}

-- v2 (Supabase)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  USING (clerk_id = auth.uid());
```

---

## Testing Requirements

### Unit Tests

For every business logic function:

```typescript
// __tests__/lib/allowance-calculator.test.ts
describe('calculateProRatedAllowance', () => {
  it('should calculate full allowance for start date of Jan 1', () => {
    const result =