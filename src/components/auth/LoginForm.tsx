import React, { useState, useRef } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { signInWithPassword, AuthUser } from '../../services/authService';
import { getTurnstileSiteKey, TurnstileWidget, TurnstileWidgetRef } from './TurnstileWidget';

interface LoginFormProps {
  onSuccess: (user: AuthUser) => void;
  onNavigateSignUp: () => void;
  onNavigateForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onNavigateSignUp,
  onNavigateForgotPassword,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const turnstileRef = useRef<TurnstileWidgetRef>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};

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
          ? 'Please complete the security verification before signing in.'
          : 'Security verification is not configured for this deployment. Add VITE_TURNSTILE_SITE_KEY in Vercel and redeploy.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithPassword({
        email,
        password,
        captchaToken: captchaToken || undefined,
      });
      if (result.success && result.user) {
        onSuccess(result.user);
      } else {
        setFormError(result.error || 'Failed to sign in. Please verify your credentials.');
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Global Form Error Message */}
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
          htmlFor="login-email"
          className="block text-xs font-semibold text-[#191927] mb-1.5"
        >
          Email address
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
          }}
          autoComplete="email"
          autoFocus
          disabled={isLoading}
          placeholder="alex@example.com"
          className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-[#FAFAFC] text-[#191927] placeholder:text-[#8E8EA0] transition-colors focus:bg-white focus:outline-none focus:ring-2 ${
            fieldErrors.email
              ? 'border-red-400 focus:ring-red-200'
              : 'border-[#E8E8EE] focus:border-[#191927] focus:ring-[#191927]/10'
          }`}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
        />
        {fieldErrors.email && (
          <p id="login-email-error" className="mt-1 text-xs text-red-600 font-medium">
            {fieldErrors.email}
          </p>
        )}
      </div>

      {/* Password Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="login-password"
            className="block text-xs font-semibold text-[#191927]"
          >
            Password
          </label>
          <button
            type="button"
            onClick={onNavigateForgotPassword}
            className="text-xs text-[#646477] hover:text-[#191927] hover:underline cursor-pointer transition-colors"
          >
            Forgot password?
          </button>
        </div>

        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            autoComplete="current-password"
            disabled={isLoading}
            placeholder="••••••••"
            className={`w-full pl-3.5 pr-10 py-2 text-sm rounded-lg border bg-[#FAFAFC] text-[#191927] placeholder:text-[#8E8EA0] transition-colors focus:bg-white focus:outline-none focus:ring-2 ${
              fieldErrors.password
                ? 'border-red-400 focus:ring-red-200'
                : 'border-[#E8E8EE] focus:border-[#191927] focus:ring-[#191927]/10'
            }`}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
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
          <p id="login-password-error" className="mt-1 text-xs text-red-600 font-medium">
            {fieldErrors.password}
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
            <span>Signing in...</span>
          </>
        ) : (
          <span>Sign In</span>
        )}
      </button>

      {/* Navigation Link to Sign Up */}
      <div className="pt-3 text-center text-xs text-[#646477]">
        <span>Don't have an account? </span>
        <button
          type="button"
          onClick={onNavigateSignUp}
          className="font-semibold text-[#191927] hover:underline cursor-pointer"
        >
          Create one now
        </button>
      </div>
    </form>
  );
};
