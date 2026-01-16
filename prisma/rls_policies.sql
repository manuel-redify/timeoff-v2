-- Enable RLS on tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_supervisor ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_holidays ENABLE ROW LEVEL SECURITY;

-- 1. Companies: Users can view their own company
DROP POLICY IF EXISTS "Users can view own company" ON companies;
CREATE POLICY "Users can view own company"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM users WHERE clerk_id = auth.uid()
    )
  );

-- 2. Departments: Users can view departments in their company
DROP POLICY IF EXISTS "Users can view departments in own company" ON departments;
CREATE POLICY "Users can view departments in own company"
  ON departments FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE clerk_id = auth.uid()
    )
  );

-- 3. Department Supervisors: Users can view supervisors in their company
DROP POLICY IF EXISTS "Users can view supervisors in own company" ON department_supervisor;
CREATE POLICY "Users can view supervisors in own company"
  ON department_supervisor FOR SELECT
  USING (
    department_id IN (
      SELECT id FROM departments WHERE company_id IN (
        SELECT company_id FROM users WHERE clerk_id = auth.uid()
      )
    )
  );

-- 4. Schedules: Users can view schedules in their company
DROP POLICY IF EXISTS "Users can view schedules in own company" ON schedules;
CREATE POLICY "Users can view schedules in own company"
  ON schedules FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE clerk_id = auth.uid()
    )
  );

-- 5. Bank Holidays: Users can view holidays in their company
DROP POLICY IF EXISTS "Users can view holidays in own company" ON bank_holidays;
CREATE POLICY "Users can view holidays in own company"
  ON bank_holidays FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE clerk_id = auth.uid()
    )
  );

-- Admin Write Policies (Assuming 'is_admin' check or role check - simplistic for now)
-- For now, we mainly ensure reading is isolated. Writing is usually done via server-side service role in creating this stack (Prisma uses connection pool usually), 
-- BUT if we use RLS with Supabase/Neon/Clerk directly from client or via RLS-enabled client, we need write policies.
-- In our stack (Next.js server actions), we often use the Service Role/Server Client which bypasses RLS? 
-- The text says "Configure RLS Policies ... to ensure data isolation".
-- Usually this implies restricting SELECT.
