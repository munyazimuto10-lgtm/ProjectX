// Import the createClient factory function from Supabase
import { createClient } from "@supabase/supabase-js";

// Get the Supabase URL from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Get the Supabase anonymous key from environment variables
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a Supabase client instance configured for a single-page application with PKCE flow
// This ensures the JWT is sent to PostgREST for Row-Level Security (RLS) and authenticated requests
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  // Authentication configuration
  auth: {
    // Enable session persistence across page reloads
    persistSession: true,
    // Automatically refresh the JWT token when it expires
    autoRefreshToken: true,
    // Check for session in URL parameters (for OAuth redirects)
    detectSessionInUrl: true,
    // Use PKCE (Proof Key for Code Exchange) for enhanced security
    flowType: "pkce",
  },
});
