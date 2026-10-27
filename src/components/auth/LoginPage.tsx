import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Mail, AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface LoginPageProps {
  onBackToLanding: () => void;
  onSubmitEmail: (email: string) => void;
  onEnterWorkspaceDirectly: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onBackToLanding,
  onSubmitEmail,
  onEnterWorkspaceDirectly,
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Email format validation
  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setError('Please enter your email address.');
      return false;
    }
    // Standard RFC-compliant email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      setError('Please enter a valid email address (e.g. name@example.com).');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      return;
    }

    setIsLoading(true);
    // Simulate brief network submission for realistic UX
    setTimeout(() => {
      setIsLoading(false);
      onSubmitEmail(email.trim());
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-[#191927] flex flex-col justify-between selection:bg-[#08C83D]/20">
      {/* Top Header */}
      <header className="px-6 py-5 max-w-5xl mx-auto w-full flex items-center justify-between">
        <button
          onClick={onBackToLanding}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#646477] hover:text-[#191927] transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Bucket</span>
        </button>

        {/* Brand */}
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#191927] text-white shrink-0"
            aria-hidden="true"
          >
            <svg
              className="w-4 h-4 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 11 17.5 20a2 2 0 0 1-2 1.8H8.5A2 2 0 0 1 6.5 20L5 11" />
              <path d="M4 11h16" />
              <path d="M9 11V6a3 3 0 0 1 6 0v5" />
            </svg>
          </div>
          <span className="text-sm font-bold text-[#191927]">Bucket</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-md bg-white border border-[#E8E8EE] rounded-2xl p-6 sm:p-8 shadow-sm">
          {/* Card Header */}
          <div className="text-center space-y-2 mb-7">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FAFAFC] border border-[#E8E8EE] mb-2 text-[#191927]">
              <Mail className="w-5 h-5 text-[#191927]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#191927]">
              Sign in to Bucket
            </h1>
            <p className="text-xs text-[#646477] max-w-xs mx-auto">
              Passwordless authentication. Enter your email to receive a temporary login code or magic link.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="email-input"
                className="block text-xs font-semibold text-[#191927] mb-1.5"
              >
                Email address
              </label>
              <div className="relative">
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="alex@example.com"
                  autoComplete="email"
                  autoFocus
                  disabled={isLoading}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-[#FAFAFC] text-[#191927] placeholder:text-[#8E8EA0] transition-colors focus:bg-white focus:outline-none focus:ring-2 ${
                    error
                      ? 'border-red-400 focus:ring-red-300'
                      : 'border-[#E8E8EE] focus:border-[#191927] focus:ring-[#191927]/10'
                  }`}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'email-error' : undefined}
                />
              </div>

              {error && (
                <div
                  id="email-error"
                  className="mt-2 flex items-center gap-1.5 text-xs text-red-600 font-medium"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#191927] hover:bg-[#2C2C3F] active:bg-[#0E0E18] disabled:opacity-60 rounded-lg shadow-xs transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#191927]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending code...</span>
                </>
              ) : (
                <>
                  <span>Continue with email</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E8E8EE]" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white px-3 text-[#8E8EA0] font-semibold tracking-wider">
                or
              </span>
            </div>
          </div>

          {/* Quick Direct Workspace Access */}
          <button
            type="button"
            onClick={onEnterWorkspaceDirectly}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#191927] bg-[#FAFAFC] hover:bg-[#F3F3F7] border border-[#E8E8EE] rounded-lg transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#08C83D]" />
            <span>Launch workspace directly without email</span>
          </button>

          {/* Clear Frontend Demo Disclaimer */}
          <div className="mt-6 pt-5 border-t border-[#F0F0F4] text-center">
            <p className="text-[11px] text-[#8E8EA0] leading-relaxed">
              <strong>Frontend Demo:</strong> This simulates a passwordless authentication flow.
              No credentials or data are transmitted to external servers.
            </p>
          </div>
        </div>
      </main>

      {/* Footer Note */}
      <footer className="py-6 px-4 text-center text-xs text-[#8E8EA0]">
        <span>Bucket • A calm space for goals, notes, and everyday progress</span>
      </footer>
    </div>
  );
};
