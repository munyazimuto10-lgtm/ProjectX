# PayrollPro System Architecture

## Executive Summary

PayrollPro is a cloud-based payroll management system designed to handle payroll processing, employee management, tax calculations, and compliance reporting. The system is built with a modern React frontend and can be integrated with a Supabase (PostgreSQL) backend for full cloud deployment.

## System Overview

### Technology Stack

**Frontend:**
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **State Management:** React Hooks (useState, useEffect, useMemo)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Package Manager:** pnpm

**Backend (Recommended):**
- **Database:** Supabase (PostgreSQL)
- **API:** Supabase Auto-generated REST API
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Real-time:** Supabase Realtime

**Hosting:**
- **Frontend:** Vercel
- **Database:** Supabase Cloud
- **CDN:** Vercel Edge Network

**Alternative Backend Options:**
- Node.js/Express + PostgreSQL
- Node.js/Fastify + Supabase
- Python/FastAPI + PostgreSQL

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    Admin     │  │   Employee   │  │   Manager    │          │
│  │   Portal     │  │   Portal     │  │   Portal     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┼──────────────────┘                  │
│                            │                                      │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  React Frontend  │
                    │  (Vercel CDN)    │
                    └────────┬─────────┘
                             │
         ┌───────────────────┼────────────────────┐
         │                   │                     │
         │                   │                     │
┌────────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
│  Supabase Auth  │  │ Supabase API   │  │ Supabase       │
│  - JWT Tokens   │  │ - REST/GraphQL │  │ Storage        │
│  - MFA          │  │ - Real-time    │  │ - Payslips     │
│  - Sessions     │  │ - RLS          │  │ - Tax Forms    │
└────────┬────────┘  └───────┬────────┘  └────────────────┘
         │                   │
         └─────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │    PostgreSQL     │
         │    Database       │
         │  - Tables         │
         │  - Views          │
         │  - Functions      │
         │  - Triggers       │
         └───────────────────┘
```

## Application Layers

### 1. Presentation Layer (Frontend)

#### Component Architecture

```
src/
├── app/
│   ├── App.tsx                    # Main application component
│   ├── components/
│   │   ├── Authentication.tsx     # Login, MFA, role selection
│   │   ├── EmployeePortal.tsx     # Employee-facing interface
│   │   ├── EmployeeDirectory.tsx  # Employee management
│   │   ├── PayrollProcessing.tsx  # Payroll calculations
│   │   ├── PayrollReports.tsx     # Analytics and reports
│   │   ├── AuditQueue.tsx         # Audit and approval workflow
│   │   ├── Settings.tsx           # System configuration
│   │   └── Notifications.tsx      # Notification center
│   └── lib/
│       ├── supabase.ts           # Supabase client config
│       ├── utils.ts              # Utility functions
│       └── constants.ts          # Application constants
└── styles/
    ├── theme.css                 # Design tokens
    └── fonts.css                 # Font imports
```

#### State Management Flow

```
┌─────────────────┐
│   App.tsx       │  ← Root component, manages global state
│                 │
│  State:         │
│  - isAuth       │
│  - userRole     │
│  - activeTab    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐  ┌──────────────┐
│ Admin │  │   Employee   │
│ Views │  │   Portal     │
└───────┘  └──────────────┘
```

### 2. API Layer (Backend)

#### Supabase Auto-generated API

```typescript
// Example API calls using Supabase client

// Fetch employees
const { data: employees, error } = await supabase
  .from('employees')
  .select('*')
  .eq('employment_status', 'active');

// Create payroll record
const { data: payroll, error } = await supabase
  .from('payroll_records')
  .insert({
    employee_id: employeeId,
    pay_period_start: startDate,
    pay_period_end: endDate,
    gross_pay: grossPay,
    net_pay: netPay,
    status: 'pending'
  });

// Real-time subscription
const subscription = supabase
  .channel('payroll_changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'payroll_records' },
    (payload) => {
      console.log('Change received!', payload);
    }
  )
  .subscribe();
```

#### Custom API Endpoints (Optional)

If using custom Node.js backend:

```
POST   /api/auth/login              # User authentication
POST   /api/auth/mfa/verify         # MFA verification
POST   /api/auth/logout             # User logout

GET    /api/employees               # List employees
POST   /api/employees               # Create employee
GET    /api/employees/:id           # Get employee details
PUT    /api/employees/:id           # Update employee
DELETE /api/employees/:id           # Delete employee

GET    /api/payroll                 # List payroll records
POST   /api/payroll/process         # Process payroll
GET    /api/payroll/:id             # Get payroll details
PUT    /api/payroll/:id             # Update payroll record

GET    /api/reports/summary         # Dashboard summary
GET    /api/reports/department      # Department reports
GET    /api/reports/tax             # Tax reports

GET    /api/audit                   # List audit logs
POST   /api/audit/approve/:id       # Approve audit item
POST   /api/audit/reject/:id        # Reject audit item

GET    /api/notifications           # Get user notifications
PUT    /api/notifications/:id/read  # Mark notification as read

POST   /api/files/upload            # Upload document
GET    /api/files/payslip/:id       # Download payslip
GET    /api/files/tax-form/:id      # Download tax form
```

### 3. Data Layer (Database)

#### Entity Relationships

```
users (1) ────── (1) employees
                       │
                       │ (1)
                       │
                       ▼
departments (1) ── (N) employees
                       │
                       │ (1)
                       │
                       ▼
                    (N) payroll_records
                       │
                ┌──────┼──────┬──────────┐
                │      │      │          │
                ▼      ▼      ▼          ▼
          deductions  payslips  tax_forms  audit_logs
```

See `DATABASE_SCHEMA.md` for complete schema definition.

## User Workflows

### Admin Workflow

```
┌────────────┐
│   Login    │
│  as Admin  │
└─────┬──────┘
      │
      ▼
┌────────────────────┐
│  Admin Dashboard   │
│  - Total Payroll   │
│  - Pending Audits  │
│  - Recent Updates  │
└─────┬──────────────┘
      │
      ├──► Manage Employees
      │    - Add/Edit/Delete
      │    - View Directory
      │    - Update Salaries
      │
      ├──► Process Payroll
      │    - Select Period
      │    - Calculate Taxes
      │    - Review & Approve
      │    - Generate Payslips
      │
      ├──► View Reports
      │    - Payroll Trends
      │    - Department Breakdown
      │    - Tax Summary
      │
      ├──► Audit Queue
      │    - Review Changes
      │    - Approve/Reject
      │    - View History
      │
      └──► Settings
           - Tax Brackets
           - Pension Rate
           - System Config
```

### Employee Workflow

```
┌────────────┐
│   Login    │
│ as Employee│
└─────┬──────┘
      │
      ▼
┌─────────────────┐
│  Home Screen    │
│  - Latest Pay   │
│  - Quick Actions│
└─────┬───────────┘
      │
      ├──► View Payment History
      │    - All Payslips
      │    - Download PDF
      │    - Filter by Date
      │
      ├──► Tax Forms
      │    - W-2 Forms
      │    - 1099 Forms
      │    - Download PDF
      │
      └──► Profile Settings
           - Update Info
           - Change Password
           - Sign Out
```

## Security Architecture

### Authentication Flow

```
1. User enters credentials
   │
   ▼
2. Frontend sends to Supabase Auth
   │
   ▼
3. Supabase validates credentials
   │
   ├─► Success: Return JWT token + user data
   │
   └─► Failure: Return error
   │
   ▼
4. MFA verification (if enabled)
   │
   ▼
5. Store JWT in secure httpOnly cookie
   │
   ▼
6. Frontend fetches user role from database
   │
   ▼
7. Redirect to appropriate portal
```

### Authorization Model

**Role-Based Access Control (RBAC):**

| Feature | Admin | Accountant | Manager | Employee |
|---------|-------|------------|---------|----------|
| View All Employees | ✓ | ✓ | ✓ | ✗ |
| Add/Edit Employees | ✓ | ✗ | ✓ | ✗ |
| Process Payroll | ✓ | ✓ | ✗ | ✗ |
| Approve Payroll | ✓ | ✓ | ✗ | ✗ |
| View All Payroll | ✓ | ✓ | Department | Own |
| Generate Reports | ✓ | ✓ | Department | ✗ |
| Audit Queue | ✓ | ✓ | ✗ | ✗ |
| System Settings | ✓ | ✗ | ✗ | ✗ |
| View Own Payslips | ✓ | ✓ | ✓ | ✓ |
| Update Own Profile | ✓ | ✓ | ✓ | ✓ |

### Row Level Security (RLS)

Implemented at database level:

```sql
-- Example: Employees can only see their own payroll records
CREATE POLICY payroll_records_select_own ON payroll_records
FOR SELECT USING (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

-- Example: Only admins can insert payroll records
CREATE POLICY payroll_records_insert_admin ON payroll_records
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'accountant')
  )
);
```

## Payroll Processing Workflow

```
┌─────────────────────┐
│ 1. Select Period    │
│    - Start Date     │
│    - End Date       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. Select Employees │
│    - Department     │
│    - Employment     │
│      Status         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 3. Calculate Gross  │
│    - Base Salary    │
│    - Overtime       │
│    - Bonuses        │
│    - Commissions    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 4. Calculate Tax    │
│    - Apply Tax      │
│      Brackets       │
│    - Progressive    │
│      Calculation    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 5. Calculate        │
│    Deductions       │
│    - Pension (6%)   │
│    - Health Ins.    │
│    - Loans          │
│    - Other          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 6. Calculate Net    │
│    Net = Gross -    │
│          Tax -      │
│          Deductions │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 7. Review & Approve │
│    - Preview Data   │
│    - Validate       │
│    - Approve        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 8. Save to Database │
│    - Insert Records │
│    - Generate       │
│      Payslips       │
│    - Send           │
│      Notifications  │
└─────────────────────┘
```

## Tax Calculation Algorithm

```typescript
// Progressive tax calculation
function calculateTax(grossIncome: number, taxBrackets: TaxBracket[]): number {
  let totalTax = 0;

  for (const bracket of taxBrackets) {
    if (grossIncome > bracket.minIncome) {
      const taxableAmount = bracket.maxIncome
        ? Math.min(grossIncome, bracket.maxIncome) - bracket.minIncome
        : grossIncome - bracket.minIncome;

      const bracketTax = (taxableAmount * bracket.rate) / 100;
      totalTax = bracket.baseAmount + bracketTax;
    }
  }

  return totalTax;
}

// Example tax brackets
const taxBrackets = [
  { minIncome: 0, maxIncome: 3000, rate: 10, baseAmount: 0 },
  { minIncome: 3000, maxIncome: 6000, rate: 15, baseAmount: 300 },
  { minIncome: 6000, maxIncome: null, rate: 20, baseAmount: 750 }
];

// For income of $8,500:
// - First $3,000 at 10% = $300
// - Next $3,000 at 15% = $450
// - Remaining $2,500 at 20% = $500
// Total tax = $1,250
```

## Reporting and Analytics

### Available Reports

1. **Payroll Summary Report**
   - Total payroll by month
   - Year-over-year comparison
   - Trend analysis

2. **Department Breakdown**
   - Payroll by department
   - Employee count
   - Average salary

3. **Tax Report**
   - Total taxes collected
   - Tax by employee
   - Tax bracket distribution

4. **Deduction Report**
   - Total deductions
   - Deduction by type
   - Employee deduction summary

5. **Audit Report**
   - All changes made
   - Who made changes
   - Approval status

## Performance Optimization

### Frontend Optimization

```typescript
// 1. Component memoization
const MemoizedComponent = React.memo(ExpensiveComponent);

// 2. Callback memoization
const handleClick = useCallback(() => {
  // handler logic
}, [dependencies]);

// 3. Value memoization
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

// 4. Lazy loading
const EmployeeDirectory = lazy(() => import('./components/EmployeeDirectory'));

// 5. Virtual scrolling for large lists
import { FixedSizeList } from 'react-window';
```

### Database Optimization

```sql
-- 1. Proper indexing
CREATE INDEX idx_payroll_records_employee_id ON payroll_records(employee_id);
CREATE INDEX idx_payroll_records_payment_date ON payroll_records(payment_date);

-- 2. Materialized views for reports
CREATE MATERIALIZED VIEW mv_department_payroll AS
SELECT department_id, SUM(net_pay) as total_payroll
FROM payroll_records pr
JOIN employees e ON pr.employee_id = e.id
GROUP BY department_id;

-- Refresh periodically
REFRESH MATERIALIZED VIEW mv_department_payroll;

-- 3. Query optimization
EXPLAIN ANALYZE
SELECT * FROM payroll_records WHERE employee_id = 'xxx';
```

### API Optimization

1. **Pagination:** Limit results per page
2. **Caching:** Cache frequently accessed data
3. **Compression:** Enable gzip/brotli compression
4. **CDN:** Use CDN for static assets
5. **Connection pooling:** Reuse database connections

## Scalability Considerations

### Horizontal Scaling

```
                    ┌──────────────┐
                    │ Load Balancer│
                    └───────┬──────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                   │
    ┌────▼─────┐      ┌────▼─────┐      ┌────▼─────┐
    │ Frontend │      │ Frontend │      │ Frontend │
    │ Instance │      │ Instance │      │ Instance │
    └──────────┘      └──────────┘      └──────────┘
                            │
                    ┌───────▼──────┐
                    │   Database   │
                    │   (Primary)  │
                    └───────┬──────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                   │
    ┌────▼─────┐      ┌────▼─────┐      ┌────▼─────┐
    │ Read     │      │ Read     │      │ Read     │
    │ Replica  │      │ Replica  │      │ Replica  │
    └──────────┘      └──────────┘      └──────────┘
```

### Capacity Planning

| Metric | Small | Medium | Large | Enterprise |
|--------|-------|--------|-------|------------|
| Employees | < 50 | 50-500 | 500-5000 | > 5000 |
| Monthly Payroll Records | < 600 | 600-6000 | 6K-60K | > 60K |
| Concurrent Users | < 10 | 10-50 | 50-200 | > 200 |
| Storage (monthly) | < 1GB | 1-10GB | 10-100GB | > 100GB |
| Database Size | < 5GB | 5-50GB | 50-500GB | > 500GB |

## Disaster Recovery

### Backup Strategy

1. **Automated Daily Backups** (Supabase)
2. **Point-in-Time Recovery** (7-30 days)
3. **Weekly Full Backups** (stored off-site)
4. **Monthly Archive Backups** (long-term storage)

### Recovery Plan

```
1. Detect Issue
   │
   ▼
2. Assess Impact
   │
   ▼
3. Isolate Problem
   │
   ▼
4. Restore from Backup
   │
   ▼
5. Verify Data Integrity
   │
   ▼
6. Resume Operations
   │
   ▼
7. Post-Mortem Analysis
```

### RTO and RPO

- **RTO (Recovery Time Objective):** < 4 hours
- **RPO (Recovery Point Objective):** < 1 hour
- **Data Loss Tolerance:** < 1 hour of transactions

## Compliance and Regulations

### Data Privacy (GDPR, CCPA)

- **Right to Access:** Employees can download their data
- **Right to Deletion:** Employees can request data deletion
- **Data Portability:** Export data in standard formats
- **Consent Management:** Track and manage data consents
- **Breach Notification:** Automated alerting system

### Financial Compliance

- **SOX (Sarbanes-Oxley):** Audit trails for all financial transactions
- **PCI DSS:** If processing credit card payments
- **Tax Compliance:** Accurate tax calculations and reporting

### Security Standards

- **ISO 27001:** Information security management
- **SOC 2:** Security, availability, confidentiality
- **NIST Framework:** Cybersecurity best practices

## Monitoring and Observability

### Key Metrics

1. **Application Metrics:**
   - Request rate
   - Error rate
   - Response time (p50, p95, p99)
   - Uptime percentage

2. **Database Metrics:**
   - Query performance
   - Connection pool usage
   - Database size
   - Index hit rate

3. **Business Metrics:**
   - Payroll processing time
   - Failed payments
   - User activity
   - Report generation time

### Alerting

```yaml
# Example alert rules

- name: High Error Rate
  condition: error_rate > 5%
  action: notify_team

- name: Slow Database Queries
  condition: query_time > 2s
  action: log_and_notify

- name: Failed Payroll Processing
  condition: payroll_status = failed
  action: urgent_alert

- name: High Memory Usage
  condition: memory_usage > 90%
  action: scale_up
```

## Future Enhancements

1. **Mobile App** (React Native)
2. **Machine Learning** for payroll predictions
3. **Multi-currency** support
4. **Time tracking** integration
5. **Benefits management**
6. **Expense reimbursement**
7. **Performance reviews**
8. **Training and onboarding**

## Conclusion

PayrollPro is designed as a scalable, secure, and compliant cloud-based payroll management system. The architecture supports growth from small startups to large enterprises while maintaining performance, security, and reliability.

For implementation details, refer to:
- `SETUP_GUIDE.md` - Local development setup
- `DEPLOYMENT_GUIDE.md` - Production deployment
- `DATABASE_SCHEMA.md` - Database structure and setup
