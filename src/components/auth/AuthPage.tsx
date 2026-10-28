import React, { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { ResetPasswordForm } from './ResetPasswordForm';
import { AuthUser } from '../../services/authService';

export type AuthSubView = 'login' | 'signup' | 'forgot-password' | 'reset-password';

interface AuthPageProps {
  initialView?: AuthSubView;
  onSuccess: (user: AuthUser) => void;
  onBackToLanding: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialView = 'login',
  onSuccess,
  onBackToLanding,
}) => {
  const [subView, setSubView] = useState<AuthSubView>(initialView);

  const getHeaderInfo = () => {
    switch (subView) {
      case 'signup':
        return {
          title: 'Create an account',
          subtitle: 'Start your calm workspace for goals, notes, and progress.',
        };
      case 'forgot-password':
        return {
          title: 'Reset password',
          subtitle: 'Enter your email to receive recovery instructions.',
        };
      case 'reset-password':
        return {
          title: 'Choose new password',
          subtitle: 'Create a new secure password for your Bucket account.',
        };
      case 'login':
      default:
        return {
          title: 'Sign in to Bucket',
          subtitle: 'Welcome back. Enter your account credentials to continue.',
        };
    }
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <AuthLayout
      title={title}
      subtitle={subtitle}
      onBackToLanding={onBackToLanding}
    >
      {subView === 'login' && (
        <LoginForm
          onSuccess={onSuccess}
          onNavigateSignUp={() => setSubView('signup')}
          onNavigateForgotPassword={() => setSubView('forgot-password')}
        />
      )}

      {subView === 'signup' && (
        <SignUpForm
          onSuccess={onSuccess}
          onNavigateLogin={() => setSubView('login')}
        />
      )}

      {subView === 'forgot-password' && (
        <ForgotPasswordForm
          onNavigateLogin={() => setSubView('login')}
        />
      )}

      {subView === 'reset-password' && (
        <ResetPasswordForm
          onSuccess={() => {
            // Direct to login or trigger success
            setSubView('login');
          }}
          onNavigateLogin={() => setSubView('login')}
        />
      )}
    </AuthLayout>
  );
};
