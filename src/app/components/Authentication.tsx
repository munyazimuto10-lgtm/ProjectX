// Import React state hook
import { useState } from "react";
// Import icon components from lucide-react
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Shield,
  ArrowLeft,
  User,
  ChevronRight,
} from "lucide-react";
// Import Supabase client for authentication
import { supabase } from "@/lib/supabase";
// Import AppRole type
import type { AppRole } from "@/lib/auth";
// Import authentication utility functions
import {
  isAuthRelaxMode,
  PROJECTX_PORTAL_ROLE_KEY,
  roleFromUser,
} from "@/lib/auth";

// Authentication component - handles login, password reset, and role selection
export function Authentication() {
  // Tracks which authentication screen is currently displayed (role selection, login, or forgot password)
  const [authScreen, setAuthScreen] = useState<
    "role-select" | "login" | "forgot"
  >("role-select");
  // Currently selected role (admin or employee) by the user
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  // Email address entered in login form
  const [email, setEmail] = useState("");
  // Password entered in login form
  const [password, setPassword] = useState("");
  // Toggles password visibility in input field
  const [showPassword, setShowPassword] = useState(false);
  // Loading state while authentication requests are in progress
  const [isLoading, setIsLoading] = useState(false);
  // Error message to display to user
  const [error, setError] = useState("");
  // Email entered in forgot password form
  const [resetEmail, setResetEmail] = useState("");
  // Tracks whether password reset email has been successfully sent
  const [resetSent, setResetSent] = useState(false);

  // Verify that the authenticated user has the correct role for the selected portal
  const verifyRoleOrSignOut = async (intent: AppRole): Promise<boolean> => {
    // Check if auth relax mode is enabled
    const relax = isAuthRelaxMode();
    // Get currently authenticated user from Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // Return false if no user is logged in
    if (!user) return false;
    // In relax mode, skip role verification
    if (relax) return true;
    // Get the actual role from user metadata
    const actual = roleFromUser(user);
    // If no role found in metadata, sign out and show error
    if (actual === null) {
      setError(
        'This account has no role in user metadata. In Supabase → Authentication → Users, set User Metadata to e.g. { "role": "admin" } or { "role": "employee" }.',
      );
      await supabase.auth.signOut();
      return false;
    }
    // If actual role doesn't match intended role, sign out and show error
    if (actual !== intent) {
      setError(
        `This account is registered as ${actual}, not ${intent}. Use the correct portal or update user metadata.`,
      );
      await supabase.auth.signOut();
      return false;
    }
    // Role verification successful
    return true;
  };

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    // Prevent form default submission behavior
    e.preventDefault();
    // Clear any previous errors
    setError("");
    // Validate that a role has been selected
    if (!selectedRole) {
      setError("Select Admin or Employee portal first.");
      return;
    }
    // Validate that email and password are provided
    if (!email.trim() || !password) {
      setError("Please enter email and password");
      return;
    }

    // Set loading state
    setIsLoading(true);
    // Attempt to sign in with email and password via Supabase
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    // If sign-in failed, show error and reset loading state
    if (signErr) {
      setError(signErr.message);
      setIsLoading(false);
      return;
    }

    // Save the selected role to localStorage for relax mode
    try {
      localStorage.setItem(PROJECTX_PORTAL_ROLE_KEY, selectedRole);
    } catch {
      /* ignore localStorage errors */
    }

    // Verify the user has the correct role
    const ok = await verifyRoleOrSignOut(selectedRole);
    // Reset loading state
    setIsLoading(false);
    // Clear password if login successful
    if (ok) setPassword("");
  };

  // Handle forgot password form submission
  const handleForgotPassword = async (e: React.FormEvent) => {
    // Prevent form default submission behavior
    e.preventDefault();
    // Clear any previous errors
    setError("");
    // Set loading state
    setIsLoading(true);
    // Validate that email is provided
    if (!resetEmail.trim()) {
      setError("Please enter your email address");
      setIsLoading(false);
      return;
    }
    // Build the redirect URL for password reset (back to login page)
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
    // Call Supabase password reset function
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
      resetEmail.trim(),
      {
        redirectTo,
      },
    );
    // Reset loading state
    setIsLoading(false);
    // If reset failed, show error
    if (resetErr) {
      setError(resetErr.message);
      return;
    }
    // Mark that reset email has been sent successfully
    setResetSent(true);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Project-X Payroll System
          </h1>
          <p className="text-gray-600">
            {authScreen === "role-select"
              ? "Select your account type"
              : authScreen === "login"
                ? "Sign in with your email"
                : "Reset your password"}
          </p>
        </div>

        {authScreen === "role-select" && (
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setSelectedRole("admin");
                setAuthScreen("login");
                setError("");
              }}
              className="w-full bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8 hover:border-blue-500 hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Admin Portal
                  </h3>
                  <p className="text-sm text-gray-600">
                    Payroll management (requires role &quot;admin&quot; in user
                    metadata)
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole("employee");
                setAuthScreen("login");
                setError("");
              }}
              className="w-full bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8 hover:border-green-500 hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Employee Portal
                  </h3>
                  <p className="text-sm text-gray-600">
                    Payslips & profile (requires role &quot;employee&quot;)
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          </div>
        )}

        {authScreen === "login" && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="you@company.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAuthScreen("forgot");
                    setError("");
                    setResetSent(false);
                  }}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthScreen("role-select");
                  setSelectedRole(null);
                  setError("");
                }}
                className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to role selection
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-center text-gray-600">
                Supabase signs you in with a real session so RLS policies can
                use{" "}
                <code className="text-xs bg-gray-100 px-1 rounded">
                  auth.uid()
                </code>
                .
              </p>
            </div>
          </div>
        )}

        {authScreen === "forgot" && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            {!resetSent ? (
              <>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                    <Lock className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Reset Password
                  </h2>
                  <p className="text-sm text-gray-600">
                    We&apos;ll email you a reset link.
                  </p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div>
                    <label
                      htmlFor="reset-email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(ev) => setResetEmail(ev.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your email"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Sending..." : "Send Reset Instructions"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthScreen("login");
                      setResetEmail("");
                      setError("");
                    }}
                    className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Check Your Email
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  If an account exists, we sent instructions to{" "}
                  <strong>{resetEmail}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setAuthScreen("login");
                    setResetEmail("");
                    setResetSent(false);
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
