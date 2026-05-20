# Row-Level Security (RLS) Policy Fix

## Problem

The application is throwing a 403 Forbidden error when trying to save payroll records:

```
new row violates row-level security policy for table "payslips"
```

This occurs because the `payroll_records`, `payslips`, and related tables have Row-Level Security (RLS) **enabled but have NO policies defined** to allow authenticated users to perform operations.

## Solution

### Option 1: Use Supabase Dashboard (Recommended for one-time setup)

1. Go to your Supabase project: https://app.supabase.com/project/lrytuvjouolizcgknqpd
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/003_add_rls_policies.sql`
5. Paste it into the SQL editor
6. Click **Run** button (or press `Cmd+Enter` / `Ctrl+Enter`)
7. Verify the output shows no errors

### Option 2: Use Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push
```

This will apply all pending migrations from the `supabase/migrations/` directory.

### Option 3: Use Service Role Key (Programmatic)

If you want to apply the migration programmatically:

1. Get your **Service Role Key** from:
   - Supabase Dashboard → Settings → API
   - Copy the `service_role` secret (NOT the anon key)

2. Run the migration script:

```bash
node apply-rls-migration.js YOUR_SERVICE_ROLE_KEY
```

## What's Fixed

The migration adds RLS policies to allow authenticated users to:

### Payroll Records Table

- ✅ Read all payroll records
- ✅ Insert new payroll records
- ✅ Update payroll records

### Payslips Table

- ✅ Read payslips
- ✅ Insert payslips
- ✅ Update payslips

### Additional Tables (for future use)

- ✅ Deductions
- ✅ Tax Forms
- ✅ Users
- ✅ Departments
- ✅ Audit Logs

## Why This Happened

The PostgreSQL schema defines these tables with RLS enabled (a security best practice), but the migration file that creates them was missing the corresponding **policies** that define who can do what.

The policies now in place allow any **authenticated user** to perform these operations. In a production environment, you may want to restrict these further based on user roles or departments.

## Testing

After applying the migration:

1. Try saving a payroll run in the application
2. Check the browser console for errors
3. The payroll should save successfully without 403 Forbidden errors

## Rollback (if needed)

To remove these policies:

```sql
DROP POLICY IF EXISTS "Payroll Records: Authenticated users can read" ON payroll_records;
DROP POLICY IF EXISTS "Payroll Records: Authenticated users can insert" ON payroll_records;
DROP POLICY IF EXISTS "Payroll Records: Authenticated users can update" ON payroll_records;
-- ... and similar for other tables
```

## Security Notes

- These policies allow ALL authenticated users to perform operations
- In production, consider restricting by role or user ID
- The policies use `auth.role() = 'authenticated_user'` which applies to any user with a valid JWT
- Consider implementing department-level access control if different teams need different visibility
