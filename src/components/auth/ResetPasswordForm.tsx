import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { updatePassword } from '../../services/authService';

interface ResetPasswordFormProps {
  onSuccess: () => void;
  onNavigateLogin: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  onSuccess,
  onNavigateLogin,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = (): boolean => {
    const errors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      errors.password = 'New password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm your new password.';
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

    setIsLoading(true);
    try {
      const result = await updatePassword(password);
      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setFormError(result.error || 'Failed to update password. Your reset link may have expired.');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-4 text-center py-2 animate-in fade-in duration-200">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#08C83D] border border-emerald-100 flex items-center justify-center mx-auto mb-2">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-[#191927]">Password Updated</h3>
        <p className="text-xs text-[#646477] leading-relaxed max-w-xs mx-auto">
          Your password has been securely updated. Redirecting to your workspace...
        </p>
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

      {/* New Password Input */}
      <div>
        <label
          htmlFor="reset-new-password"
          className="block text-xs font-semibold text-[#191927] mb-1.5"
        >
          New Password
        </label>
        <div className="relative">
          <input
            id="reset-new-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            autoComplete="new-password"
            autoFocus
            disabled={isLoading}
            placeholder="At least 8 characters"
            className={`w-full pl-3.5 pr-10 py-2 text-sm rounded-lg border bg-[#FAFAFC] text-[#191927] placeholder:text-[#8E8EA0] transition-colors focus:bg-white focus:outline-none focus:ring-2 ${
              fieldErrors.password
                ? 'border-red-400 focus:ring-red-200'
                : 'border-[#E8E8EE] focus:border-[#191927] focus:ring-[#191927]/10'
            }`}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'reset-new-password-error' : undefined}
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
          <p id="reset-new-password-error" className="mt-1 text-xs text-red-600 font-medium">
            {fieldErrors.password}
          </p>
        )}
      </div>

      {/* Confirm New Password Input */}
      <div>
        <label
          htmlFor="reset-confirm-password"
          className="block text-xs font-semibold text-[#191927] mb-1.5"
        >
          Confirm New Password
        </label>
        <div className="relative">
          <input
            id="reset-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword)
                setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            autoComplete="new-password"
            disabled={isLoading}
            placeholder="Repeat new password"
            className={`w-full pl-3.5 pr-10 py-2 text-sm rounded-lg border bg-[#FAFAFC] text-[#191927] placeholder:text-[#8E8EA0] transition-colors focus:bg-white focus:outline-none focus:ring-2 ${
              fieldErrors.confirmPassword
                ? 'border-red-400 focus:ring-red-200'
                : 'border-[#E8E8EE] focus:border-[#191927] focus:ring-[#191927]/10'
            }`}
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            aria-describedby={fieldErrors.confirmPassword ? 'reset-confirm-password-error' : undefined}
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
          <p id="reset-confirm-password-error" className="mt-1 text-xs text-red-600 font-medium">
            {fieldErrors.confirmPassword}
          </p>
        )}
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
            <span>Updating password...</span>
          </>
        ) : (
          <span>Update Password</span>
        )}
      </button>

      {/* Cancel and return to Login */}
      <div className="pt-2 text-center text-xs text-[#646477]">
        <button
          type="button"
          onClick={onNavigateLogin}
          className="hover:text-[#191927] hover:underline cursor-pointer"
        >
          Cancel and return to Sign in
        </button>
      </div>
    </form>
  );
};
