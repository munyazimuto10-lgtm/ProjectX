const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface SavePayrollPayload {
  payPeriod: string;
  employees: Array<{
    id: string;
    name: string;
    department: string;
    basePay: number;
    tax: number;
    pension: number;
    netPay: number;
  }>;
}

export interface SavePayrollResponse {
  status: string;
  data: {
    payPeriod: string;
    employeeCount: number;
    totalNetPay: number;
    processedAt: string;
  };
}

export const api = {
  health: () => request<{ status: string }>('/health'),

  savePayroll: (payload: SavePayrollPayload) =>
    request<SavePayrollResponse>('/payroll/process', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
