import React, { useState, useRef } from 'react';
import { Mail, Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { resetPasswordForEmail } from '../../services/authService';
import { TurnstileWidget, TurnstileWidgetRef } from './TurnstileWidget';

interface ForgotPasswordFormProps {
  onNavigateLogin: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onNavigateLogin }) => {
  const [email, setEmail] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const turnstileRef = useRef<TurnstileWidgetRef>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setEmailError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPasswordForEmail(trimmed, captchaToken || undefined);
      if (result.success) {
        setIsSubmitted(true);
      } else {
        setFormError(result.error || 'Failed to send reset link. Please check your network.');
        turnstileRef.current?.reset();
        setCaptchaToken('');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      turnstileRef.current?.reset();
      setCaptchaToken('');
    } finally {
      setIsLoading(false);
    }
  };

  // Secure success state: does not leak account existence
  if (isSubmitted) {
    return (
      <div className="space-y-4 text-center py-2 animate-in fade-in duration-200">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#08C83D] border border-emerald-100 flex items-center justify-center mx-auto mb-2">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-[#191927]">Instructions sent</h3>
        <p className="text-xs text-[#646477] leading-relaxed max-w-xs mx-auto">
          If an account exists for <strong className="text-[#191927]">{email}</strong>, we have
          sent password reset instructions to your inbox.
        </p>

        <div className="pt-4 space-y-2">
          <button
            type="button"
            onClick={onNavigateLogin}
            className="w-full inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-[#191927] hover:bg-[#2C2C3F] rounded-lg transition-colors cursor-pointer"
          >
            Return to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Global Form Error */}
      {formError && (
        <div
          className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{formError}</span>
        </div>
      )}

      {/* Email Input */}
      <div>
        <label
          htmlFor="forgot-email"
          className="block text-xs font-semibold text-[#191927] mb-1.5"
        >
          Account email
        </label>
        <input
          id="forgot-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(null);
          }}
          autoComplete="email"
          autoFocus
          disabled={isLoading}
          placeholder="alex@example.com"
          className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-[#FAFAFC] text-[#191927] placeholder:text-[#8E8EA0] transition-colors focus:bg-white focus:outline-none focus:ring-2 ${
            emailError
              ? 'border-red-400 focus:ring-red-200'
              : 'border-[#E8E8EE] focus:border-[#191927] focus:ring-[#191927]/10'
          }`}
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? 'forgot-email-error' : undefined}
        />
        {emailError && (
          <p id="forgot-email-error" className="mt-1 text-xs text-red-600 font-medium">
            {emailError}
          </p>
        )}
      </div>

      {/* Cloudflare Turnstile CAPTCHA Protection */}
      <div className="pt-1 flex flex-col items-center">
        <TurnstileWidget
          ref={turnstileRef}
          onSuccess={(token) => setCaptchaToken(token)}
          onError={() => setCaptchaToken('')}
          onExpire={() => setCaptchaToken('')}
          theme="light"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#191927] hover:bg-[#2C2C3F] active:bg-[#0E0E18] disabled:opacity-60 rounded-lg shadow-xs transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#191927]"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Sending instructions...</span>
          </>
        ) : (
          <span>Send Reset Link</span>
        )}
      </button>

      {/* Return to Login */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={onNavigateLogin}
          className="inline-flex items-center gap-1.5 text-xs text-[#646477] hover:text-[#191927] transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Sign in</span>
        </button>
      </div>
    </form>
  );
};
