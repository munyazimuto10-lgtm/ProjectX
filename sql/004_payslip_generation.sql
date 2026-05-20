-- =============================================
-- MIGRATION: Automatic Payslip Generation
-- =============================================
-- This migration adds automatic payslip generation when payroll records are created
-- It also adds functions to generate payslips for existing payroll records

-- =============================================
-- STEP 1: Create function to generate payslip
-- =============================================

CREATE OR REPLACE FUNCTION generate_payslip_for_record()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a payslip record when a payroll record is created
  INSERT INTO payslips (
    payroll_record_id,
    employee_id,
    file_url,
    file_path,
    file_size,
    generated_at
  ) VALUES (
    NEW.id,
    NEW.employee_id,
    'generated://' || NEW.id || '.pdf',
    '/payslips/' || NEW.employee_id || '/' || NEW.id || '.pdf',
    0,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- STEP 2: Create trigger for new payroll records
-- =============================================

DROP TRIGGER IF EXISTS payroll_payslip_trigger ON payroll_records;

CREATE TRIGGER payroll_payslip_trigger
AFTER INSERT ON payroll_records
FOR EACH ROW
EXECUTE FUNCTION generate_payslip_for_record();

-- =============================================
-- STEP 3: Generate payslips for existing payroll records
-- =============================================

-- First, check if there are existing payroll records without payslips
INSERT INTO payslips (
  payroll_record_id,
  employee_id,
  file_url,
  file_path,
  file_size,
  generated_at
)
SELECT 
  pr.id,
  pr.employee_id,
  'generated://' || pr.id || '.pdf',
  '/payslips/' || pr.employee_id || '/' || pr.id || '.pdf',
  0,
  NOW()
FROM payroll_records pr
LEFT JOIN payslips ps ON pr.id = ps.payroll_record_id
WHERE ps.id IS NULL
ON CONFLICT DO NOTHING;

-- =============================================
-- STEP 4: Add RLS policy for payslips
-- =============================================

-- Allow employees to view their own payslips
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payslips_select_own ON payslips;

CREATE POLICY payslips_select_own ON payslips FOR SELECT
  USING (
    -- Admin and accountants can see all payslips
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'accountant')
    )
    OR
    -- Employees can see their own payslips
    EXISTS (
      SELECT 1 FROM employees e
      INNER JOIN users u ON e.user_id = u.id
      WHERE e.id = payslips.employee_id
      AND u.id = auth.uid()
    )
  );

-- Allow employees to download/update their payslips
DROP POLICY IF EXISTS payslips_update_own ON payslips;

CREATE POLICY payslips_update_own ON payslips FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      INNER JOIN users u ON e.user_id = u.id
      WHERE e.id = payslips.employee_id
      AND u.id = auth.uid()
    )
  );

-- Allow authorized users and the employee owner to insert payslips.
-- This is required for the payroll_records trigger that auto-generates payslips.
DROP POLICY IF EXISTS payslips_insert_own ON payslips;

CREATE POLICY payslips_insert_own ON payslips FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'accountant')
    )
    OR
    EXISTS (
      SELECT 1 FROM employees e
      INNER JOIN users u ON e.user_id = u.id
      WHERE e.id = payslips.employee_id
      AND u.id = auth.uid()
    )
  );
