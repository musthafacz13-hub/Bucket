import React, { useState, useRef } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import { signUp, AuthUser } from '../../services/authService';
import { getTurnstileSiteKey, TurnstileWidget, TurnstileWidgetRef } from './TurnstileWidget';

interface SignUpFormProps {
  onSuccess: (user: AuthUser) => void;
  onNavigateLogin: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
  onSuccess,
  onNavigateLogin,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const turnstileRef = useRef<TurnstileWidgetRef>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = (): boolean => {
    const errors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      errors.name = 'Full name is required.';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.email = 'Please enter a valid email address.';
      }
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm your password.';
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validate()) {
      return;
    }

    if (!captchaToken) {
      setFormError(
        getTurnstileSiteKey()
          ? 'Please complete the security verification before creating your account.'
          : 'Security verification is not configured for this deployment. Add VITE_TURNSTILE_SITE_KEY in Vercel and redeploy.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUp({
        name,
        email,
        password,
        captchaToken: captchaToken || undefined,
      });
      if (result.success && result.user) {
        if (result.requiresEmailVerification) {
          setIsVerificationSent(true);
        } else {
          onSuccess(result.user);
        }
      } else {
        setFormError(result.error || 'Failed to create account. Please try again.');
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

  // If email verification is required by Supabase project settings:
  if (isVerificationSent) {
    return (
      <div className="space-y-4 text-center py-2 animate-in fade-in duration-200">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#08C83D] border border-emerald-100 flex items-center justify-center mx-auto mb-2">
          <Mail className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-[#191927]">Check your email</h3>
        <p className="text-xs text-[#646477] leading-relaxed max-w-xs mx-auto">
          We have sent an activation link to <strong className="text-[#191927]">{email}</strong>.
          Click the link in the message to confirm your account and sign in.
        </p>

        <div className="pt-4">
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
    <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
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

      {/* Name Input */}
      <div>
        <label
          htmlFor="signup-name"
          className="block text-xs font-semibold text-[#191927] mb-1"
        >
          Full Name
        </label>
        <input
          id="signup-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
          }}
          autoComplete="name"
          autoFocus
          disabled={isLoading}
          placeholder="Alex Mercer"
          className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-[#FAFAFC] text-[#191927] placeholder:text-[#8E8EA0] transition-colors focus:bg-white focus:outline-none focus:ring-2 ${
            fieldErrors.name
              ? 'border-red-400 focus:ring-red-200'
              : 'border-[#E8E8EE] focus:border-[#191927] focus:ring-[#191927]/10'
          }`}
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? 'signup-name-error' : undefined}
        />
        {fieldErrors.name && (
          <p id="signup-name-error" className="mt-1 text-xs text-red-600 font-medium">
            {fieldErrors.name}
          </p>
        )}
      </div>

      {/* Email Input */}
      <div>
        <label
          htmlFor="signup-email"
          className="block text-xs font-semibold text-[#191927] mb-1"
        >
          Email address
        </label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
          }}
          autoComplete="email"
          disabled={isLoading}
          placeholder="alex@example.com"
          className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-[#FAFAFC] text-[#191927] placeholder:text-[#8E8EA0] transition-colors focus:bg-white focus:outline-none focus:ring-2 ${
            fieldErrors.email
              ? 'border-red-400 focus:ring-red-200'
              : 'border-[#E8E8EE] focus:border-[#191927] focus:ring-[#191927]/10'
          }`}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? 'signup-email-error' : undefined}
        />
        {fieldErrors.email && (
          <p id="signup-email-error" className="mt-1 text-xs text-red-600 font-medium">
            {fieldErrors.email}
          </p>
        )}
      </div>

      {/* Password Input */}
      <div>
        <label
          htmlFor="signup-password"
          className="block text-xs font-semibold text-[#191927] mb-1"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            autoComplete="new-password"
            disabled={isLoading}
            placeholder="At least 8 characters"
            className={`w-full pl-3.5 pr-10 py-2 text-sm rounded-lg border bg-[#FAFAFC] text-[#191927] placeholder:text-[#8E8EA0] transition-colors focus:bg-white focus:outline-none focus:ring-2 ${
              fieldErrors.password
                ? 'border-red-400 focus:ring-red-200'
                : 'border-[#E8E8EE] focus:border-[#191927] focus:ring-[#191927]/10'
            }`}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'signup-password-error' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8E8EA0] hover:text-[#191927] transition-colors cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {fieldErrors.password && (
          <p id="signup-password-error" className="mt-1 text-xs text-red-600 font-medium">
            {fieldErrors.password}
          </p>
        )}
      </div>

      {/* Confirm Password Input */}
      <div>
        <label
          htmlFor="signup-confirm-password"
          className="block text-xs font-semibold text-[#191927] mb-1"
        >
          Confirm Password
        </label>
        <div className="relative">
          <input
            id="signup-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword)
                setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            autoComplete="new-password"
            disabled={isLoading}
            placeholder="Repeat your password"
            className={`w-full pl-3.5 pr-10 py-2 text-sm rounded-lg border bg-[#FAFAFC] text-[#191927] placeholder:text-[#8E8EA0] transition-colors focus:bg-white focus:outline-none focus:ring-2 ${
              fieldErrors.confirmPassword
                ? 'border-red-400 focus:ring-red-200'
                : 'border-[#E8E8EE] focus:border-[#191927] focus:ring-[#191927]/10'
            }`}
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            aria-describedby={fieldErrors.confirmPassword ? 'signup-confirm-error' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8E8EA0] hover:text-[#191927] transition-colors cursor-pointer"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {fieldErrors.confirmPassword && (
          <p id="signup-confirm-error" className="mt-1 text-xs text-red-600 font-medium">
            {fieldErrors.confirmPassword}
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
        className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#191927] hover:bg-[#2C2C3F] active:bg-[#0E0E18] disabled:opacity-60 rounded-lg shadow-xs transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#191927]"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Creating account...</span>
          </>
        ) : (
          <span>Create Account</span>
        )}
      </button>

      {/* Link to Login */}
      <div className="pt-2 text-center text-xs text-[#646477]">
        <span>Already have an account? </span>
        <button
          type="button"
          onClick={onNavigateLogin}
          className="font-semibold text-[#191927] hover:underline cursor-pointer"
        >
          Sign in
        </button>
      </div>
    </form>
  );
};
