-- =============================================
-- EXTENSIONS
-- =============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable row-level security
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE user_role AS ENUM ('admin', 'employee', 'manager', 'accountant');
CREATE TYPE employment_status AS ENUM ('active', 'on_leave', 'terminated');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'paid', 'failed');
CREATE TYPE audit_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE deduction_type AS ENUM ('tax', 'pension', 'health_insurance', 'loan', 'advance', 'other');

-- =============================================
-- TABLES
-- =============================================

-- Users table (for authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    manager_id UUID REFERENCES users(id),
    budget DECIMAL(15, 2),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    hire_date DATE NOT NULL,
    termination_date DATE,
    department_id UUID REFERENCES departments(id),
    position VARCHAR(100) NOT NULL,
    base_salary DECIMAL(12, 2) NOT NULL,
    employment_status employment_status DEFAULT 'active',
    tax_id VARCHAR(50),
    bank_account_number VARCHAR(50),
    bank_name VARCHAR(100),
    bank_routing_number VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'United States',
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    avatar_url TEXT,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payroll Records table
CREATE TABLE payroll_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    payment_date DATE NOT NULL,
    gross_pay DECIMAL(12, 2) NOT NULL,
    net_pay DECIMAL(12, 2) NOT NULL,
    total_deductions DECIMAL(12, 2) DEFAULT 0,
    total_taxes DECIMAL(12, 2) DEFAULT 0,
    pension_contribution DECIMAL(12, 2) DEFAULT 0,
    overtime_hours DECIMAL(5, 2) DEFAULT 0,
    overtime_pay DECIMAL(10, 2) DEFAULT 0,
    bonus DECIMAL(10, 2) DEFAULT 0,
    commission DECIMAL(10, 2) DEFAULT 0,
    status payment_status DEFAULT 'pending',
    notes TEXT,
    processed_by UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_pay_period CHECK (pay_period_end >= pay_period_start),
    CONSTRAINT valid_payment_date CHECK (payment_date >= pay_period_end),
    CONSTRAINT valid_net_pay CHECK (net_pay = gross_pay - total_deductions - total_taxes)
);

-- Deductions table
CREATE TABLE deductions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_record_id UUID REFERENCES payroll_records(id) ON DELETE CASCADE,
    deduction_type deduction_type NOT NULL,
    description VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    is_pre_tax BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tax Forms table
CREATE TABLE tax_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    tax_year INTEGER NOT NULL,
    form_type VARCHAR(50) NOT NULL, -- 'W-2', '1099-MISC', etc.
    form_name VARCHAR(255) NOT NULL,
    file_url TEXT,
    file_path TEXT,
    issued_date DATE NOT NULL,
    gross_wages DECIMAL(12, 2),
    federal_tax_withheld DECIMAL(12, 2),
    state_tax_withheld DECIMAL(12, 2),
    social_security_wages DECIMAL(12, 2),
    medicare_wages DECIMAL(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(employee_id, tax_year, form_type)
);

-- Payslips table (PDF documents)
CREATE TABLE payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_record_id UUID REFERENCES payroll_records(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    downloaded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL, -- 'payroll_record', 'employee', etc.
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'approve'
    old_values JSONB,
    new_values JSONB,
    status audit_status DEFAULT 'pending',
    performed_by UUID REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    review_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table (system-wide payroll settings)
CREATE TABLE payroll_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

-- Performance indexes
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_department_id ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(employment_status);
CREATE INDEX idx_employees_email ON employees(email);

CREATE INDEX idx_payroll_records_employee_id ON payroll_records(employee_id);
CREATE INDEX idx_payroll_records_status ON payroll_records(status);
CREATE INDEX idx_payroll_records_payment_date ON payroll_records(payment_date);
CREATE INDEX idx_payroll_records_period ON payroll_records(pay_period_start, pay_period_end);

CREATE INDEX idx_deductions_payroll_record_id ON deductions(payroll_record_id);
CREATE INDEX idx_deductions_type ON deductions(deduction_type);

CREATE INDEX idx_tax_forms_employee_id ON tax_forms(employee_id);
CREATE INDEX idx_tax_forms_year ON tax_forms(tax_year);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_performed_by ON audit_logs(performed_by);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- =============================================
-- TRIGGERS
-- =============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_records_updated_at BEFORE UPDATE ON payroll_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_forms_updated_at BEFORE UPDATE ON tax_forms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_settings_updated_at BEFORE UPDATE ON payroll_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit logging trigger
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (entity_type, entity_id, action, old_values, new_values, performed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'update', row_to_json(OLD), row_to_json(NEW), NEW.updated_by);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (entity_type, entity_id, action, old_values, performed_by)
        VALUES (TG_TABLE_NAME, OLD.id, 'delete', row_to_json(OLD), NULL);
        RETURN OLD;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (entity_type, entity_id, action, new_values, performed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'create', row_to_json(NEW), NEW.created_by);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to sensitive tables
CREATE TRIGGER audit_payroll_records AFTER INSERT OR UPDATE OR DELETE ON payroll_records
    FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_employees AFTER INSERT OR UPDATE OR DELETE ON employees
    FOR EACH ROW EXECUTE FUNCTION log_audit();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Departments policies
CREATE POLICY departments_select_public ON departments FOR SELECT
    USING (auth.role() = 'authenticated');

-- Users policies
CREATE POLICY users_select_own ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY users_update_own ON users FOR UPDATE
    USING (auth.uid() = id);

-- Employees policies
CREATE POLICY employees_select_all_for_admin ON employees FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'manager', 'accountant')
        )
    );

CREATE POLICY employees_select_own ON employees FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY employees_insert_admin ON employees FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY employees_update_admin ON employees FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'manager')
        )
    );

-- Payroll records policies
CREATE POLICY payroll_records_select_all_for_admin ON payroll_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'accountant')
        )
    );

CREATE POLICY payroll_records_select_own ON payroll_records FOR SELECT
    USING (
        employee_id IN (
            SELECT id FROM employees WHERE user_id = auth.uid()
        )
    );

CREATE POLICY payroll_records_insert_admin ON payroll_records FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'accountant')
        )
    );

CREATE POLICY payroll_records_update_admin ON payroll_records FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'accountant')
        )
    );

-- Tax forms policies
CREATE POLICY tax_forms_select_own ON tax_forms FOR SELECT
    USING (
        employee_id IN (
            SELECT id FROM employees WHERE user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'accountant')
        )
    );

-- Notifications policies
CREATE POLICY notifications_select_own ON notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY notifications_insert_own ON notifications FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY notifications_update_own ON notifications FOR UPDATE
    USING (user_id = auth.uid());

-- =============================================
-- INITIAL DATA (OPTIONAL)
-- =============================================

-- Insert default departments
INSERT INTO departments (name, code, description) VALUES
    ('Engineering', 'ENG', 'Software development and engineering'),
    ('Sales', 'SAL', 'Sales and business development'),
    ('Marketing', 'MKT', 'Marketing and communications'),
    ('Human Resources', 'HR', 'Human resources and talent management'),
    ('Finance', 'FIN', 'Finance and accounting');

-- Insert default payroll settings
INSERT INTO payroll_settings (setting_key, setting_value, description) VALUES
    ('tax_brackets', '[
        {"minIncome": 0, "maxIncome": 3000, "rate": 10, "baseAmount": 0},
        {"minIncome": 3000, "maxIncome": 6000, "rate": 15, "baseAmount": 300},
        {"minIncome": 6000, "maxIncome": null, "rate": 20, "baseAmount": 750}
    ]'::jsonb, 'Progressive tax brackets'),
    ('pension_rate', '6'::jsonb, 'Pension contribution rate (%)'),
    ('pay_schedule', '"monthly"'::jsonb, 'Default pay schedule (weekly, biweekly, monthly)'),
    ('overtime_multiplier', '1.5'::jsonb, 'Overtime pay multiplier');

-- =============================================
-- VIEWS
-- =============================================

-- Employee summary view
CREATE VIEW employee_summary AS
SELECT
    e.id,
    e.employee_id,
    e.first_name || ' ' || e.last_name AS full_name,
    e.email,
    e.position,
    e.base_salary,
    e.employment_status,
    d.name AS department_name,
    d.code AS department_code,
    COUNT(pr.id) AS total_payroll_records,
    COALESCE(SUM(pr.gross_pay), 0) AS total_gross_pay,
    COALESCE(SUM(pr.net_pay), 0) AS total_net_pay
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN payroll_records pr ON e.id = pr.employee_id
GROUP BY e.id, d.name, d.code;

-- Payroll summary view
CREATE VIEW payroll_summary AS
SELECT
    DATE_TRUNC('month', payment_date) AS payment_month,
    COUNT(*) AS total_records,
    SUM(gross_pay) AS total_gross_pay,
    SUM(net_pay) AS total_net_pay,
    SUM(total_deductions) AS total_deductions,
    SUM(total_taxes) AS total_taxes,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paid_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_count,
    COUNT(CASE WHEN status = 'processing' THEN 1 END) AS processing_count,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed_count
FROM payroll_records
GROUP BY payment_month
ORDER BY payment_month DESC;

-- Department payroll view
CREATE VIEW department_payroll AS
SELECT
    d.id AS department_id,
    d.name AS department_name,
    d.code AS department_code,
    COUNT(DISTINCT e.id) AS employee_count,
    SUM(e.base_salary) AS total_base_salary,
    COALESCE(SUM(pr.gross_pay), 0) AS total_gross_pay,
    COALESCE(SUM(pr.net_pay), 0) AS total_net_pay
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id AND e.employment_status = 'active'
LEFT JOIN payroll_records pr ON e.id = pr.employee_id
    AND pr.payment_date >= DATE_TRUNC('month', CURRENT_DATE)
    AND pr.payment_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY d.id, d.name, d.code;

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to calculate total deductions
CREATE OR REPLACE FUNCTION calculate_total_deductions(p_payroll_record_id UUID)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
    total DECIMAL(12, 2);
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO total
    FROM deductions
    WHERE payroll_record_id = p_payroll_record_id;

    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to get employee payroll history
CREATE OR REPLACE FUNCTION get_employee_payroll_history(p_employee_id UUID, p_limit INTEGER DEFAULT 12)
RETURNS TABLE (
    id UUID,
    pay_period_start DATE,
    pay_period_end DATE,
    payment_date DATE,
    gross_pay DECIMAL(12, 2),
    net_pay DECIMAL(12, 2),
    status payment_status
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pr.id,
        pr.pay_period_start,
        pr.pay_period_end,
        pr.payment_date,
        pr.gross_pay,
        pr.net_pay,
        pr.status
    FROM payroll_records pr
    WHERE pr.employee_id = p_employee_id
    ORDER BY pr.payment_date DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;