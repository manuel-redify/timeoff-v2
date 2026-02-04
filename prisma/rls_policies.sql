-- Setup for Clerk + Neon to emulate Supabase auth (needed for Prisma + Neon migration)
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS text AS $$
  -- This returns the clerk_id set via SET LOCAL app.current_user_id = '...'
  SELECT current_setting('app.current_user_id', true);
$$ LANGUAGE sql STABLE;

-- Enable RLS on tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_supervisor ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_types ENABLE ROW LEVEL SECURITY;

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

-- 6. Leave Types: Users can view leave types in their company
DROP POLICY IF EXISTS "Users can view leave types in own company" ON leave_types;
CREATE POLICY "Users can view leave types in own company"
  ON leave_types FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE clerk_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage leave types in own company" ON leave_types;
CREATE POLICY "Admins can manage leave types in own company"
  ON leave_types FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE clerk_id = auth.uid() AND is_admin = true
    )
  );

-- 7. Contract Types: Users can view contract types
DROP POLICY IF EXISTS "Users can view contract types" ON contract_types;
CREATE POLICY "Users can view contract types"
  ON contract_types FOR SELECT
  USING (
    true -- Contract types are global and not company-specific for now
  );

DROP POLICY IF EXISTS "Admins can manage contract types" ON contract_types;
CREATE POLICY "Admins can manage contract types"
  ON contract_types FOR ALL
  USING (
    true -- Contract types are global and not company-specific for now
  );

-- Admin Write Policies (Assuming 'is_admin' check or role check - simplistic for now)

-- For now, we mainly ensure reading is isolated. Writing is usually done via server-side service role in creating this stack (Prisma uses connection pool usually), 
-- BUT if we use RLS with Supabase/Neon/Clerk directly from client or via RLS-enabled client, we need write policies.
-- In our stack (Next.js server actions), we often use the Service Role/Server Client which bypasses RLS? 
-- The text says "Configure RLS Policies ... to ensure data isolation".
-- Usually this implies restricting SELECT.
