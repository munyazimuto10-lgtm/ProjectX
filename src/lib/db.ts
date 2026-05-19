// Import the Supabase client instance for database operations
import { supabase } from "./supabase";

// ── Types ────────────────────────────────────────────────────────────────────

// Enumeration of possible employee employment statuses
export type EmployeeStatus = "Active" | "Inactive" | "On Leave";

/** UI-facing employee row (aligned with PayrollPro Postgres schema via mapping). `id` = `employees.employee_id`. */
// Complete employee data structure as returned to the UI
export interface Employee {
  // Unique employee identifier
  id: string;
  // Employee full name
  name: string;
  // Department name
  department: string;
  // Job title/position
  position: string;
  // Current employment status (Active, Inactive, or On Leave)
  status: EmployeeStatus;
  // Email address
  email: string;
  // Phone number
  phone: string;
  // Date when employee joined the company
  joining_date: string;
  /** Approximate hourly rate derived from monthly `base_salary` (no hourly column in DB). */
  // Calculated hourly rate from monthly base salary
  hourly_rate: number;
  /** Sum stored as `employees.base_salary` (components not stored separately in DB unless you add columns). */
  // Total basic monthly compensation (components not separately stored)
  basic_pay: number;
  // Monthly housing allowance
  housing_allowance: number;
  // Monthly transportation allowance
  transport_allowance: number;
  // Monthly medical benefits allowance
  medical_allowance: number;
  // Other miscellaneous allowances
  other_allowances: number;
  // Bank name for salary payment
  bank_name: string;
  // Bank account number
  bank_account_number?: string;
  // Bank routing number
  bank_routing_number?: string;
  // Record creation timestamp
  created_at?: string;
  // Last update timestamp
  updated_at?: string;
  /** Row PK when present (not shown in typical UI lists). */
  // Internal UUID/primary key from database
  internal_uuid?: string;
}

// Tax bracket configuration from the database
export interface TaxBracketRow {
  // Primary key
  id: number;
  // Minimum income threshold for this bracket
  min_income: number;
  // Maximum income threshold (null = no upper limit)
  max_income: number | null;
  // Tax rate percentage for this bracket
  rate: number;
  // Base tax amount for this bracket
  base_amount: number;
  // Sort order for bracket evaluation
  sort_order: number;
}

// Payroll system settings stored in database
export interface PayrollSettingsRow {
  // Primary key
  id: number;
  // Pension contribution rate as percentage
  pension_rate: number;
  // Timestamp of last update
  updated_at: string;
}

// A complete payroll run (all employees processed for a pay period)
export interface PayrollRunRow {
  // Unique run identifier
  id: string;
  // Pay period identifier (e.g., "2026-04-01 - 2026-04-15")
  pay_period: string;
  // Total net pay across all employees in this run
  total_net_pay: number;
  // Number of employees in this payroll run
  employee_count: number;
  // Timestamp when payroll was processed
  processed_at: string;
}

// Individual employee payroll entry for a specific payroll run
export interface PayrollEntryRow {
  // Unique entry identifier
  id: string;
  // Reference to the payroll run this entry belongs to
  payroll_run_id: string;
  // Employee ID this entry is for
  employee_id: string;
  // Employee name (denormalized for readability)
  name: string;
  // Department name (denormalized)
  department: string;
  // Regular hours worked
  hours_worked: number;
  // Overtime hours worked (typically paid at 1.5x rate)
  overtime_hours: number;
  // Paid leave hours taken
  paid_leave_hours: number;
  // Paid leave days taken
  paid_leave_days: number;
  // Base pay calculation (regular + overtime + paid leave)
  base_pay: number;
  // Tax deduction amount
  tax: number;
  // Pension/retirement contribution
  pension: number;
  // Net pay (basePay - tax - pension)
  net_pay: number;
  // Date when payroll was processed
  processed_date: string;
  // Current audit status: pending review, approved, or flagged
  audit_status: "pending" | "approved" | "flagged";
  // Name of auditor who reviewed this entry (if audited)
  auditor: string | null;
  // Date of audit review (if reviewed)
  audit_date: string | null;
  // Audit comments (if flagged)
  audit_comments: string | null;
}

// Notification data from the database
export interface NotificationRow {
  // Primary key
  id: number;
  // Notification title/heading
  title: string;
  // Notification message body
  message: string;
  // Whether notification has been read
  is_read: boolean;
  // Timestamp when notification was created
  created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// Convert ISO timestamp to relative time string (e.g., "5 minutes ago")
export function timeAgo(iso: string): string {
  // Calculate time difference in milliseconds
  const diff = Date.now() - new Date(iso).getTime();
  // Convert to minutes and check if less than an hour
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  // Convert to hours and check if less than a day
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  // Convert to days and return
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

// ── Employees ────────────────────────────────────────────────────────────────

// Approximate monthly hours used for hourly rate calculation
const MONTHLY_HOURS_APPROX = 173.33;

// Check if a string is a valid UUID format
function isUuid(s: string): boolean {
  // Use regex to validate UUID format (8-4-4-4-12 hex digits)
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s.trim(),
  );
}

// Split a full name into first and last name components
function splitFullName(full: string): {
  first_name: string;
  last_name: string;
} {
  // Split name on whitespace and filter empty parts
  const parts = full.trim().split(/\s+/).filter(Boolean);
  // Handle empty name
  if (parts.length === 0) return { first_name: "", last_name: "" };
  // Handle single-word name (first only)
  if (parts.length === 1) return { first_name: parts[0]!, last_name: "" };
  // Return first word as first_name and remaining as last_name
  return { first_name: parts[0]!, last_name: parts.slice(1).join(" ") };
}

// Convert database employment status to UI format
function mapEmploymentDbToUi(s: string): EmployeeStatus {
  // Normalize to lowercase for comparison
  const x = String(s || "").toLowerCase();
  // Map database "on_leave" to UI "On Leave"
  if (x === "on_leave") return "On Leave";
  // Map database "terminated" to UI "Inactive"
  if (x === "terminated") return "Inactive";
  // Default to Active
  return "Active";
}

// Convert UI employment status to database format
function mapEmploymentUiToDb(s: EmployeeStatus): string {
  // Map UI "On Leave" to database "on_leave"
  if (s === "On Leave") return "on_leave";
  // Map UI "Inactive" to database "terminated"
  if (s === "Inactive") return "terminated";
  // Default to "active"
  return "active";
}

function mapRowToEmployee(row: Record<string, unknown>): Employee {
  const first = String(row.first_name ?? "");
  const last = String(row.last_name ?? "");
  const displayName = `${first} ${last}`.trim() || String(row.email ?? "");
  const deptRel = row.departments as { name?: string } | null | undefined;
  const deptName = deptRel?.name ?? "";
  const baseSalary = Number(row.base_salary ?? 0);

  const hireRaw = row.hire_date as string | null | undefined;

  return {
    id: String(row.employee_id ?? row.id ?? ""),
    name: displayName,
    department: deptName,
    position: String(row.position ?? ""),
    status: mapEmploymentDbToUi(String(row.employment_status ?? "active")),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    joining_date: hireRaw ? hireRaw.slice(0, 10) : "",
    hourly_rate: baseSalary > 0 ? baseSalary / MONTHLY_HOURS_APPROX : 0,
    basic_pay: baseSalary,
    housing_allowance: 0,
    transport_allowance: 0,
    medical_allowance: 0,
    other_allowances: 0,
    bank_name: String(row.bank_name ?? ""),
    bank_account_number: String(row.bank_account_number ?? ""),
    bank_routing_number: String(row.bank_routing_number ?? ""),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    ...(row.id ? { internal_uuid: String(row.id) } : {}),
  };
}

async function selectEmployeesJoined(): Promise<Record<string, unknown>[]> {
  const joined = await supabase
    .from("employees")
    .select("*, departments(name)")
    .order("employee_id");
  if (!joined.error && joined.data)
    return joined.data as Record<string, unknown>[];
  const plain = await supabase
    .from("employees")
    .select("*")
    .order("employee_id");
  if (plain.error) throw plain.error;
  return (plain.data ?? []) as Record<string, unknown>[];
}

async function resolveDepartmentId(
  departmentLabel: string,
): Promise<string | null> {
  const n = String(departmentLabel ?? "").trim();
  if (!n) return null;

  if (isUuid(n)) {
    const { data, error } = await supabase
      .from("departments")
      .select("id")
      .eq("id", n)
      .maybeSingle();
    if (error || !data) return null;
    return String(data.id);
  }

  const { data, error } = await supabase
    .from("departments")
    .select("id")
    .eq("name", n)
    .maybeSingle();
  if (error) return null;
  return (data?.id as string | undefined) ?? null;
}

export interface DepartmentRow {
  id: string;
  name: string;
}

async function listDepartments(): Promise<DepartmentRow[]> {
  const { data, error } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
  }));
}

function sumMonthlySalary(p: {
  basic_pay?: number;
  housing_allowance?: number;
  transport_allowance?: number;
  medical_allowance?: number;
  other_allowances?: number;
}): number {
  return (
    Number(p.basic_pay ?? 0) +
    Number(p.housing_allowance ?? 0) +
    Number(p.transport_allowance ?? 0) +
    Number(p.medical_allowance ?? 0) +
    Number(p.other_allowances ?? 0)
  );
}

async function listEmployees(): Promise<Employee[]> {
  const apiBase = String(import.meta.env.VITE_PAYROLL_API_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  if (apiBase) {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.access_token) {
      throw new Error("Sign in required to view employees.");
    }
    const r = await fetch(`${apiBase}/api/employees`, {
      headers: { Authorization: `Bearer ${sess.session.access_token}` },
    });
    const raw = await r.text();
    if (!r.ok) {
      let msg = raw || `${r.status} ${r.statusText}`;
      try {
        const j = raw ? (JSON.parse(raw) as { message?: string }) : {};
        if (j?.message) msg = j.message;
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }
    const rows =
      (raw ? (JSON.parse(raw) as Record<string, unknown>[]) : []) ?? [];
    return rows.map(mapRowToEmployee);
  }

  const rows = await selectEmployeesJoined();
  return rows.map(mapRowToEmployee);
}

async function getEmployeeOneRow(
  filters: Record<string, string>,
): Promise<Employee | null> {
  const joined = await supabase
    .from("employees")
    .select("*, departments(name)")
    .match(filters)
    .maybeSingle();
  if (!joined.error && joined.data)
    return mapRowToEmployee(joined.data as Record<string, unknown>);
  const plain = await supabase
    .from("employees")
    .select("*")
    .match(filters)
    .maybeSingle();
  if (plain.error) throw plain.error;
  if (!plain.data) return null;
  return mapRowToEmployee(plain.data as Record<string, unknown>);
}

async function getEmployeeByIdentifier(
  identifier: string,
): Promise<Employee | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  if (isUuid(trimmed)) {
    const byPk = await getEmployeeOneRow({ id: trimmed });
    if (byPk) return byPk;
  }
  const byCode = await getEmployeeOneRow({ employee_id: trimmed });
  if (byCode) return byCode;
  return getEmployeeOneRow({ email: trimmed });
}

async function insertEmployee(
  emp: Omit<Employee, "created_at" | "updated_at" | "internal_uuid">,
): Promise<Employee> {
  const { first_name, last_name } = splitFullName(emp.name);
  const department_id = await resolveDepartmentId(emp.department);
  const base_salary = sumMonthlySalary(emp);

  const insertPayload: Record<string, unknown> = {
    employee_id: emp.id,
    first_name,
    last_name,
    email: emp.email,
    phone: emp.phone ?? "",
    hire_date: emp.joining_date,
    employment_status: mapEmploymentUiToDb(emp.status),
    position: emp.position,
    department_id,
    base_salary,
    bank_name: emp.bank_name ?? "",
    // Backwards-compat: some UI code may still pass `account_number`.
    bank_account_number:
      emp.bank_account_number ??
      (emp as unknown as { account_number?: string }).account_number ??
      "",
    bank_routing_number: emp.bank_routing_number ?? "",
  };

  let row: Record<string, unknown>;
  const apiBase = String(import.meta.env.VITE_PAYROLL_API_URL ?? "")
    .trim()
    .replace(/\/$/, "");

  if (apiBase) {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.access_token) {
      throw new Error("Sign in required to add employees.");
    }
    const r = await fetch(`${apiBase}/api/employees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sess.session.access_token}`,
      },
      body: JSON.stringify(insertPayload),
    });
    const raw = await r.text();
    let parsed: { message?: string } | Record<string, unknown> = {};
    try {
      parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    } catch {
      /* ignore */
    }
    if (!r.ok) {
      const apiMsg =
        typeof parsed === "object" && parsed && "message" in parsed
          ? String((parsed as { message: unknown }).message)
          : raw || `${r.status} ${r.statusText}`;
      // If the custom backend is misconfigured, fall back to direct Supabase insert.
      const fallback = await supabase
        .from("employees")
        .insert(insertPayload)
        .select("*")
        .single();
      if (!fallback.error && fallback.data) {
        row = fallback.data as Record<string, unknown>;
      } else {
        const fbMsg =
          fallback.error?.message ??
          "Supabase fallback failed after custom API error.";
        throw new Error(
          `Custom API failed (${apiMsg}); Supabase fallback also failed: ${fbMsg}`,
        );
      }
    } else {
      row = parsed as Record<string, unknown>;
    }
  } else {
    const ins = await supabase
      .from("employees")
      .insert(insertPayload)
      .select("*")
      .single();
    if (ins.error) throw ins.error;
    row = ins.data as Record<string, unknown>;
  }
  if (row.department_id) {
    const again = await supabase
      .from("employees")
      .select("*, departments(name)")
      .eq("id", row.id)
      .maybeSingle();
    if (!again.error && again.data) row = again.data as Record<string, unknown>;
  }
  return mapRowToEmployee(row);
}

async function updateEmployee(
  employeeRef: string,
  patch: Partial<
    Omit<Employee, "id" | "created_at" | "updated_at" | "internal_uuid">
  >,
): Promise<void> {
  const dbPatch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.name !== undefined) {
    const { first_name, last_name } = splitFullName(patch.name);
    dbPatch.first_name = first_name;
    dbPatch.last_name = last_name;
  }
  if (patch.email !== undefined) dbPatch.email = patch.email;
  if (patch.phone !== undefined) dbPatch.phone = patch.phone;
  if (patch.position !== undefined) dbPatch.position = patch.position;
  if (patch.joining_date !== undefined) dbPatch.hire_date = patch.joining_date;
  if (patch.status !== undefined)
    dbPatch.employment_status = mapEmploymentUiToDb(patch.status);

  if (patch.department !== undefined) {
    dbPatch.department_id = await resolveDepartmentId(patch.department);
  }

  if (
    patch.basic_pay !== undefined ||
    patch.housing_allowance !== undefined ||
    patch.transport_allowance !== undefined ||
    patch.medical_allowance !== undefined ||
    patch.other_allowances !== undefined
  ) {
    dbPatch.base_salary = sumMonthlySalary(patch);
  }

  if (patch.bank_name !== undefined) dbPatch.bank_name = patch.bank_name;
  if (patch.bank_account_number !== undefined)
    dbPatch.bank_account_number = patch.bank_account_number;
  if (
    (patch as unknown as { account_number?: string }).account_number !==
      undefined &&
    dbPatch.bank_account_number === undefined
  ) {
    dbPatch.bank_account_number = (
      patch as unknown as { account_number?: string }
    ).account_number;
  }
  if (patch.bank_routing_number !== undefined)
    dbPatch.bank_routing_number = patch.bank_routing_number;

  const apiBase = String(import.meta.env.VITE_PAYROLL_API_URL ?? "")
    .trim()
    .replace(/\/$/, "");

  if (apiBase) {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.access_token) {
      throw new Error("Sign in required to update employees.");
    }
    const url = `${apiBase}/api/employees/${encodeURIComponent(employeeRef)}`;
    const r = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sess.session.access_token}`,
      },
      body: JSON.stringify(dbPatch),
    });
    const raw = await r.text();
    let parsed: { message?: string } = {};
    try {
      parsed = raw ? (JSON.parse(raw) as { message?: string }) : {};
    } catch {
      /* ignore */
    }
    if (!r.ok) {
      const msg = parsed.message ?? (raw || `${r.status} ${r.statusText}`);
      throw new Error(msg);
    }
    return;
  }

  const col = isUuid(employeeRef) ? "id" : "employee_id";
  const { error } = await supabase
    .from("employees")
    .update(dbPatch)
    .eq(col, employeeRef);
  if (error) throw error;
}

async function nextEmployeeId(): Promise<string> {
  const apiBase = String(import.meta.env.VITE_PAYROLL_API_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  if (apiBase) {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.access_token) {
      throw new Error("Sign in required to add employees.");
    }
    const r = await fetch(`${apiBase}/api/employees/next-id`, {
      headers: { Authorization: `Bearer ${sess.session.access_token}` },
    });
    const raw = await r.text();
    if (!r.ok) {
      let msg = raw || `${r.status} ${r.statusText}`;
      try {
        const j = raw ? (JSON.parse(raw) as { message?: string }) : {};
        if (j?.message) msg = j.message;
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }
    const parsed = raw ? (JSON.parse(raw) as { employee_id?: string }) : {};
    const id = String(parsed.employee_id ?? "").trim();
    if (!id) throw new Error("Backend did not return next employee id.");
    return id;
  }

  const { data } = await supabase
    .from("employees")
    .select("employee_id")
    .limit(500);
  let max = 0;
  for (const row of data ?? []) {
    const code = String((row as { employee_id?: string }).employee_id ?? "");
    const m = /^EMP(\d+)$/i.exec(code);
    if (m) {
      max = Math.max(max, parseInt(m[1]!, 10));
      continue;
    }
    const digits = code.replace(/\D/g, "");
    if (digits)
      max = Math.max(
        parseInt(digits.slice(-6), 10) || parseInt(digits, 10),
        max,
      );
  }
  return `EMP${String(max + 1).padStart(3, "0")}`;
}

async function deleteEmployee(employeeRef: string): Promise<void> {
  const apiBase = String(import.meta.env.VITE_PAYROLL_API_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  if (apiBase) {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.access_token) {
      throw new Error("Sign in required to delete employees.");
    }
    const r = await fetch(
      `${apiBase}/api/employees/${encodeURIComponent(employeeRef)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sess.session.access_token}` },
      },
    );
    if (r.status === 204) return;
    const raw = await r.text();
    let msg = raw || `${r.status} ${r.statusText}`;
    try {
      const j = raw ? (JSON.parse(raw) as { message?: string }) : {};
      if (j?.message) msg = j.message;
    } catch {
      /* ignore */
    }
    if (!r.ok) throw new Error(msg);
    return;
  }

  const col = isUuid(employeeRef) ? "id" : "employee_id";
  const { error } = await supabase
    .from("employees")
    .delete()
    .eq(col, employeeRef);
  if (error) throw error;
}

// ── Payroll Settings ─────────────────────────────────────────────────────────

async function getPayrollSettings(): Promise<{
  pensionRate: number;
  taxBrackets: TaxBracketRow[];
}> {
  // In this schema `payroll_settings` stores settings as rows keyed by `setting_key`
  // and `setting_value` is a JSONB payload. Tax brackets are stored as a JSON
  // under key `tax_brackets`, pension rate under `pension_rate`.
  const { data: allSettings } = await supabase
    .from("payroll_settings")
    .select("setting_key, setting_value");

  let pensionRate = 6;
  let taxBrackets: TaxBracketRow[] = [];

  for (const s of (allSettings ?? []) as {
    setting_key?: string;
    setting_value?: any;
  }[]) {
    if (!s || !s.setting_key) continue;
    if (s.setting_key === "pension_rate") {
      const v = s.setting_value;
      pensionRate =
        typeof v === "number" ? v : Number(v ?? pensionRate) || pensionRate;
    }
    if (s.setting_key === "tax_brackets") {
      const v = s.setting_value ?? [];
      if (Array.isArray(v)) {
        taxBrackets = v.map((b: any, i: number) => ({
          id: Number(b.id ?? i + 1),
          min_income: Number(b.minIncome ?? b.min_income ?? 0),
          max_income: b.maxIncome ?? b.max_income ?? null,
          rate: Number(b.rate ?? 0),
          base_amount: Number(b.baseAmount ?? b.base_amount ?? 0),
          sort_order: Number(b.sort_order ?? i + 1),
        }));
      }
    }
  }

  return { pensionRate, taxBrackets };
}

async function resolveAppUserId(
  authUserId: string | null | undefined,
): Promise<string | null> {
  if (!authUserId) return null;
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("id", authUserId)
    .maybeSingle();
  if (error || !data) return null;
  return String(data.id);
}

async function savePayrollSettings(
  pensionRate: number,
  taxBrackets: Pick<
    TaxBracketRow,
    "min_income" | "max_income" | "rate" | "base_amount"
  >[],
): Promise<void> {
  // Get current user ID for audit tracking, but only use it if a matching app user exists.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = await resolveAppUserId(user?.id);

  // Upsert pension_rate as a setting row
  const pensionPayload: Record<string, unknown> = {
    setting_key: "pension_rate",
    setting_value: pensionRate,
    updated_at: new Date().toISOString(),
  };
  if (userId) pensionPayload.updated_by = userId;

  const { error: err1 } = await supabase
    .from("payroll_settings")
    .upsert(pensionPayload, { onConflict: "setting_key" });
  if (err1) throw err1;

  // Save tax brackets as a single JSON blob under key `tax_brackets`
  const taxPayload: Record<string, unknown> = {
    setting_key: "tax_brackets",
    setting_value: taxBrackets.map((b, i) => ({
      minIncome: b.min_income,
      maxIncome: b.max_income,
      rate: b.rate,
      baseAmount: b.base_amount,
      sort_order: i + 1,
    })),
    updated_at: new Date().toISOString(),
  };
  if (userId) taxPayload.updated_by = userId;

  const { error: err2 } = await supabase
    .from("payroll_settings")
    .upsert(taxPayload, { onConflict: "setting_key" });
  if (err2) throw err2;
}

// ── Payroll Runs & Entries ───────────────────────────────────────────────────

interface SavePayrollEntryInput {
  employee_id: string;
  name: string;
  department: string;
  hours_worked: number;
  overtime_hours: number;
  paid_leave_hours: number;
  paid_leave_days: number;
  base_pay: number;
  tax: number;
  pension: number;
  net_pay: number;
}

async function savePayrollRun(
  payPeriod: string,
  entries: SavePayrollEntryInput[],
): Promise<PayrollRunRow> {
  // The database schema stores individual payroll records in `payroll_records`.
  // We'll insert one payroll_records row per entry and return an aggregate
  // structure that approximates a "run".
  const totalNetPay = entries.reduce((s, e) => s + e.net_pay, 0);
  const processedDate = new Date().toISOString().split("T")[0];

  // Try to parse payPeriod into start/end if possible (format: "YYYY-MM-DD - YYYY-MM-DD")
  let pay_period_start: string | null = null;
  let pay_period_end: string | null = null;
  const m = String(payPeriod || "").match(
    /(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})/,
  );
  if (m) {
    pay_period_start = m[1]!;
    pay_period_end = m[2]!;
  }

  // Ensure defaults (start of current month to today) if parsing failed
  if (!pay_period_start || !pay_period_end) {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const end = now.getDate() === last.getDate() ? last : now;
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    pay_period_start = fmt(first);
    pay_period_end = fmt(end);
  }

  // Resolve employee identifier to DB PK when possible
  async function resolveEmployeePk(identifier: string): Promise<string | null> {
    const t = identifier.trim();
    if (!t) return null;
    if (isUuid(t)) return t;
    const { data, error } = await supabase
      .from("employees")
      .select("id")
      .eq("employee_id", t)
      .maybeSingle();
    if (error || !data) return null;
    return data.id as string;
  }

  // Resolve session user to set `processed_by` when available
  const { data: sess } = await supabase.auth.getSession();
  const rawUserId = sess.session?.user?.id ?? null;
  const processed_by = await resolveAppUserId(rawUserId);

  // Build batch rows for insertion
  const rowsToInsert: Record<string, unknown>[] = [];
  for (const e of entries) {
    const employee_pk = (await resolveEmployeePk(e.employee_id)) ?? null;
    rowsToInsert.push({
      employee_id: employee_pk,
      pay_period_start: pay_period_start,
      pay_period_end: pay_period_end,
      payment_date: processedDate,
      gross_pay: e.base_pay,
      net_pay: e.net_pay,
      total_deductions: e.pension ?? 0,
      total_taxes: e.tax ?? 0,
      pension_contribution: e.pension ?? 0,
      overtime_hours: e.overtime_hours ?? 0,
      overtime_pay: 0,
      bonus: 0,
      commission: 0,
      status: "pending",
      notes: null,
      processed_by,
      created_by: processed_by,
      updated_by: processed_by,
      processed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  if (rowsToInsert.length > 0) {
    const ins = await supabase.from("payroll_records").insert(rowsToInsert);
    // Log insertion result to help debug permissions/RLS issues in browser console
    // eslint-disable-next-line no-console
    console.debug("payroll_records.insert result:", ins);
    if (ins.error) throw ins.error;

    // Supabase may not return row data depending on the PostgREST return settings.
    // If the insert succeeded, treat the operation as successful even when no rows are returned.
    const insertedRows = ins.data as unknown[] | null;
    if (insertedRows && Array.isArray(insertedRows)) {
      const insertedCount = insertedRows.length;
      if (insertedCount !== rowsToInsert.length) {
        throw new Error(
          `Inserted ${insertedCount} of ${rowsToInsert.length} payroll records`,
        );
      }
    }
  }

  // Return an aggregate object representing the run
  return {
    id: `${processedDate}:${Math.random().toString(36).slice(2, 8)}`,
    pay_period: payPeriod,
    total_net_pay: totalNetPay,
    employee_count: entries.length,
    processed_at: new Date().toISOString(),
  } as unknown as PayrollRunRow;
}

async function listEmployeePayrollEntries(
  employeeId: string,
): Promise<PayrollEntryRow[]> {
  // Resolve employee PK if a non-UUID identifier was provided
  let empPk = employeeId;
  if (!isUuid(empPk)) {
    const { data } = await supabase
      .from("employees")
      .select("id")
      .eq("employee_id", empPk)
      .maybeSingle();
    if (data && (data as any).id) empPk = (data as any).id as string;
  }

  const { data, error } = await supabase
    .from("payroll_records")
    .select("*, employees(first_name, last_name, employee_id)")
    .eq("employee_id", empPk)
    .order("payment_date", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((r: any) => {
    return {
      id: r.id,
      payroll_run_id: null as any,
      employee_id: String(r.employee_id ?? ""),
      name: r.employees
        ? `${r.employees.first_name} ${r.employees.last_name}`.trim()
        : "",
      department: "",
      hours_worked: 0,
      overtime_hours: Number(r.overtime_hours ?? 0),
      paid_leave_hours: 0,
      paid_leave_days: 0,
      base_pay: Number(r.gross_pay ?? 0),
      tax: Number(r.total_taxes ?? 0),
      pension: Number(r.pension_contribution ?? 0),
      net_pay: Number(r.net_pay ?? 0),
      processed_date: String(r.payment_date ?? r.processed_at ?? ""),
      audit_status: "pending",
      auditor: null,
      audit_date: null,
      audit_comments: null,
    } as PayrollEntryRow;
  });
}

async function getLatestPayrollRun(): Promise<PayrollRunRow | null> {
  const apiBase = String(import.meta.env.VITE_PAYROLL_API_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  if (apiBase) {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.access_token) return null;
    const r = await fetch(`${apiBase}/api/payroll/latest-run`, {
      headers: { Authorization: `Bearer ${sess.session.access_token}` },
    });
    if (!r.ok) throw new Error(await r.text());
    const raw = await r.text();
    return raw ? (JSON.parse(raw) as PayrollRunRow | null) : null;
  }
  // Use latest payment_date from payroll_records as the latest run indicator
  const { data } = await supabase
    .from("payroll_records")
    .select("payment_date, gross_pay, net_pay")
    .order("payment_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    id: String(data.payment_date ?? ""),
    pay_period: String(data.payment_date ?? ""),
    total_net_pay: Number(data.net_pay ?? 0),
    employee_count: 0,
    processed_at: String(data.payment_date ?? ""),
  } as PayrollRunRow;
}

async function countPendingAudits(): Promise<number> {
  const apiBase = String(import.meta.env.VITE_PAYROLL_API_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  if (apiBase) {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.access_token) return 0;
    const r = await fetch(`${apiBase}/api/payroll/pending-audits-count`, {
      headers: { Authorization: `Bearer ${sess.session.access_token}` },
    });
    const raw = await r.text();
    if (!r.ok) throw new Error(raw);
    const parsed = raw ? (JSON.parse(raw) as { count?: number }) : {};
    return Number(parsed.count ?? 0);
  }
  // Count pending audit log entries related to payroll_records
  const { count, error } = await supabase
    .from("audit_logs")
    .select("id", { count: "exact", head: true })
    .eq("entity_type", "payroll_record")
    .eq("status", "pending");
  if (error) throw error;
  return count ?? 0;
}

async function getPayrollTrends(): Promise<
  { month: string; amount: number }[]
> {
  const apiBase = String(import.meta.env.VITE_PAYROLL_API_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  if (apiBase) {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.access_token) return [];
    const r = await fetch(`${apiBase}/api/payroll/trends`, {
      headers: { Authorization: `Bearer ${sess.session.access_token}` },
    });
    const raw = await r.text();
    if (!r.ok) throw new Error(raw);
    return raw ? (JSON.parse(raw) as { month: string; amount: number }[]) : [];
  }
  // Use the payroll_summary view (or aggregate payroll_records) for month totals
  const { data } = await supabase
    .from("payroll_summary")
    .select("payment_month, total_net_pay")
    .order("payment_month", { ascending: true })
    .limit(12);
  return (data ?? []).map((r: any) => ({
    month: new Date(r.payment_month as string).toLocaleString("default", {
      month: "short",
    }),
    amount: Number(r.total_net_pay ?? 0),
  }));
}

async function getDepartmentPayroll(): Promise<
  { department: string; amount: number }[]
> {
  const apiBase = String(import.meta.env.VITE_PAYROLL_API_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  if (apiBase) {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.access_token) return [];
    const r = await fetch(`${apiBase}/api/payroll/department-payroll`, {
      headers: { Authorization: `Bearer ${sess.session.access_token}` },
    });
    const raw = await r.text();
    if (!r.ok) throw new Error(raw);
    return raw
      ? (JSON.parse(raw) as { department: string; amount: number }[])
      : [];
  }
  // Use the department_payroll view which aggregates by current month
  const { data } = await supabase
    .from("department_payroll")
    .select("department_name, total_gross_pay, total_net_pay");
  if (!data) return [];
  return (data ?? []).map((r: any) => ({
    department: r.department_name,
    amount: Number(r.total_net_pay ?? r.total_gross_pay ?? 0),
  }));
}

async function getYtdPayroll(
  year: string,
): Promise<{ month: string; payroll: number; employees: number }[]> {
  // Aggregate payroll_records by month for the given year
  const from = `${year}-01-01`;
  const to = `${year}-12-31 23:59:59`;
  const { data } = await supabase
    .from("payroll_records")
    .select("payment_date, net_pay, employee_id")
    .gte("payment_date", from)
    .lte("payment_date", to)
    .order("payment_date");

  const map: Record<string, { payroll: number; employeesSet: Set<string> }> =
    {};
  for (const r of (data ?? []) as any[]) {
    const month = new Date(r.payment_date).toLocaleString("default", {
      month: "short",
    });
    if (!map[month]) map[month] = { payroll: 0, employeesSet: new Set() };
    map[month].payroll += Number(r.net_pay ?? 0);
    if (r.employee_id) map[month].employeesSet.add(String(r.employee_id));
  }
  return Object.entries(map).map(([month, v]) => ({
    month,
    payroll: v.payroll,
    employees: v.employeesSet.size,
  }));
}

async function getDepartmentStats(): Promise<
  { department: string; totalSalary: number; employees: number }[]
> {
  // Use department_payroll view for department statistics
  const { data } = await supabase
    .from("department_payroll")
    .select(
      "department_name, employee_count, total_base_salary, total_gross_pay, total_net_pay",
    );
  if (!data) return [];
  return (data ?? []).map((r: any) => ({
    department: r.department_name,
    totalSalary: Number(
      r.total_net_pay ?? r.total_gross_pay ?? r.total_base_salary ?? 0,
    ),
    employees: Number(r.employee_count ?? 0),
  }));
}

// ── Audit Queue ──────────────────────────────────────────────────────────────

async function listAuditEntries(): Promise<PayrollEntryRow[]> {
  // Fetch audit log entries related to payroll_records and include the related
  // payroll_record where possible to surface entries to auditors.
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*, entity_id, old_values, new_values")
    .eq("entity_type", "payroll_record")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const out: PayrollEntryRow[] = [];
  for (const a of (data ?? []) as any[]) {
    // Try to load the payroll_record referenced
    const pr = a.entity_id
      ? await supabase
          .from("payroll_records")
          .select("*")
          .eq("id", a.entity_id)
          .maybeSingle()
      : null;
    const r = pr && !pr.error ? pr.data : null;
    out.push({
      id: a.entity_id ?? String(a.id),
      payroll_run_id: null as any,
      employee_id: r ? String(r.employee_id ?? "") : "",
      name: "",
      department: "",
      hours_worked: 0,
      overtime_hours: r ? Number(r.overtime_hours ?? 0) : 0,
      paid_leave_hours: 0,
      paid_leave_days: 0,
      base_pay: r ? Number(r.gross_pay ?? 0) : 0,
      tax: r ? Number(r.total_taxes ?? 0) : 0,
      pension: r ? Number(r.pension_contribution ?? 0) : 0,
      net_pay: r ? Number(r.net_pay ?? 0) : 0,
      processed_date: r
        ? String(r.payment_date ?? r.processed_at ?? "")
        : String(a.created_at ?? ""),
      audit_status:
        (a.status as "pending" | "approved" | "flagged") ?? "pending",
      auditor: null,
      audit_date: a.reviewed_at ?? null,
      audit_comments: a.review_notes ?? null,
    });
  }
  return out;
}

async function approveEntry(id: string, auditor: string): Promise<void> {
  // Update or insert an audit_logs row to mark reviewed/approved
  const { data } = await supabase
    .from("audit_logs")
    .select("id")
    .eq("entity_type", "payroll_record")
    .eq("entity_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data && (data as any).id) {
    await supabase
      .from("audit_logs")
      .update({
        status: "approved",
        reviewed_by: null,
        reviewed_at: new Date().toISOString(),
        review_notes: `Approved by ${auditor}`,
      })
      .eq("id", (data as any).id);
    return;
  }
  await supabase.from("audit_logs").insert({
    entity_type: "payroll_record",
    entity_id: id,
    action: "approve",
    status: "approved",
    review_notes: `Approved by ${auditor}`,
    reviewed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });
}

async function flagEntry(
  id: string,
  auditor: string,
  comments: string,
): Promise<void> {
  const { data } = await supabase
    .from("audit_logs")
    .select("id")
    .eq("entity_type", "payroll_record")
    .eq("entity_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data && (data as any).id) {
    await supabase
      .from("audit_logs")
      .update({
        status: "rejected",
        reviewed_by: null,
        reviewed_at: new Date().toISOString(),
        review_notes: comments,
      })
      .eq("id", (data as any).id);
    return;
  }
  await supabase.from("audit_logs").insert({
    entity_type: "payroll_record",
    entity_id: id,
    action: "flag",
    status: "rejected",
    review_notes: comments,
    reviewed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });
}

// ── Notifications ────────────────────────────────────────────────────────────

async function listNotifications(): Promise<NotificationRow[]> {
  const apiBase = String(import.meta.env.VITE_PAYROLL_API_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  if (apiBase) {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.access_token) return [];
    const r = await fetch(`${apiBase}/api/notifications`, {
      headers: { Authorization: `Bearer ${sess.session.access_token}` },
    });
    const raw = await r.text();
    if (!r.ok) throw new Error(raw);
    return raw ? (JSON.parse(raw) as NotificationRow[]) : [];
  }
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as NotificationRow[];
}

async function addNotification(
  title: string,
  message: string,
): Promise<NotificationRow> {
  // Get current user ID for the notification, but only use it if the user row exists.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = await resolveAppUserId(user?.id);

  const insertPayload: Record<string, unknown> = {
    title,
    message,
    type: "info",
  };
  if (userId) insertPayload.user_id = userId;

  const { data, error } = await supabase
    .from("notifications")
    .insert(insertPayload);

  // If the database insert succeeds without returning a row, return a local placeholder.
  if (error) throw error;
  return {
    id: Date.now(),
    title,
    message,
    is_read: false,
    created_at: new Date().toISOString(),
  } as NotificationRow;
}

async function markNotificationRead(id: number): Promise<void> {
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);
}

async function clearAllNotifications(): Promise<void> {
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false);
}

// ── Recent Activity (dashboard) ──────────────────────────────────────────────

async function getRecentActivity(): Promise<
  { name: string; department: string; action: string; date: string }[]
> {
  const apiBase = String(import.meta.env.VITE_PAYROLL_API_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  if (apiBase) {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.access_token) return [];
    const r = await fetch(`${apiBase}/api/recent-activity`, {
      headers: { Authorization: `Bearer ${sess.session.access_token}` },
    });
    const raw = await r.text();
    if (!r.ok) throw new Error(raw);
    return raw
      ? (JSON.parse(raw) as {
          name: string;
          department: string;
          action: string;
          date: string;
        }[])
      : [];
  }
  const joined = await supabase
    .from("employees")
    .select("first_name, last_name, departments(name), created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(5);

  type Row = {
    first_name?: string | null;
    last_name?: string | null;
    departments?: { name?: string | null } | null;
    created_at?: string;
    updated_at?: string;
  };

  let rows: Row[] = [];

  if (!joined.error && joined.data) {
    rows = joined.data as Row[];
  } else {
    const plain = await supabase
      .from("employees")
      .select("first_name, last_name, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5);
    rows = (plain.data ?? []) as Row[];
  }

  return rows.map((e) => {
    const dept = e.departments?.name;
    return {
      name: `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim() || "Employee",
      department: typeof dept === "string" ? dept : "—",
      action:
        String(e.created_at) === String(e.updated_at) ? "Added" : "Updated",
      date: String(e.updated_at ?? "").split("T")[0] ?? "",
    };
  });
}

// ── Exported db object ───────────────────────────────────────────────────────

// Main database access layer - contains all data operations organized by domain
export const db = {
  // Employee CRUD operations
  employees: {
    // Retrieve all employees from the database
    list: listEmployees,
    // Get a single employee by ID, email, or UUID
    getByIdentifier: getEmployeeByIdentifier,
    // Create a new employee record
    insert: insertEmployee,
    // Modify an existing employee record
    update: updateEmployee,
    // Generate the next sequential employee ID
    nextId: nextEmployeeId,
    // Remove an employee from the database
    delete: deleteEmployee,
  },
  departments: {
    list: listDepartments,
  },
  // Payroll system configuration
  settings: {
    // Retrieve tax brackets and pension rate settings
    get: getPayrollSettings,
    // Update tax brackets and pension rate
    save: savePayrollSettings,
  },
  // Payroll processing and reporting
  payroll: {
    // Process and save a complete payroll run for a pay period
    saveRun: savePayrollRun,
    // Get payroll trends over time (month/amount pairs)
    trends: getPayrollTrends,
    // Get total payroll by department
    departmentPayroll: getDepartmentPayroll,
    // Get year-to-date payroll data for a given year
    ytd: getYtdPayroll,
    // Get department statistics (total salary and employee count)
    departmentStats: getDepartmentStats,
    // Retrieve the most recent payroll run
    latestRun: getLatestPayrollRun,
    // Get all payroll entries for a specific employee
    listEmployeeEntries: listEmployeePayrollEntries,
    // Count how many payroll entries are pending audit
    countPendingAudits,
  },
  // Payroll audit/approval operations
  audit: {
    // Retrieve all payroll entries for audit review
    list: listAuditEntries,
    // Mark a payroll entry as approved by an auditor
    approve: approveEntry,
    // Mark a payroll entry as flagged with audit comments
    flag: flagEntry,
  },
  // Notification management
  notifications: {
    // Retrieve all notifications
    list: listNotifications,
    // Create a new notification
    add: addNotification,
    // Mark a notification as read
    markRead: markNotificationRead,
    // Mark all notifications as read
    clearAll: clearAllNotifications,
  },
  // Get recent employee activity (additions/updates) for the dashboard
  recentActivity: getRecentActivity,
};
