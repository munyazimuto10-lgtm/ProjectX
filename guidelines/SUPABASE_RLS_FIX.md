# Supabase RLS Policy Fix

## The Issue

You're seeing this error in the browser console:

```
POST https://lrytuvjouolizcgknqpd.supabase.co/rest/v1/payroll_records... 403 (Forbidden)
Payroll save failed: {code: '42501', message: 'new row violates row-level security policy for table "payslips"'}
```

**Root Cause**: The `payroll_records` and `payslips` tables have Row-Level Security (RLS) enabled but no policies defined to allow authenticated users to perform insert/read/update operations.

## The Fix

I've created a migration file that adds the necessary RLS policies:

- **File**: `supabase/migrations/003_add_rls_policies.sql`

This migration adds read/write/update policies for all affected tables.

## How to Apply the Fix

### Method 1: Supabase Dashboard (Easiest - No CLI needed)

1. Open your Supabase Dashboard: https://app.supabase.com/project/lrytuvjouolizcgknqpd
2. Go to **SQL Editor** → **New Query**
3. Open and copy the entire contents of: `supabase/migrations/003_add_rls_policies.sql`
4. Paste into the SQL editor
5. Click **Run** (or press `Ctrl+Enter`)
6. You should see success ✅ with no errors

### Method 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push
```

This applies all pending migrations from `supabase/migrations/`.

### Method 3: Programmatic (requires service role key)

#### Using Node.js:

```bash
node apply-rls-migration.js YOUR_SERVICE_ROLE_KEY
```

#### Using Python:

```bash
python3 apply_rls_migration.py YOUR_SERVICE_ROLE_KEY
```

**To get your Service Role Key:**

1. Go to Supabase Dashboard → **Settings** → **API**
2. Under "Service Role Key" section, copy the key
3. ⚠️ **Keep this secret!** Never commit it to git

## After Applying the Fix

1. Refresh the application (Ctrl+F5 or Cmd+Shift+R)
2. Try saving payroll again
3. The save should succeed without 403 errors

## What Was Added

The migration adds policies to allow authenticated users (anyone logged in) to:

| Table           | SELECT | INSERT | UPDATE            |
| --------------- | ------ | ------ | ----------------- |
| payroll_records | ✅     | ✅     | ✅                |
| payslips        | ✅     | ✅     | ✅                |
| deductions      | ✅     | ✅     | ✅                |
| tax_forms       | ✅     | ✅     | ✅                |
| users           | ✅     | -      | User's own record |
| departments     | ✅     | ✅     | ✅                |
| audit_logs      | ✅     | ✅     | ✅                |

## Security Note

These policies are permissive to allow the app to function. In production, you may want to:

- Restrict by user role (e.g., only HR can see/modify payroll)
- Restrict by department (employees can only see their own data)
- Add additional authorization checks

For example, to restrict payroll records to HR only:

```sql
CREATE POLICY "Payroll Records: HR only"
  ON payroll_records FOR SELECT
  USING (auth.jwt() ->> 'user_role' = 'hr');
```

## Troubleshooting

### Still getting 403 errors after applying the fix?

1. **Refresh the page** (Ctrl+F5 or Cmd+Shift+R) to clear browser cache
2. **Check browser console** for the full error message
3. **Verify the migration ran** by going to Supabase Dashboard → SQL Editor and running:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'payroll_records';
   ```
   You should see rows for the payroll_records policies.

### Migration syntax error?

If you get a SQL syntax error:

1. Copy the SQL file directly from the dashboard, don't use editor autocomplete
2. Make sure you're pasting the ENTIRE file contents
3. Check that the file wasn't corrupted or truncated

## Files Changed

- ✅ Created: `supabase/migrations/003_add_rls_policies.sql` - RLS policy definitions
- ✅ Created: `apply-rls-migration.js` - Node.js helper script
- ✅ Created: `apply_rls_migration.py` - Python helper script
- ✅ Created: `apply-rls-migration.bat` - Windows batch script
- ✅ Created: `RLS_FIX_GUIDE.md` - Detailed technical guide

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
