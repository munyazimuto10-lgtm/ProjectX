import type { User } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'employee';

/** Remember which portal was used when `VITE_AUTH_RELAX_ROLE=true` (no metadata required). */
export const PROJECTX_PORTAL_ROLE_KEY = 'projectx_portal_role';

export function isAuthRelaxMode(): boolean {
  return String(import.meta.env.VITE_AUTH_RELAX_ROLE ?? '').toLowerCase() === 'true';
}

/**
 * Effective role: metadata wins; in relax mode falls back to portal choice in localStorage,
 * then defaults to `admin` so you are not blocked after enabling relax without metadata.
 */
export function resolveAppRole(user: User | null | undefined): AppRole | null {
  if (!user) return null;
  const fromMeta = roleFromUser(user);
  if (fromMeta) return fromMeta;
  if (!isAuthRelaxMode()) return null;
  try {
    const stored = localStorage.getItem(PROJECTX_PORTAL_ROLE_KEY);
    if (stored === 'admin' || stored === 'employee') return stored;
  } catch {
    /* ignore */
  }
  return 'admin';
}

/**
 * Maps Supabase Auth user metadata to an app role.
 * Set in Dashboard: Authentication → Users → user → User Metadata, e.g. { "role": "admin" }
 * Also checks app_metadata.role if you set it via Admin API.
 */
export function roleFromUser(user: User | null | undefined): AppRole | null {
  if (!user) return null;
  const raw =
    (user.user_metadata?.app_role as string | undefined) ??
    (user.user_metadata?.role as string | undefined) ??
    (user.app_metadata?.role as string | undefined);
  if (raw == null || typeof raw !== 'string') return null;
  const x = raw.toLowerCase().trim();
  if (x === 'admin' || x === 'manager' || x === 'accountant') return 'admin';
  if (x === 'employee') return 'employee';
  return null;
}
