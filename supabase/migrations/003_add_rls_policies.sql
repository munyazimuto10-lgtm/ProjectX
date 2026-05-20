-- Add RLS policies for payroll_records, deductions, payslips, tax_forms, users, departments, and audit_logs tables

-- ============================================================
-- Enable RLS on tables that don't have it yet
-- ============================================================

ALTER TABLE IF EXISTS payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tax_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Payroll Records Policies
-- ============================================================

-- Allow authenticated users to read payroll records
CREATE POLICY "Payroll Records: Authenticated users can read"
  ON payroll_records FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert payroll records
CREATE POLICY "Payroll Records: Authenticated users can insert"
  ON payroll_records FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update payroll records
CREATE POLICY "Payroll Records: Authenticated users can update"
  ON payroll_records FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- Deductions Policies
-- ============================================================

-- Allow authenticated users to read deductions
CREATE POLICY "Deductions: Authenticated users can read"
  ON deductions FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert deductions
CREATE POLICY "Deductions: Authenticated users can insert"
  ON deductions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update deductions
CREATE POLICY "Deductions: Authenticated users can update"
  ON deductions FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- Payslips Policies
-- ============================================================

-- Allow authenticated users to read payslips
CREATE POLICY "Payslips: Authenticated users can read"
  ON payslips FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert payslips
CREATE POLICY "Payslips: Authenticated users can insert"
  ON payslips FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update payslips
CREATE POLICY "Payslips: Authenticated users can update"
  ON payslips FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- Tax Forms Policies
-- ============================================================

-- Allow authenticated users to read tax forms
CREATE POLICY "Tax Forms: Authenticated users can read"
  ON tax_forms FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert tax forms
CREATE POLICY "Tax Forms: Authenticated users can insert"
  ON tax_forms FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update tax forms
CREATE POLICY "Tax Forms: Authenticated users can update"
  ON tax_forms FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- Users Policies
-- ============================================================

-- Allow authenticated users to read users (basic info)
CREATE POLICY "Users: Authenticated users can read"
  ON users FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow users to update their own record
CREATE POLICY "Users: Users can update their own record"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- Departments Policies
-- ============================================================

-- Allow authenticated users to read departments
CREATE POLICY "Departments: Authenticated users can read"
  ON departments FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert departments
CREATE POLICY "Departments: Authenticated users can insert"
  ON departments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update departments
CREATE POLICY "Departments: Authenticated users can update"
  ON departments FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- Audit Logs Policies
-- ============================================================

-- Allow authenticated users to read audit logs
CREATE POLICY "Audit Logs: Authenticated users can read"
  ON audit_logs FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert audit logs
CREATE POLICY "Audit Logs: Authenticated users can insert"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update audit logs
CREATE POLICY "Audit Logs: Authenticated users can update"
  ON audit_logs FOR UPDATE
  USING (auth.role() = 'authenticated');
