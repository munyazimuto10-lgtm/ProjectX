// Import Supabase client for getting authentication tokens
import { supabase } from "./supabase";

// Define the base URL for API requests
const API_BASE = "/api";

// Generic fetch wrapper for making API requests with automatic error handling
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  // Initialize headers with default Content-Type
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Get the current Supabase session to retrieve authentication token
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    // If a session exists, add the authorization header with the access token
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
  } catch {
    // Silently fail if unable to get session - allow requests without auth
  }

  // Make a fetch request to the API base URL + path with provided options
  const res = await fetch(`${API_BASE}${path}`, {
    // Merge headers: spread provided options headers, then override with our defaults
    ...options,
    headers: { ...headers, ...(options?.headers ?? {}) },
  });
  // Check if the response status is not OK (200-299)
  if (!res.ok) {
    // Try to parse error response as JSON, fallback to empty object
    const body = await res.json().catch(() => ({}));
    // Throw an error with the response message or a default error message
    throw new Error(
      (body as { message?: string }).message ?? `Request failed: ${res.status}`,
    );
  }
  // Parse and return the response body as JSON
  return res.json() as Promise<T>;
}

// Type definition for the payroll save request payload
export interface SavePayrollPayload {
  // The pay period identifier (e.g., "2026-04-01 - 2026-04-15")
  payPeriod: string;
  // Array of employee payroll data to process
  employees: Array<{
    // Unique employee identifier
    id: string;
    // Employee full name
    name: string;
    // Department name
    department: string;
    // Base pay calculation result
    basePay: number;
    // Tax deduction amount
    tax: number;
    // Pension/retirement contribution amount
    pension: number;
    // Net pay after deductions (basePay - tax - pension)
    netPay: number;
  }>;
}

// Type definition for the payroll save response
export interface SavePayrollResponse {
  // Status message (e.g., "success")
  status: string;
  // Response data with processed payroll details
  data: {
    // The pay period that was processed
    payPeriod: string;
    // Number of employees in the payroll run
    employeeCount: number;
    // Total net pay across all employees
    totalNetPay: number;
    // Timestamp when the payroll was processed
    processedAt: string;
  };
}

// API endpoint definitions
export const api = {
  // Health check endpoint to verify API availability
  health: () => request<{ status: string }>("/health"),

  // Save payroll data - sends employee payroll calculations to the server
  savePayroll: (payload: SavePayrollPayload) =>
    // POST request to the payroll endpoint with the payload serialized as JSON
    request<SavePayrollResponse>("/payroll/process", {
      // HTTP method: POST for creating/saving data
      method: "POST",
      // Serialize the payload to JSON
      body: JSON.stringify(payload),
    }),
};
