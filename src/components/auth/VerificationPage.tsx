import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Mail,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Sparkles,
  KeyRound,
} from 'lucide-react';

interface VerificationPageProps {
  email: string;
  onBackToLogin: () => void;
  onBackToLanding: () => void;
  onVerifySuccess: () => void;
}

export const VerificationPage: React.FC<VerificationPageProps> = ({
  email,
  onBackToLogin,
  onBackToLanding,
  onVerifySuccess,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState<number>(60);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 60s cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Handle single digit input
  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned && value !== '') return;

    const newDigits = [...digits];
    newDigits[index] = cleaned.slice(-1); // Take the latest single digit
    setDigits(newDigits);

    // Auto-advance to next input if filled
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if all 6 digits are filled
    if (cleaned && index === 5 && newDigits.every((d) => d !== '')) {
      handleComplete(newDigits.join(''));
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Handle paste of 6-digit code
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (pastedData) {
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        if (pastedData[i]) {
          newDigits[i] = pastedData[i];
        }
      }
      setDigits(newDigits);
      const nextEmpty = newDigits.findIndex((d) => d === '');
      if (nextEmpty !== -1) {
        inputRefs.current[nextEmpty]?.focus();
      } else {
        inputRefs.current[5]?.focus();
        handleComplete(newDigits.join(''));
      }
    }
  };

  // Verification simulation
  const handleComplete = (code: string) => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onVerifySuccess();
    }, 500);
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    setCooldown(60);
    setResendStatus('A new 6-digit code has been sent!');
    setTimeout(() => {
      setResendStatus(null);
    }, 4000);
  };

  const isCodeComplete = digits.every((d) => d !== '');

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-[#191927] flex flex-col justify-between selection:bg-[#08C83D]/20">
      {/* Top Header */}
      <header className="px-6 py-5 max-w-5xl mx-auto w-full flex items-center justify-between">
        <button
          onClick={onBackToLogin}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#646477] hover:text-[#191927] transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Use a different email</span>
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

      {/* Main Verification Card */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-lg bg-white border border-[#E8E8EE] rounded-2xl p-6 sm:p-8 shadow-sm">
          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-[#08C83D] border border-emerald-100 mb-2">
              <Mail className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#191927]">
              Check your inbox
            </h1>
            <p className="text-xs text-[#646477] max-w-sm mx-auto">
              We sent a temporary sign-in link and verification code to{' '}
              <span className="font-semibold text-[#191927] break-all">{email}</span>
            </p>
          </div>

          {/* Magic Link Explanation Box */}
          <div className="p-4 rounded-xl bg-[#FAFAFC] border border-[#E8E8EE] mb-6 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-[#08C83D] shrink-0 mt-0.5" />
            <div className="text-xs text-[#646477] space-y-1">
              <p className="font-semibold text-[#191927]">
                Two easy ways to sign in:
              </p>
              <p>
                1. <strong>Magic Link:</strong> Click the direct link in your email to sign in instantly.
              </p>
              <p>
                2. <strong>Verification Code:</strong> Or enter the 6-digit code from your email below.
              </p>
            </div>
          </div>

          {/* 6-Digit OTP Code Input */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#191927] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#646477]" />
                <span>6-Digit Verification Code</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setDigits(['4', '8', '2', '9', '1', '0']);
                  handleComplete('482910');
                }}
                className="text-[11px] font-semibold text-[#08C83D] hover:underline cursor-pointer"
              >
                Auto-fill demo code (482910)
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 sm:gap-3">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  aria-label={`Digit ${idx + 1}`}
                  className="w-11 h-13 sm:w-13 sm:h-14 text-center text-xl font-bold rounded-xl border border-[#E8E8EE] bg-[#FAFAFC] text-[#191927] focus:bg-white focus:border-[#191927] focus:outline-none focus:ring-2 focus:ring-[#191927]/10 transition-colors"
                />
              ))}
            </div>

            {/* Verify CTA Button */}
            <button
              type="button"
              onClick={() => handleComplete(digits.join(''))}
              disabled={!isCodeComplete || isVerifying}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#191927] hover:bg-[#2C2C3F] active:bg-[#0E0E18] disabled:opacity-50 rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isVerifying ? 'Verifying...' : 'Verify & Enter Workspace'}</span>
            </button>
          </div>

          {/* Resend Cooldown Section */}
          <div className="mt-6 pt-5 border-t border-[#F0F0F4] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-[#646477]">
              {cooldown > 0 ? (
                <span>Resend available in <strong className="tabular-nums font-semibold text-[#191927]">{cooldown}s</strong></span>
              ) : (
                <span className="text-[#191927] font-medium">Didn't receive the email?</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0}
              className="inline-flex items-center gap-1.5 font-semibold text-[#191927] hover:text-[#08C83D] disabled:opacity-40 disabled:hover:text-[#191927] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Resend code</span>
            </button>
          </div>

          {resendStatus && (
            <div className="mt-3 p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-center text-xs font-medium text-emerald-800 animate-fadeIn">
              {resendStatus}
            </div>
          )}

          {/* Quick links */}
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-[#F0F0F4] text-xs">
            <button
              onClick={onBackToLanding}
              className="text-[#646477] hover:text-[#191927] transition-colors cursor-pointer"
            >
              Back to Home
            </button>
            <button
              onClick={onVerifySuccess}
              className="font-bold text-[#08C83D] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Skip directly to Workspace</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Simulation disclaimer */}
          <div className="mt-5 text-center">
            <p className="text-[11px] text-[#8E8EA0] leading-relaxed">
              <strong>Simulated Verification:</strong> In this frontend environment, any 6-digit code
              or the auto-fill button will successfully transition you to the workspace.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 text-center text-xs text-[#8E8EA0]">
        <span>Bucket • A calm space for goals, notes, and everyday progress</span>
      </footer>
    </div>
  );
};
