/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Set to `"true"` to skip portal vs metadata role checks (development only). */
  readonly VITE_AUTH_RELAX_ROLE?: string;
  /** ProjectX backend base URL for RLS-safe employee insert, e.g. http://localhost:3000 */
  readonly VITE_PAYROLL_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
