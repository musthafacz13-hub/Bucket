import React from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  onBackToLanding: () => void;
  onContinueOffline?: () => void;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  onBackToLanding,
  onContinueOffline,
  children,
}) => {
  const isConfigured = isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-[#191927] flex flex-col justify-between selection:bg-[#08C83D]/20">
      {/* Top Header */}
      <header className="px-6 py-5 max-w-5xl mx-auto w-full flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToLanding}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#646477] hover:text-[#191927] transition-colors cursor-pointer group"
          aria-label="Return to Bucket landing page"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Bucket</span>
        </button>

        {/* Minimalist Brand Logo */}
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
          <span className="text-sm font-bold tracking-tight text-[#191927]">Bucket</span>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-md bg-white border border-[#E8E8EE] rounded-xl p-6 sm:p-8 shadow-xs">
          {/* Header Typography */}
          <div className="space-y-1.5 mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[#191927]">
              {title}
            </h1>
            <p className="text-xs text-[#646477] leading-relaxed max-w-sm mx-auto">
              {subtitle}
            </p>
          </div>

          {/* Missing Backend Credentials Advisory */}
          {!isConfigured && (
            <div
              className="mb-5 p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-950">Backend Setup Required</p>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Supabase environment variables (<code className="font-mono text-amber-950 font-medium">VITE_SUPABASE_URL</code> and <code className="font-mono text-amber-950 font-medium">VITE_SUPABASE_ANON_KEY</code>) must be configured to process real account requests.
                </p>
              </div>
            </div>
          )}

          {/* Form and Actions */}
          {children}

          {/* Optional Guest Mode Access */}
          {onContinueOffline && (
            <div className="mt-6 pt-5 border-t border-[#F0F0F4] text-center">
              <button
                type="button"
                onClick={onContinueOffline}
                className="text-xs font-medium text-[#646477] hover:text-[#191927] hover:underline cursor-pointer transition-colors"
              >
                Or explore the workspace offline (guest mode)
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-5 px-4 text-center text-xs text-[#8E8EA0]">
        <span>Bucket • A calm space for goals, notes, and everyday progress</span>
      </footer>
    </div>
  );
};
