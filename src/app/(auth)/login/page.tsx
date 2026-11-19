import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthLoading, LoginScreen } from '@/components/auth/auth-screens';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your iSchoolie account to reach your learning, teaching and guardian workspaces.',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <LoginScreen />
    </Suspense>
  );
}
