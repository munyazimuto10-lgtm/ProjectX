## Payroll System Troubleshooting: Step-by-Step Fix

### Problems Identified

1. **Payslips table empty** - No automatic payslip generation when payroll records are created
2. **Employee Portal shows no data** - RLS policies and employee-user linkage issues

---

## Solution: Execute These Migrations

### Step 1: Apply RLS Policy Fix

**File:** `sql/003_fix_employee_rls.sql`

This migration:

- Fixes the RLS policy to allow employees to view their own payroll records
- Links test employees (EMP004-EMP009) to their corresponding user accounts

**Execute in Supabase SQL Editor:**

1. Go to Supabase dashboard → SQL Editor
2. Click "New Query"
3. Copy and paste the entire contents of `sql/003_fix_employee_rls.sql`
4. Click "Run"

---

### Step 2: Add Automatic Payslip Generation

**File:** `sql/004_payslip_generation.sql`

This migration:

- Creates a PostgreSQL trigger to auto-generate payslips when payroll records are saved
- Generates payslips for existing payroll records
- Sets up RLS policies for the payslips table

**Execute in Supabase SQL Editor:**

1. Go to Supabase dashboard → SQL Editor
2. Click "New Query"
3. Copy and paste the entire contents of `sql/004_payslip_generation.sql`
4. Click "Run"

---

## Critical: Employee-User Linkage

For employees to see their payroll data, their **employee record must have a user_id** that matches their authenticated user account.

### How Employee Records Get user_id:

When you add an employee and link them to a user account in your frontend:

```typescript
// When creating/linking an employee
const { error } = await supabase
  .from("employees")
  .update({ user_id: currentAuthUser.id }) // ← This is critical
  .eq("id", employeeId);
```

### Verify Employee-User Linkage:

Check in Supabase if employee records have user_id values:

**Query (in Supabase SQL Editor):**

```sql
SELECT
  e.employee_id,
  e.first_name,
  e.last_name,
  e.user_id,
  u.email
FROM employees e
LEFT JOIN users u ON e.user_id = u.id
ORDER BY e.created_at DESC;
```

If `user_id` is NULL for an employee, they won't be able to access their payroll data.

---

## After Migrations: Testing

### Test 1: Login as Employee

1. Log in with an employee account (e.g., alice@company.com)
2. Navigate to Employee Portal
3. Check browser console (F12) for debug messages:
   - "Resolved employee..." messages
   - "Found X payroll records..."
   - Any permission errors

### Test 2: Check Payslips

1. In Supabase, query payslips table:

```sql
SELECT * FROM payslips ORDER BY generated_at DESC LIMIT 10;
```

Should see newly generated payslips after Step 2.

### Test 3: Check RLS Permissions

Query payroll_records as an employee user to verify RLS is working:

```sql
-- In Supabase, use "Connect as" to switch to employee user
SELECT pr.id, pr.gross_pay, pr.net_pay
FROM payroll_records pr
WHERE EXISTS (
  SELECT 1 FROM employees e
  WHERE e.id = pr.employee_id
  AND e.user_id = auth.uid()
);
```

Should return the employee's payroll records.

---

## If Payroll Still Doesn't Show

### Debug Checklist:

- [ ] Migration 003 executed successfully (check for any SQL errors)
- [ ] Migration 004 executed successfully (check for trigger creation)
- [ ] Employee record has a `user_id` matching the logged-in user
- [ ] Payroll records exist in the database
- [ ] Browser console shows "Found X payroll records..." message (not empty result)
- [ ] No RLS permission errors in browser console

### Common Issues:

**Issue: "No payroll records found"**

- Cause: Employee record doesn't have user_id set or it doesn't match the auth user
- Fix: Update employees table with correct user_id values

**Issue: "Error fetching payroll records" with permission denied**

- Cause: RLS policy not applied or migration 003 didn't run
- Fix: Re-run migration 003

**Issue: Payslips still empty**

- Cause: Migration 004 not applied or trigger didn't fire
- Fix: Re-run migration 004 and create a new payroll record

---

## Code Changes Made

### EmployeePortal.tsx

- Fixed to use correct pay period dates from database
- Added comprehensive error logging to browser console

### db.ts - listEmployeePayrollEntries()

- Now fetches payroll data with proper error handling
- Logs employee resolution, record counts, and mapping progress
- Separated queries for better reliability

### Database Schema Updates

- **003_fix_employee_rls.sql**: Improved RLS policies + employee-user linking
- **004_payslip_generation.sql**: Trigger-based payslip generation + RLS for payslips table

---

## Next Steps

After applying migrations:

1. **Refresh the app** - Clear browser cache or do a hard refresh (Ctrl+Shift+R)
2. **Test login** - Log in as an employee account
3. **Check Employee Portal** - Should now show payroll history and net pay
4. **Check browser console** - Look for debug messages confirming data fetch
5. **Verify payslips** - Query database to confirm payslips were generated

If issues persist, check browser console for the detailed debug messages that show exactly where the problem is.
