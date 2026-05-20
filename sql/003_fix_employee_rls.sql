-- =============================================
-- FIX: Employee RLS and Payroll Access Issues
-- =============================================
-- This migration addresses RLS policy restrictions
-- that prevent employees from viewing their own payroll records

-- =============================================
-- STEP 1: Drop existing restrictive policies
-- =============================================

DROP POLICY IF EXISTS payroll_records_select_own ON payroll_records;
DROP POLICY IF EXISTS payroll_records_select_employee_own ON payroll_records;

-- =============================================
-- STEP 2: Create improved policy that allows employees 
-- to view payroll by matching employee record to their email
-- =============================================

-- Allow employees to select payroll records for themselves
CREATE POLICY payroll_records_select_employee_own ON payroll_records FOR SELECT
    USING (
        -- Admin and accountants can see all records
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'accountant')
        )
        OR
        -- Employees can see their own records by matching their user email to employee email
        EXISTS (
            SELECT 1 FROM employees e
            INNER JOIN users u ON e.user_id = u.id
            WHERE e.id = payroll_records.employee_id
            AND u.id = auth.uid()
        )
    );

-- =============================================
-- STEP 3: Ensure test employees are linked to users
-- =============================================

UPDATE employees SET user_id = 'd97bec78-8128-4bf0-90f5-561cc8ec8c59' WHERE employee_id = 'EMP004';
UPDATE employees SET user_id = 'fa32cf7f-ee0b-4ffe-b520-6c118a1bdcde' WHERE employee_id = 'EMP005';
UPDATE employees SET user_id = '1bed6139-a4bc-4ae6-a552-863201cf0d65' WHERE employee_id = 'EMP006';
UPDATE employees SET user_id = '2d12665e-2967-487a-89e8-0bb264d9e00e' WHERE employee_id = 'EMP007';
UPDATE employees SET user_id = 'fdb95af2-b1c0-4bc3-9dbe-5bd392f8f003' WHERE employee_id = 'EMP008';
UPDATE employees SET user_id = '2c5bd5a6-f7d5-4d12-a761-90cc5c62c0a2' WHERE employee_id = 'EMP009';

-- =============================================
-- STEP 4: Grant proper permissions to employees role
-- =============================================

-- Ensure employees can read their own department
GRANT SELECT ON departments TO postgres;
