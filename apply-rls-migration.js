#!/usr/bin/env node

/**
 * Apply RLS migration to Supabase
 *
 * Usage:
 *   node apply-rls-migration.js <SERVICE_ROLE_KEY>
 *
 * Get your service role key from:
 *   https://app.supabase.com/project/lrytuvjouolizcgknqpd/settings/api
 */

const fs = require("fs");
const path = require("path");

const supabaseUrl = "https://lrytuvjouolizcgknqpd.supabase.co";
const serviceRoleKey = process.argv[2];

if (!serviceRoleKey) {
  console.error("❌ Error: SERVICE_ROLE_KEY not provided");
  console.error("");
  console.error("Usage: node apply-rls-migration.js <SERVICE_ROLE_KEY>");
  console.error("");
  console.error("Get your service role key from:");
  console.error(
    "  https://app.supabase.com/project/lrytuvjouolizcgknqpd/settings/api",
  );
  process.exit(1);
}

const sql = fs.readFileSync(
  path.join(__dirname, "supabase/migrations/003_add_rls_policies.sql"),
  "utf-8",
);

async function applyMigration() {
  try {
    console.log("📋 Applying RLS migration...");

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    console.log("✅ RLS policies successfully applied!");
    console.log("");
    console.log("The following tables now have RLS policies:");
    console.log("  ✓ payroll_records");
    console.log("  ✓ deductions");
    console.log("  ✓ payslips");
    console.log("  ✓ tax_forms");
    console.log("  ✓ users");
    console.log("  ✓ departments");
    console.log("  ✓ audit_logs");
  } catch (error) {
    console.error("❌ Error applying migration:", error.message);
    process.exit(1);
  }
}

applyMigration();
