-- Fix Row Level Security policies by using the correct Supabase auth role string
-- Supabase uses auth.role() = 'authenticated' for signed-in users.

-- Payroll Records policies
DROP POLICY IF EXISTS "Payroll Records: Authenticated users can read" ON payroll_records;
CREATE POLICY "Payroll Records: Authenticated users can read" ON payroll_records FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Payroll Records: Authenticated users can insert" ON payroll_records;
CREATE POLICY "Payroll Records: Authenticated users can insert" ON payroll_records FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Payroll Records: Authenticated users can update" ON payroll_records;
CREATE POLICY "Payroll Records: Authenticated users can update" ON payroll_records FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Deductions policies
DROP POLICY IF EXISTS "Deductions: Authenticated users can read" ON deductions;
CREATE POLICY "Deductions: Authenticated users can read" ON deductions FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Deductions: Authenticated users can insert" ON deductions;
CREATE POLICY "Deductions: Authenticated users can insert" ON deductions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Deductions: Authenticated users can update" ON deductions;
CREATE POLICY "Deductions: Authenticated users can update" ON deductions FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Payslips policies
DROP POLICY IF EXISTS "Payslips: Authenticated users can read" ON payslips;
CREATE POLICY "Payslips: Authenticated users can read" ON payslips FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Payslips: Authenticated users can insert" ON payslips;
CREATE POLICY "Payslips: Authenticated users can insert" ON payslips FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Payslips: Authenticated users can update" ON payslips;
CREATE POLICY "Payslips: Authenticated users can update" ON payslips FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Tax Forms policies
DROP POLICY IF EXISTS "Tax Forms: Authenticated users can read" ON tax_forms;
CREATE POLICY "Tax Forms: Authenticated users can read" ON tax_forms FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Tax Forms: Authenticated users can insert" ON tax_forms;
CREATE POLICY "Tax Forms: Authenticated users can insert" ON tax_forms FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Tax Forms: Authenticated users can update" ON tax_forms;
CREATE POLICY "Tax Forms: Authenticated users can update" ON tax_forms FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Users policies
DROP POLICY IF EXISTS "Users: Authenticated users can read" ON users;
CREATE POLICY "Users: Authenticated users can read" ON users FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users: Users can update their own record" ON users;
CREATE POLICY "Users: Users can update their own record" ON users FOR UPDATE
  USING (auth.uid() = id);

-- Departments policies
DROP POLICY IF EXISTS "Departments: Authenticated users can read" ON departments;
CREATE POLICY "Departments: Authenticated users can read" ON departments FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Departments: Authenticated users can insert" ON departments;
CREATE POLICY "Departments: Authenticated users can insert" ON departments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Departments: Authenticated users can update" ON departments;
CREATE POLICY "Departments: Authenticated users can update" ON departments FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Audit Logs policies
DROP POLICY IF EXISTS "Audit Logs: Authenticated users can read" ON audit_logs;
CREATE POLICY "Audit Logs: Authenticated users can read" ON audit_logs FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Audit Logs: Authenticated users can insert" ON audit_logs;
CREATE POLICY "Audit Logs: Authenticated users can insert" ON audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Audit Logs: Authenticated users can update" ON audit_logs;
CREATE POLICY "Audit Logs: Authenticated users can update" ON audit_logs FOR UPDATE
  USING (auth.role() = 'authenticated');
