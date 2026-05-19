// Import the User type from Supabase to type user objects
import type { User } from "@supabase/supabase-js";

// Define the possible roles in the application
export type AppRole = "admin" | "employee";

// Define a key to store the selected portal role in localStorage (used for relaxed auth mode)
/** Remember which portal was used when `VITE_AUTH_RELAX_MODE=true` (no metadata required). */
export const PROJECTX_PORTAL_ROLE_KEY = "projectx_portal_role";

// Check if authentication relax mode is enabled via environment variable
export function isAuthRelaxMode(): boolean {
  // Get the VITE_AUTH_RELAX_ROLE environment variable and convert it to boolean
  return (
    String(import.meta.env.VITE_AUTH_RELAX_ROLE ?? "").toLowerCase() === "true"
  );
}

/**
 * Effective role: metadata wins; in relax mode falls back to portal choice in localStorage,
 * then defaults to `admin` so you are not blocked after enabling relax without metadata.
 */
// Resolve the effective application role for a user
export function resolveAppRole(user: User | null | undefined): AppRole | null {
  // Return null if user is not provided
  if (!user) return null;
  // Try to get the role from user metadata first
  const fromMeta = roleFromUser(user);
  // If role found in metadata, use it
  if (fromMeta) return fromMeta;
  // If not in relax mode and no role in metadata, return null
  if (!isAuthRelaxMode()) return null;
  // In relax mode, try to get role from localStorage
  try {
    // Retrieve the stored portal role from localStorage
    const stored = localStorage.getItem(PROJECTX_PORTAL_ROLE_KEY);
    // Return stored role if it's valid (admin or employee)
    if (stored === "admin" || stored === "employee") return stored;
  } catch {
    /* ignore errors when accessing localStorage */
  }
  // Default to admin role in relax mode if no other role found
  return "admin";
}

/**
 * Maps Supabase Auth user metadata to an app role.
 * Set in Dashboard: Authentication → Users → user → User Metadata, e.g. { "role": "admin" }
 * Also checks app_metadata.role if you set it via Admin API.
 */
// Extract and normalize the role from user metadata
export function roleFromUser(user: User | null | undefined): AppRole | null {
  // Return null if user is not provided
  if (!user) return null;
  // Try to get role from multiple possible metadata locations (with fallback chain)
  const raw =
    (user.user_metadata?.app_role as string | undefined) ??
    (user.user_metadata?.role as string | undefined) ??
    (user.app_metadata?.role as string | undefined);
  // If no raw value found or not a string, return null
  if (raw == null || typeof raw !== "string") return null;
  // Normalize the role string to lowercase and trim whitespace
  const x = raw.toLowerCase().trim();
  // Map admin-like roles (admin, manager, accountant) to 'admin'
  if (x === "admin" || x === "manager" || x === "accountant") return "admin";
  // Map employee role to 'employee'
  if (x === "employee") return "employee";
  // Return null if role doesn't match known roles
  return null;
}
