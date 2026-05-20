#!/usr/bin/env python3
"""
Apply RLS migration to Supabase

Usage:
    python3 apply_rls_migration.py <SERVICE_ROLE_KEY>

Get your service role key from:
    https://app.supabase.com/project/lrytuvjouolizcgknqpd/settings/api
"""

import sys
import json
from pathlib import Path
import subprocess

SUPABASE_URL = "https://lrytuvjouolizcgknqpd.supabase.co"

def apply_migration(service_role_key: str) -> bool:
    """Apply the RLS migration to Supabase"""
    
    # Read the migration SQL
    migration_path = Path(__file__).parent / "supabase" / "migrations" / "003_add_rls_policies.sql"
    
    if not migration_path.exists():
        print(f"❌ Migration file not found: {migration_path}")
        return False
    
    with open(migration_path, 'r') as f:
        sql = f.read()
    
    print("📋 Applying RLS migration...")
    print()
    
    # Prepare the curl command
    headers = {
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
    }
    
    payload = {
        "sql": sql
    }
    
    # Build curl command
    cmd = [
        "curl",
        "-X", "POST",
        f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
    ]
    
    for key, value in headers.items():
        cmd.extend(["-H", f"{key}: {value}"])
    
    cmd.extend([
        "-d", json.dumps(payload)
    ])
    
    # Execute curl
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ RLS policies successfully applied!")
            print()
            print("The following tables now have RLS policies:")
            print("  ✓ payroll_records")
            print("  ✓ deductions")
            print("  ✓ payslips")
            print("  ✓ tax_forms")
            print("  ✓ users")
            print("  ✓ departments")
            print("  ✓ audit_logs")
            return True
        else:
            print(f"❌ Error applying migration")
            print(f"Status: {result.returncode}")
            print(f"Error: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ Error: SERVICE_ROLE_KEY not provided")
        print()
        print("Usage: python3 apply_rls_migration.py <SERVICE_ROLE_KEY>")
        print()
        print("Get your service role key from:")
        print("  https://app.supabase.com/project/lrytuvjouolizcgknqpd/settings/api")
        sys.exit(1)
    
    service_role_key = sys.argv[1]
    success = apply_migration(service_role_key)
    sys.exit(0 if success else 1)
