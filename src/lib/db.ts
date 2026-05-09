import { supabase } from './supabase';

// ── Types ────────────────────────────────────────────────────────────────────

export type EmployeeStatus = 'Active' | 'Inactive' | 'On Leave';

/** UI-facing employee row (aligned with PayrollPro Postgres schema via mapping). `id` = `employees.employee_id`. */
export interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  status: EmployeeStatus;
  email: string;
  phone: string;
  joining_date: string;
  /** Approximate hourly rate derived from monthly `base_salary` (no hourly column in DB). */
  hourly_rate: number;
  /** Sum stored as `employees.base_salary` (components not stored separately in DB unless you add columns). */
  basic_pay: number;
  housing_allowance: number;
  transport_allowance: number;
  medical_allowance: number;
  other_allowances: number;
  bank_name: string;
  bank_account_number?: string;
  bank_routing_number?: string;
  account_holder_name?: string;
  created_at?: string;
  updated_at?: string;
  /** Row PK when present (not shown in typical UI lists). */
  internal_uuid?: string;
}

export interface TaxBracketRow {
  id: number;
  min_income: number;
  max_income: number | null;
  rate: number;
  base_amount: number;
  sort_order: number;
}

export interface PayrollSettingsRow {
  id: number;
  pension_rate: number;
  updated_at: string;
}

export interface PayrollRunRow {
  id: string;
  pay_period: string;
  total_net_pay: number;
  employee_count: number;
  processed_at: string;
}

export interface PayrollEntryRow {
  id: string;
  payroll_run_id: string;
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
  processed_date: string;
  audit_status: 'pending' | 'approved' | 'flagged';
  auditor: string | null;
  audit_date: string | null;
  audit_comments: string | null;
}

export interface NotificationRow {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

// ── Employees ────────────────────────────────────────────────────────────────

const MONTHLY_HOURS_APPROX = 173.33;

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s.trim());
}

function splitFullName(full: string): { first_name: string; last_name: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: '', last_name: '' };
  if (parts.length === 1) return { first_name: parts[0]!, last_name: '' };
  return { first_name: parts[0]!, last_name: parts.slice(1).join(' ') };
}

function mapEmploymentDbToUi(s: string): EmployeeStatus {
  const x = String(s || '').toLowerCase();
  if (x === 'on_leave') return 'On Leave';
  if (x === 'terminated') return 'Inactive';
  return 'Active';
}

function mapEmploymentUiToDb(s: EmployeeStatus): string {
  if (s === 'On Leave') return 'on_leave';
  if (s === 'Inactive') return 'terminated';
  return 'active';
}

function mapRowToEmployee(row: Record<string, unknown>): Employee {
  const first = String(row.first_name ?? '');
  const last = String(row.last_name ?? '');
  const displayName = `${first} ${last}`.trim() || String(row.email ?? '');
  const deptRel = row.departments as { name?: string } | null | undefined;
  const deptName = deptRel?.name ?? '';
  const baseSalary = Number(row.base_salary ?? 0);

  const hireRaw = row.hire_date as string | null | undefined;

  return {
    id: String(row.employee_id ?? row.id ?? ''),
    name: displayName,
    department: deptName,
    position: String(row.position ?? ''),
    status: mapEmploymentDbToUi(String(row.employment_status ?? 'active')),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    joining_date: hireRaw ? hireRaw.slice(0, 10) : '',
    hourly_rate: baseSalary > 0 ? baseSalary / MONTHLY_HOURS_APPROX : 0,
    basic_pay: baseSalary,
    housing_allowance: 0,
    transport_allowance: 0,
    medical_allowance: 0,
    other_allowances: 0,
    bank_name: String(row.bank_name ?? ''),
    bank_account_number: String(row.bank_account_number ?? ''),
    bank_routing_number: String(row.bank_routing_number ?? ''),
    account_holder_name: row.account_holder_name != null ? String(row.account_holder_name) : undefined,
    created_at: row.created_at ? String(row.created_at) : undefined,
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
    internal_uuid: row.id ? String(row.id) : undefined,
  };
}

async function selectEmployeesJoined(): Promise<Record<string, unknown>[]> {
  const joined = await supabase.from('employees').select('*, departments(name)').order('employee_id');
  if (!joined.error && joined.data) return joined.data as Record<string, unknown>[];
  const plain = await supabase.from('employees').select('*').order('employee_id');
  if (plain.error) throw plain.error;
  return (plain.data ?? []) as Record<string, unknown>[];
}

async function resolveDepartmentId(departmentLabel: string): Promise<string | null> {
  const n = departmentLabel.trim();
  if (!n) return null;
  const { data, error } = await supabase.from('departments').select('id').eq('name', n).maybeSingle();
  if (error) return null;
  return (data?.id as string | undefined) ?? null;
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
  const apiBase = String(import.meta.env.VITE_PAYROLL_API_URL ?? '').trim().replace(/\/$/, '');
  if (apiBase) {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.access_token) {
      throw new Error('Sign in required to view employees.');
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
    const rows = (raw ? (JSON.parse(raw) as Record<string, unknown>[]) : []) ?? [];
    return rows.map(mapRowToEmployee);
  }

  const rows = await selectEmployeesJoined();
  return rows.map(mapRowToEmployee);
}

async function getEmployeeOneRow(filters: Record<string, string>): Promise<Employee | null> {
  const joined = await supabase.from('employees').select('*, departments(name)').match(filters).maybeSingle();
  if (!joined.error && joined.data) return mapRowToEmployee(joined.data as Record<string, unknown>);
  const plain = await supabase.from('employees').select('*').match(filters).maybeSingle();
  if (plain.error) throw plain.error;
  if (!plain.data) return null;
  return mapRowToEmployee(plain.data as Record<string, unknown>);
}

async function getEmployeeByIdentifier(identifier: string): Promise<Employee | null> {
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

async function insertEmployee(emp: Omit<Employee, 'created_at' | 'updated_at' | 'internal_uuid'> & { account_holder_name?: string }): Promise<Employee> {
  const { first_name, last_name } = splitFullName(emp.name);
  const department_id = await resolveDepartmentId(emp.department);
  const base_salary = sumMonthlySalary(emp);

  const insertPayload: Record<string, unknown> = {
    employee_id: emp.id,
    first_name,
    last_name,
    email: emp.email,
    phone: emp.phone ?? '',
    hire_date: emp.joining_date,
    employment_status: mapEmploymentUiToDb(emp.status),
    position: emp.position,
    department_id,
    base_salary,
    bank_name: emp.bank_name ?? '',
    // Backwards-compat: some UI code may still pass `account_number`.
    bank_account_number: emp.bank_account_number ?? (emp as unknown as { account_number?: string }).account_number ?? '',
    bank_routing_number: emp.bank_routing_number ?? '',
  };
  if (emp.account_holder_name != null && emp.account_holder_name !== '') {
    insertPayload.account_holder_name = emp.account_holder_name;
  }

  let row: Record<string, unknown>;
  const apiBase = String(import.meta.env.VITE_PAYROLL_API_URL ?? '').trim().replace(/\/$/, '');

  if (apiBase) {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.access_token) {
      throw new Error('Sign in required to add employees.');
    }
    const r = await fetch(`${apiBase}/api/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
      const msg = typeof parsed === 'object' && parsed && 'message' in parsed
        ? String((parsed as { message: unknown }).message)
        : raw || `${r.status} ${r.statusText}`;
      throw new Error(msg);
    }
    row = parsed as Record<string, unknown>;
  } else {
    const ins = await supabase.from('employees').insert(insertPayload).select('*').single();
    if (ins.error) throw ins.error;
    row = ins.data as Record<string, unknown>;
  }
  if (row.department_id) {
    const again = await supabase.from('employees').select('*, departments(name)').eq('id', row.id).maybeSingle();
    if (!again.error && again.data) row = again.data as Record<string, unknown>;
  }
  return mapRowToEmployee(row);
}

async function updateEmployee(employeeRef: string, patch: Partial<Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'internal_uuid'>> & { account_holder_name?: string }): Promise<void> {
  const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (patch.name !== undefined) {
    const { first_name, last_name } = splitFullName(patch.name);
    dbPatch.first_name = first_name;
    dbPatch.last_name = last_name;
  }
  if (patch.email !== undefined) dbPatch.email = patch.email;
  if (patch.phone !== undefined) dbPatch.phone = patch.phone;
  if (patch.position !== undefined) dbPatch.position = patch.position;
  if (patch.joining_date !== undefined) dbPatch.hire_date = patch.joining_date;
  if (patch.status !== undefined) dbPatch.employment_status = mapEmploymentUiToDb(patch.status);

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
  if (patch.bank_account_number !== undefined) dbPatch.bank_account_number = patch.bank_account_number;
  if (
    (patch as unknown as { account_number?: string }).account_number !== undefined &&
    dbPatch.bank_account_number === undefined
  ) {
    dbPatch.bank_account_number = (patch as unknown as { account_number?: string }).account_number;
  }
  if (patch.bank_routing_number !== undefined) dbPatch.bank_routing_number = patch.bank_routing_number;
  if (patch.account_holder_name !== undefined) dbPatch.account_holder_name = patch.account_holder_name;

  const apiBase = String(import.meta.env.VITE_PAYROLL_API_URL ?? '').trim().replace(/\/$/, '');

  if (apiBase) {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.access_token) {
      throw new Error('Sign in required to update employees.');
    }
    const url = `${apiBase}/api/employees/${encodeURIComponent(employeeRef)}`;
    const r = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
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

  const col = isUuid(employeeRef) ? 'id' : 'employee_id';
  const { error } = await supabase.from('employees').update(dbPatch).eq(col, employeeRef);
  if (error) throw error;
}

async function nextEmployeeId(): Promise<string> {
  const apiBase = String(import.meta.env.VITE_PAYROLL_API_URL ?? '').trim().replace(/\/$/, '');
  if (apiBase) {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.access_token) {
      throw new Error('Sign in required to add employees.');
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
    const id = String(parsed.employee_id ?? '').trim();
    if (!id) throw new Error('Backend did not return next employee id.');
    return id;
  }

  const { data } = await supabase.from('employees').select('employee_id').limit(500);
  let max = 0;
  for (const row of data ?? []) {
    const code = String((row as { employee_id?: string }).employee_id ?? '');
    const m = /^EMP(\d+)$/i.exec(code);
    if (m) {
      max = Math.max(max, parseInt(m[1], 10));
      continue;
    }
    const digits = code.replace(/\D/g, '');
    if (digits) max = Math.max(parseInt(digits.slice(-6), 10) || parseInt(digits, 10), max);
  }
  return `EMP${String(max + 1).padStart(3, '0')}`;
}

async function deleteEmployee(employeeRef: string): Promise<void> {
  const apiBase = String(import.meta.env.VITE_PAYROLL_API_URL ?? '').trim().replace(/\/$/, '');
  if (apiBase) {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.access_token) {
      throw new Error('Sign in required to delete employees.');
    }
    const r = await fetch(`${apiBase}/api/employees/${encodeURIComponent(employeeRef)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${sess.session.access_token}` },
    });
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

  const col = isUuid(employeeRef) ? 'id' : 'employee_id';
  const { error } = await supabase.from('employees').delete().eq(col, employeeRef);
  if (error) throw error;
}

// ── Payroll Settings ─────────────────────────────────────────────────────────

async function getPayrollSettings(): Promise<{ pensionRate: number; taxBrackets: TaxBracketRow[] }> {
  const [{ data: settings }, { data: brackets }] = await Promise.all([
    supabase.from('payroll_settings').select('*').eq('id', 1).single(),
    supabase.from('tax_brackets').select('*').order('sort_order'),
  ]);
  return {
    pensionRate: (settings as PayrollSettingsRow | null)?.pension_rate ?? 6,
    taxBrackets: (brackets ?? []) as TaxBracketRow[],
  };
}

async function savePayrollSettings(
  pensionRate: number,
  taxBrackets: Pick<TaxBracketRow, 'min_income' | 'max_income' | 'rate' | 'base_amount'>[],
): Promise<void> {
  await supabase.from('payroll_settings').upsert({ id: 1, pension_rate: pensionRate, updated_at: new Date().toISOString() });
  await supabase.from('tax_brackets').delete().neq('id', 0);
  if (taxBrackets.length > 0) {
    await supabase.from('tax_brackets').insert(
      taxBrackets.map((b, i) => ({ ...b, sort_order: i + 1 })),
    );
  }
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

async function savePayrollRun(payPeriod: string, entries: SavePayrollEntryInput[]): Promise<PayrollRunRow> {
  const totalNetPay = entries.reduce((s, e) => s + e.net_pay, 0);
  const { data: run, error } = await supabase
    .from('payroll_runs')
    .insert({ pay_period: payPeriod, total_net_pay: totalNetPay, employee_count: entries.length })
    .select()
    .single();
  if (error || !run) throw error;
  await supabase.from('payroll_entries').insert(
    entries.map(e => ({ ...e, payroll_run_id: run.id, processed_date: new Date().toISOString().split('T')[0] })),
  );
  return run as PayrollRunRow;
}

async function listEmployeePayrollEntries(employeeId: string): Promise<PayrollEntryRow[]> {
  const { data, error } = await supabase
    .from('payroll_entries')
    .select('*')
    .eq('employee_id', employeeId)
    .order('processed_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PayrollEntryRow[];
}

async function getLatestPayrollRun(): Promise<PayrollRunRow | null> {
  const apiBase = String(import.meta.env.VITE_PAYROLL_API_URL ?? '').trim().replace(/\/$/, '');
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
  const { data, error } = await supabase
    .from('payroll_runs')
    .select('*')
    .order('processed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as PayrollRunRow) ?? null;
}

async function countPendingAudits(): Promise<number> {
  const apiBase = String(import.meta.env.VITE_PAYROLL_API_URL ?? '').trim().replace(/\/$/, '');
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
  const { count, error } = await supabase
    .from('payroll_entries')
    .select('id', { count: 'exact', head: true })
    .eq('audit_status', 'pending');
  if (error) throw error;
  return count ?? 0;
}

async function getPayrollTrends(): Promise<{ month: string; amount: number }[]> {
  const apiBase = String(import.meta.env.VITE_PAYROLL_API_URL ?? '').trim().replace(/\/$/, '');
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
  const { data } = await supabase
    .from('payroll_runs')
    .select('processed_at, total_net_pay')
    .order('processed_at', { ascending: true })
    .limit(12);
  return (data ?? []).map(r => ({
    month: new Date(r.processed_at as string).toLocaleString('default', { month: 'short' }),
    amount: r.total_net_pay as number,
  }));
}

async function getDepartmentPayroll(): Promise<{ department: string; amount: number }[]> {
  const apiBase = String(import.meta.env.VITE_PAYROLL_API_URL ?? '').trim().replace(/\/$/, '');
  if (apiBase) {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.access_token) return [];
    const r = await fetch(`${apiBase}/api/payroll/department-payroll`, {
      headers: { Authorization: `Bearer ${sess.session.access_token}` },
    });
    const raw = await r.text();
    if (!r.ok) throw new Error(raw);
    return raw ? (JSON.parse(raw) as { department: string; amount: number }[]) : [];
  }
  const { data: latestRun } = await supabase
    .from('payroll_runs')
    .select('id')
    .order('processed_at', { ascending: false })
    .limit(1)
    .single();
  if (!latestRun) return [];
  const { data: entries } = await supabase
    .from('payroll_entries')
    .select('department, net_pay')
    .eq('payroll_run_id', latestRun.id);
  const map: Record<string, number> = {};
  for (const e of entries ?? []) {
    map[e.department as string] = (map[e.department as string] ?? 0) + (e.net_pay as number);
  }
  return Object.entries(map).map(([department, amount]) => ({ department, amount }));
}

async function getYtdPayroll(year: string): Promise<{ month: string; payroll: number; employees: number }[]> {
  const { data } = await supabase
    .from('payroll_runs')
    .select('processed_at, total_net_pay, employee_count')
    .gte('processed_at', `${year}-01-01`)
    .lte('processed_at', `${year}-12-31 23:59:59`)
    .order('processed_at');
  return (data ?? []).map(r => ({
    month: new Date(r.processed_at as string).toLocaleString('default', { month: 'short' }),
    payroll: r.total_net_pay as number,
    employees: r.employee_count as number,
  }));
}

async function getDepartmentStats(): Promise<{ department: string; totalSalary: number; employees: number }[]> {
  const { data: latestRun } = await supabase
    .from('payroll_runs')
    .select('id')
    .order('processed_at', { ascending: false })
    .limit(1)
    .single();
  if (!latestRun) return [];
  const { data: entries } = await supabase
    .from('payroll_entries')
    .select('department, net_pay')
    .eq('payroll_run_id', latestRun.id);
  const map: Record<string, { totalSalary: number; employees: number }> = {};
  for (const e of entries ?? []) {
    const dept = e.department as string;
    if (!map[dept]) map[dept] = { totalSalary: 0, employees: 0 };
    map[dept]!.totalSalary += e.net_pay as number;
    map[dept]!.employees += 1;
  }
  return Object.entries(map).map(([department, s]) => ({ department, ...s }));
}

// ── Audit Queue ──────────────────────────────────────────────────────────────

async function listAuditEntries(): Promise<PayrollEntryRow[]> {
  const { data, error } = await supabase
    .from('payroll_entries')
    .select('*, payroll_runs(pay_period, processed_at)')
    .order('processed_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PayrollEntryRow[];
}

async function approveEntry(id: string, auditor: string): Promise<void> {
  const { error } = await supabase
    .from('payroll_entries')
    .update({ audit_status: 'approved', auditor, audit_date: new Date().toISOString().split('T')[0] })
    .eq('id', id);
  if (error) throw error;
}

async function flagEntry(id: string, auditor: string, comments: string): Promise<void> {
  const { error } = await supabase
    .from('payroll_entries')
    .update({ audit_status: 'flagged', auditor, audit_date: new Date().toISOString().split('T')[0], audit_comments: comments })
    .eq('id', id);
  if (error) throw error;
}

// ── Notifications ────────────────────────────────────────────────────────────

async function listNotifications(): Promise<NotificationRow[]> {
  const apiBase = String(import.meta.env.VITE_PAYROLL_API_URL ?? '').trim().replace(/\/$/, '');
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
  const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as NotificationRow[];
}

async function addNotification(title: string, message: string): Promise<NotificationRow> {
  const { data, error } = await supabase.from('notifications').insert({ title, message }).select().single();
  if (error) throw error;
  return data as NotificationRow;
}

async function markNotificationRead(id: number): Promise<void> {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
}

async function clearAllNotifications(): Promise<void> {
  await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
}

// ── Recent Activity (dashboard) ──────────────────────────────────────────────

async function getRecentActivity(): Promise<{ name: string; department: string; action: string; date: string }[]> {
  const apiBase = String(import.meta.env.VITE_PAYROLL_API_URL ?? '').trim().replace(/\/$/, '');
  if (apiBase) {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.access_token) return [];
    const r = await fetch(`${apiBase}/api/recent-activity`, {
      headers: { Authorization: `Bearer ${sess.session.access_token}` },
    });
    const raw = await r.text();
    if (!r.ok) throw new Error(raw);
    return raw ? (JSON.parse(raw) as { name: string; department: string; action: string; date: string }[]) : [];
  }
  const joined = await supabase
    .from('employees')
    .select('first_name, last_name, departments(name), created_at, updated_at')
    .order('updated_at', { ascending: false })
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
      .from('employees')
      .select('first_name, last_name, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5);
    rows = (plain.data ?? []) as Row[];
  }

  return rows.map(e => {
    const dept = e.departments?.name;
    return {
      name: `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim() || 'Employee',
      department: typeof dept === 'string' ? dept : '—',
      action: String(e.created_at) === String(e.updated_at) ? 'Added' : 'Updated',
      date: String(e.updated_at ?? '').split('T')[0] ?? '',
    };
  });
}

// ── Exported db object ───────────────────────────────────────────────────────

export const db = {
  employees: {
    list: listEmployees,
    getByIdentifier: getEmployeeByIdentifier,
    insert: insertEmployee,
    update: updateEmployee,
    nextId: nextEmployeeId,
    delete: deleteEmployee,
  },
  settings: {
    get: getPayrollSettings,
    save: savePayrollSettings,
  },
  payroll: {
    saveRun: savePayrollRun,
    trends: getPayrollTrends,
    departmentPayroll: getDepartmentPayroll,
    ytd: getYtdPayroll,
    departmentStats: getDepartmentStats,
    latestRun: getLatestPayrollRun,
    listEmployeeEntries: listEmployeePayrollEntries,
    countPendingAudits,
  },
  audit: {
    list: listAuditEntries,
    approve: approveEntry,
    flag: flagEntry,
  },
  notifications: {
    list: listNotifications,
    add: addNotification,
    markRead: markNotificationRead,
    clearAll: clearAllNotifications,
  },
  recentActivity: getRecentActivity,
};
