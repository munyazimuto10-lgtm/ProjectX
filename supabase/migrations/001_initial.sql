-- ============================================================
-- Run this entire file in your Supabase SQL Editor once.
-- ============================================================

-- employees
CREATE TABLE IF NOT EXISTS employees (
  id                   TEXT PRIMARY KEY,
  name                 TEXT        NOT NULL,
  department           TEXT        NOT NULL,
  position             TEXT        NOT NULL,
  status               TEXT        NOT NULL DEFAULT 'Active',
  email                TEXT        NOT NULL,
  phone                TEXT        NOT NULL,
  joining_date         DATE        NOT NULL,
  hourly_rate          NUMERIC     NOT NULL DEFAULT 0,
  basic_pay            NUMERIC     NOT NULL DEFAULT 0,
  housing_allowance    NUMERIC     NOT NULL DEFAULT 0,
  transport_allowance  NUMERIC     NOT NULL DEFAULT 0,
  medical_allowance    NUMERIC     NOT NULL DEFAULT 0,
  other_allowances     NUMERIC     NOT NULL DEFAULT 0,
  bank_name            TEXT        NOT NULL DEFAULT '',
  account_number       TEXT        NOT NULL DEFAULT '',
  account_holder_name  TEXT        NOT NULL DEFAULT '',
  ifsc_code            TEXT        NOT NULL DEFAULT '',
  branch_name          TEXT        NOT NULL DEFAULT '',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- payroll_settings (always single row id=1)
CREATE TABLE IF NOT EXISTS payroll_settings (
  id           INTEGER     PRIMARY KEY DEFAULT 1,
  pension_rate NUMERIC     NOT NULL DEFAULT 6,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- tax_brackets
CREATE TABLE IF NOT EXISTS tax_brackets (
  id           SERIAL  PRIMARY KEY,
  min_income   NUMERIC NOT NULL,
  max_income   NUMERIC,
  rate         NUMERIC NOT NULL,
  base_amount  NUMERIC NOT NULL DEFAULT 0,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

-- payroll_runs
CREATE TABLE IF NOT EXISTS payroll_runs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_period     TEXT        NOT NULL,
  total_net_pay  NUMERIC     NOT NULL DEFAULT 0,
  employee_count INTEGER     NOT NULL DEFAULT 0,
  processed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- payroll_entries (one row per employee per run; doubles as audit queue)
CREATE TABLE IF NOT EXISTS payroll_entries (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id   UUID    NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id      TEXT    NOT NULL,
  name             TEXT    NOT NULL,
  department       TEXT    NOT NULL,
  hours_worked     NUMERIC NOT NULL DEFAULT 0,
  overtime_hours   NUMERIC NOT NULL DEFAULT 0,
  paid_leave_hours NUMERIC NOT NULL DEFAULT 0,
  paid_leave_days  NUMERIC NOT NULL DEFAULT 0,
  base_pay         NUMERIC NOT NULL DEFAULT 0,
  tax              NUMERIC NOT NULL DEFAULT 0,
  pension          NUMERIC NOT NULL DEFAULT 0,
  net_pay          NUMERIC NOT NULL DEFAULT 0,
  processed_date   DATE    NOT NULL DEFAULT CURRENT_DATE,
  audit_status     TEXT    NOT NULL DEFAULT 'pending',
  auditor          TEXT,
  audit_date       DATE,
  audit_comments   TEXT
);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL      PRIMARY KEY,
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Seed data
-- ============================================================

INSERT INTO employees (id, name, department, position, status, email, phone, joining_date, hourly_rate) VALUES
  ('EMP001', 'Ruvimbo Moyo',      'Engineering', 'Senior Developer',    'Active',   'ruvimbo.moyo@company.com',      '+263 77 123 4501', '2023-01-15', 75),
  ('EMP002', 'Tinashe Ncube',     'Marketing',   'Marketing Manager',   'Active',   'tinashe.ncube@company.com',     '+263 77 123 4502', '2022-08-20', 65),
  ('EMP003', 'Tariro Sibanda',    'Sales',        'Sales Executive',     'Active',   'tariro.sibanda@company.com',    '+263 77 123 4503', '2023-03-10', 60),
  ('EMP004', 'Tendai Dube',       'HR',           'HR Manager',          'Active',   'tendai.dube@company.com',       '+263 77 123 4504', '2021-11-05', 55),
  ('EMP005', 'Nyasha Ndlovu',     'Finance',      'Financial Analyst',   'Active',   'nyasha.ndlovu@company.com',     '+263 77 123 4505', '2023-02-28', 70),
  ('EMP006', 'Simbarashe Mpofu', 'Engineering', 'DevOps Engineer',     'On Leave', 'simbarashe.mpofu@company.com',  '+263 77 123 4506', '2022-05-12', 80),
  ('EMP007', 'Chenai Nyathi',    'Marketing',   'Content Specialist',  'Active',   'chenai.nyathi@company.com',     '+263 77 123 4507', '2023-06-01', 58),
  ('EMP008', 'Tapiwa Khumalo',   'Sales',        'Sales Director',      'Active',   'tapiwa.khumalo@company.com',    '+263 77 123 4508', '2020-09-15', 85)
ON CONFLICT (id) DO NOTHING;

INSERT INTO payroll_settings (id, pension_rate) VALUES (1, 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tax_brackets (min_income, max_income, rate, base_amount, sort_order) VALUES
  (0,    3000, 10,  0,   1),
  (3000, 6000, 15,  300, 2),
  (6000, NULL, 20,  750, 3);

INSERT INTO notifications (title, message, is_read, created_at) VALUES
  ('Payroll Processing Complete', 'March payroll has been successfully processed',  FALSE, NOW() - INTERVAL '2 hours'),
  ('New Employee Added',          'Ruvimbo Moyo joined Engineering department',     FALSE, NOW() - INTERVAL '5 hours'),
  ('Audit Required',              '3 payroll entries need your review',             FALSE, NOW() - INTERVAL '1 day'),
  ('System Update',               'New features available in version 2.1',          TRUE,  NOW() - INTERVAL '2 days');

-- Historical payroll runs (dashboard trend data: Oct–Mar)
DO $$
DECLARE
  run_id   UUID;
  months   TEXT[]    := ARRAY['2025-10','2025-11','2025-12','2026-01','2026-02','2026-03'];
  amounts  NUMERIC[] := ARRAY[425000,   445000,   468000,   452000,   471000,   487342];
  i        INT;
BEGIN
  FOR i IN 1..6 LOOP
    INSERT INTO payroll_runs (pay_period, total_net_pay, employee_count, processed_at)
    VALUES (
      months[i] || '-01 - ' || months[i] || '-15',
      amounts[i],
      8,
      (months[i] || '-16 00:00:00')::TIMESTAMPTZ
    )
    RETURNING id INTO run_id;

    INSERT INTO payroll_entries
      (payroll_run_id, employee_id, name, department, hours_worked, base_pay, tax, pension, net_pay, processed_date, audit_status)
    SELECT
      run_id,
      e.id,
      e.name,
      e.department,
      80,
      ROUND(amounts[i] / 8 * 1.3, 2),
      ROUND(amounts[i] / 8 * 0.2,  2),
      ROUND(amounts[i] / 8 * 0.06, 2),
      ROUND(amounts[i] / 8,        2),
      ((months[i] || '-16'))::DATE,
      'approved'
    FROM employees e;
  END LOOP;
END $$;

-- April 2026 payroll run (audit queue seed – status pending)
DO $$
DECLARE
  run_id UUID;
BEGIN
  INSERT INTO payroll_runs (pay_period, total_net_pay, employee_count, processed_at)
  VALUES ('2026-04-01 - 2026-04-15', 36983.6, 8, '2026-04-16 00:00:00')
  RETURNING id INTO run_id;

  INSERT INTO payroll_entries
    (payroll_run_id, employee_id, name, department, hours_worked, overtime_hours, base_pay, tax, pension, net_pay, processed_date, audit_status)
  VALUES
    (run_id, 'EMP001', 'Ruvimbo Moyo',      'Engineering', 80, 0, 6000,   750,   360,   4890,   '2026-04-16', 'pending'),
    (run_id, 'EMP002', 'Tinashe Ncube',     'Marketing',   80, 0, 5200,   600,   312,   4288,   '2026-04-16', 'pending'),
    (run_id, 'EMP003', 'Tariro Sibanda',    'Sales',       80, 0, 4800,   540,   288,   3972,   '2026-04-16', 'pending'),
    (run_id, 'EMP004', 'Tendai Dube',       'HR',          80, 0, 4400,   480,   264,   3656,   '2026-04-16', 'pending'),
    (run_id, 'EMP005', 'Nyasha Ndlovu',     'Finance',     80, 0, 5600,   660,   336,   4604,   '2026-04-16', 'pending'),
    (run_id, 'EMP006', 'Simbarashe Mpofu', 'Engineering', 80, 0, 6400,   810,   384,   5206,   '2026-04-16', 'pending'),
    (run_id, 'EMP007', 'Chenai Nyathi',    'Marketing',   80, 0, 4640,   516,   278.4, 3845.6, '2026-04-16', 'pending'),
    (run_id, 'EMP008', 'Tapiwa Khumalo',   'Sales',       80, 0, 6800,   870,   408,   5522,   '2026-04-16', 'pending');
END $$;
