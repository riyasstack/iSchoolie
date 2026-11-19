import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthLoading, ResetPasswordScreen } from '@/components/auth/auth-screens';

export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Choose a new password for your iSchoolie account.',
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <ResetPasswordScreen />
    </Suspense>
  );
}
