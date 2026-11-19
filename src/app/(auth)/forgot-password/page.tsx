import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthLoading, ForgotPasswordScreen } from '@/components/auth/auth-screens';

export const metadata: Metadata = {
  title: 'Forgot password',
  description: 'Request a password reset link for your iSchoolie account.',
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <ForgotPasswordScreen />
    </Suspense>
  );
}
