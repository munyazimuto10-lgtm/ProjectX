import { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, Shield, ArrowLeft, User, ChevronRight } from 'lucide-react';

interface AuthenticationProps {
  onAuthenticated: (userRole: 'admin' | 'employee') => void;
}

export function Authentication({ onAuthenticated }: AuthenticationProps) {
  const [authScreen, setAuthScreen] = useState<'role-select' | 'login' | 'mfa' | 'forgot'>('role-select');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'employee' | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (username && password) {
        // In a real app, validate credentials with backend
        setAuthScreen('mfa');
        setIsLoading(false);
      } else {
        setError('Please enter both username and password');
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const code = mfaCode.join('');
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      // In a real app, verify MFA code with backend
      if (code === '123456' || code.length === 6) {
        onAuthenticated(selectedRole!);
      } else {
        setError('Invalid verification code');
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleMfaInputChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...mfaCode];
    newCode[index] = value;
    setMfaCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`mfa-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleMfaKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !mfaCode[index] && index > 0) {
      const prevInput = document.getElementById(`mfa-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleResendCode = () => {
    setError('');
    setMfaCode(['', '', '', '', '', '']);
    // Simulate resending code
    const successMsg = document.createElement('div');
    successMsg.className = 'text-green-600 text-sm text-center mt-2';
    successMsg.textContent = 'Verification code resent successfully';
    document.getElementById('resend-message')?.replaceChildren(successMsg);
    setTimeout(() => {
      document.getElementById('resend-message')?.replaceChildren();
    }, 3000);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (resetEmail) {
        setResetSent(true);
        setIsLoading(false);
      } else {
        setError('Please enter your email address');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Project-X Payroll System</h1>
          <p className="text-gray-600">
            {authScreen === 'role-select'
              ? 'Select your account type'
              : authScreen === 'login'
              ? 'Sign in to your account'
              : authScreen === 'mfa'
              ? 'Enter verification code'
              : 'Reset your password'}
          </p>
        </div>

        {/* Role Selection Screen */}
        {authScreen === 'role-select' && (
          <div className="space-y-4">
            <button
              onClick={() => {
                setSelectedRole('admin');
                setAuthScreen('login');
              }}
              className="w-full bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8 hover:border-blue-500 hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Admin Portal</h3>
                  <p className="text-sm text-gray-600">
                    Access full payroll management system
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            <button
              onClick={() => {
                setSelectedRole('employee');
                setAuthScreen('login');
              }}
              className="w-full bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8 hover:border-green-500 hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Employee Portal</h3>
                  <p className="text-sm text-gray-600">
                    View payslips, payments, and tax forms
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          </div>
        )}

        {/* Login Screen */}
        {authScreen === 'login' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your username"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Forgot Password Link */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAuthScreen('forgot')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>

              {/* Back Button */}
              <button
                type="button"
                onClick={() => {
                  setAuthScreen('role-select');
                  setSelectedRole(null);
                  setUsername('');
                  setPassword('');
                  setError('');
                }}
                className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to role selection
              </button>
            </form>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-center text-gray-600">
                Protected by enterprise-grade security
              </p>
            </div>
          </div>
        )}

        {/* MFA Screen */}
        {authScreen === 'mfa' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-600">
                We've sent a 6-digit verification code to your registered device
              </p>
            </div>

            <form onSubmit={handleMfaSubmit} className="space-y-6">
              {/* MFA Code Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                  Enter Verification Code
                </label>
                <div className="flex justify-center gap-2">
                  {mfaCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`mfa-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleMfaInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleMfaKeyDown(index, e)}
                      className="w-12 h-14 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600 text-center">{error}</p>
                </div>
              )}

              {/* Resend Message */}
              <div id="resend-message"></div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              {/* Resend Code */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Resend Code
                </button>
              </div>

              {/* Back Button */}
              <button
                type="button"
                onClick={() => {
                  setAuthScreen('login');
                  setMfaCode(['', '', '', '', '', '']);
                  setError('');
                }}
                className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </button>
            </form>
          </div>
        )}

        {/* Forgot Password Screen */}
        {authScreen === 'forgot' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            {!resetSent ? (
              <>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                    <Lock className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Reset Password</h2>
                  <p className="text-sm text-gray-600">
                    Enter your email address and we'll send you instructions to reset your password
                  </p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-6">
                  {/* Email Field */}
                  <div>
                    <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">
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
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your email"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Instructions'}
                  </button>

                  {/* Back to Login */}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthScreen('login');
                      setResetEmail('');
                      setError('');
                    }}
                    className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                    <Mail className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Check Your Email</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    We've sent password reset instructions to <strong>{resetEmail}</strong>
                  </p>
                  <p className="text-sm text-gray-500 mb-8">
                    If you don't see the email, check your spam folder
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthScreen('login');
                      setResetEmail('');
                      setResetSent(false);
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                  >
                    Back to Login
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
